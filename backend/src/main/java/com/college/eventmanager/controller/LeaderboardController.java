package com.college.eventmanager.controller;

import com.college.eventmanager.model.Event;
import com.college.eventmanager.model.EventScore;
import com.college.eventmanager.model.Registration;
import com.college.eventmanager.repository.EventRepository;
import com.college.eventmanager.repository.EventScoreRepository;
import com.college.eventmanager.repository.RegistrationRepository;
import com.college.eventmanager.service.AuditService;
import com.college.eventmanager.service.AuthContextService;
import com.college.eventmanager.service.TrustedProfileService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Leaderboard and scoring API.
 *
 * Scoring rules (documented and deterministic):
 *  - Marks are stored per participant per event in event_scores (one authoritative row).
 *  - Category score of a participant = SUM(marks) across events in the category.
 *  - Division score = SUM over eligible COLLEGE participants of that division (A–E).
 *  - Branch score = SUM over eligible COLLEGE participants of that branch.
 *  - External participants never enter internal division/branch rankings (they get a
 *    separate "External participants" list).
 *  - Ties: rank by points DESC, then participants ASC, then name ASC.
 *  - Public views expose participant display names only — no emails, no phones.
 */
@RestController
@RequestMapping("/api/leaderboard")
public class LeaderboardController {

    private static final List<String> CATEGORIES = List.of("Sports", "Cultural", "Techfest");

    private final EventScoreRepository scoreRepository;
    private final EventRepository eventRepository;
    private final RegistrationRepository registrationRepository;
    private final TrustedProfileService trustedProfileService;
    private final AuthContextService authContextService;
    private final AuditService auditService;

    public LeaderboardController(EventScoreRepository scoreRepository,
                                 EventRepository eventRepository,
                                 RegistrationRepository registrationRepository,
                                 TrustedProfileService trustedProfileService,
                                 AuthContextService authContextService,
                                 AuditService auditService) {
        this.scoreRepository = scoreRepository;
        this.eventRepository = eventRepository;
        this.registrationRepository = registrationRepository;
        this.trustedProfileService = trustedProfileService;
        this.authContextService = authContextService;
        this.auditService = auditService;
    }

    /** POST /api/leaderboard/scores — admin enters or corrects a participant's marks for an event. */
    @PostMapping("/scores")
    @Transactional
    public ResponseEntity<?> saveScore(@RequestBody Map<String, Object> body,
                                       @RequestHeader(value = "Authorization", required = false) String authHeader) {
        AuthContextService.Actor actor = authContextService.resolve(authHeader);
        if (!authContextService.isAdmin(actor)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Admin access required."));
        }

        Long eventId = longOf(body.get("eventId"));
        String email = str(body.get("email"));
        Double marks = num(body.get("marks"));
        if (eventId == null || email == null || marks == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "eventId, email and marks are required."));
        }
        if (marks < 0 || marks > 1000) {
            return ResponseEntity.badRequest().body(Map.of("message", "marks must be between 0 and 1000."));
        }

        Event event = eventRepository.findById(eventId).orElse(null);
        if (event == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Event " + eventId + " not found."));
        }

        // Registration must exist and be confirmed for the participant to be scored.
        Registration reg = registrationRepository.findAll().stream()
                .filter(r -> eventId.equals(r.getEventId()))
                .filter(r -> email.equalsIgnoreCase(r.getStudentEmail()))
                .filter(r -> "PAID".equalsIgnoreCase(r.getPaymentStatus()) || "CONFIRMED".equalsIgnoreCase(r.getPaymentStatus()))
                .findFirst()
                .orElse(null);
        if (reg == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "No confirmed registration for " + email + " in this event."));
        }

        // Division + branch are trusted data — self-spoofing is impossible.
        TrustedProfileService.TrustedProfile profile = trustedProfileService.resolve(email).orElse(null);
        String participantType = profile != null ? "COLLEGE" : "EXTERNAL";
        String division = participantType.equals("COLLEGE") ? (profile != null ? profile.division() : null) : null;
        String branch = participantType.equals("COLLEGE") ? (profile != null ? profile.branch() : null) : null;

        // Upsert (one authoritative score row per participant-event). Version increments → audit history.
        EventScore score = scoreRepository.findByEventIdAndParticipantEmail(eventId, email.toLowerCase())
                .orElseGet(EventScore::new);
        boolean isNew = score.getId() == null;
        score.setEventId(eventId);
        score.setEventCategory(event.getCategory());
        score.setParticipantType(participantType);
        score.setParticipantEmail(email.toLowerCase());
        score.setParticipantName(reg.getStudentName() != null && !reg.getStudentName().isBlank()
                ? reg.getStudentName()
                : (profile != null && profile.fullName() != null ? profile.fullName() : email));
        score.setDivision(division);
        score.setBranch(branch);
        score.setMarks(marks);
        score.setRemarks(str(body.get("remarks")));
        score.setUpdatedBy(actor.email());
        EventScore saved = scoreRepository.save(score);

        auditService.log(actor.email(), isNew ? "SCORE_CREATE" : "SCORE_UPDATE", "EventScore", saved.getId(),
                "event=" + eventId + " email=" + email + " marks=" + marks +
                        (score.getRemarks() != null ? " remarks=" + score.getRemarks() : ""));
        return ResponseEntity.ok(saved);
    }

    /** GET /api/leaderboard/scores/{eventId} — admin view of who is scored in an event. */
    @GetMapping("/scores/{eventId}")
    public ResponseEntity<?> scoresForEvent(@PathVariable Long eventId,
                                            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        AuthContextService.Actor actor = authContextService.resolve(authHeader);
        if (!authContextService.isAdmin(actor)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Admin access required."));
        }
        return ResponseEntity.ok(scoreRepository.findByEventId(eventId));
    }

    /**
     * GET /api/leaderboard/{category} — the public leaderboard.
     * Returns category standings, per-division standings, per-branch standings,
     * and an external-participants list (names only).
     */
    @GetMapping("/{category}")
    public ResponseEntity<?> categoryLeaderboard(@PathVariable("category") String categoryParam,
                                                 @RequestParam(value = "includeDetails", required = false) Boolean includeDetails,
                                                 @RequestHeader(value = "Authorization", required = false) String authHeader) {
        String category = matchCategory(categoryParam);
        if (category == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Unknown category: " + categoryParam + ". Use Sports, Cultural or Techfest."));
        }

        List<Event> eventsInCategory = eventRepository.findAll().stream()
                .filter(e -> category.equalsIgnoreCase(e.getCategory()))
                .toList();
        Set<Long> eventIds = eventsInCategory.stream().map(Event::getId).collect(Collectors.toSet());

        // Only valid, confirmed registrations in events of this category.
        List<Registration> confirmed = registrationRepository.findAll().stream()
                .filter(r -> eventIds.contains(r.getEventId()))
                .filter(r -> "PAID".equalsIgnoreCase(r.getPaymentStatus()) || "CONFIRMED".equalsIgnoreCase(r.getPaymentStatus()))
                .toList();
        Set<String> eligibleEmails = confirmed.stream()
                .map(r -> r.getStudentEmail() == null ? "" : r.getStudentEmail().toLowerCase().trim())
                .collect(Collectors.toSet());

        List<EventScore> scores = scoreRepository.findByEventCategory(category).stream()
                .filter(s -> eligibleEmails.contains(s.getParticipantEmail()))
                .collect(Collectors.toList());

        // Individual standings — display names only.
        Map<String, double[]> perPerson = new LinkedHashMap<>(); // email → [totalMarks, eventsScored]
        Map<String, String> nameOf = new HashMap<>();
        for (EventScore s : scores) {
            double[] arr = perPerson.computeIfAbsent(s.getParticipantEmail(), k -> new double[2]);
            arr[0] += s.getMarks() == null ? 0 : s.getMarks();
            arr[1] += 1;
            nameOf.putIfAbsent(s.getParticipantEmail(), displayName(s));
        }
        List<Map<String, Object>> individuals = new ArrayList<>();
        perPerson.forEach((email, arr) -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("name", nameOf.get(email));
            row.put("marks", Math.round(arr[0] * 100.0) / 100.0);
            row.put("events", (int) arr[1]);
            individuals.add(row);
        });
        individuals.sort(Comparator.comparingDouble((Map<String, Object> r) -> (Double) r.get("marks")).reversed()
                .thenComparing(r -> String.valueOf(r.get("name"))));

        // Division standings — internal COLLEGE students only.
        Map<String, Set<String>> divMembers = new TreeMap<>();
        Map<String, Double> divPoints = new TreeMap<>();
        for (EventScore s : scores) {
            if (!"COLLEGE".equals(s.getParticipantType())) continue;
            String div = s.getDivision();
            if (div == null || !div.matches("(?i)[A-E]")) continue;
            div = div.toUpperCase();
            divPoints.merge(div, s.getMarks() == null ? 0 : s.getMarks(), Double::sum);
            divMembers.computeIfAbsent(div, k -> new HashSet<>()).add(s.getParticipantEmail());
        }
        List<Map<String, Object>> divisionStandings = new ArrayList<>();
        divPoints.forEach((div, points) -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("division", div);
            row.put("points", Math.round(points * 100.0) / 100.0);
            row.put("participants", divMembers.get(div).size());
            divisionStandings.add(row);
        });
        divisionStandings.sort(Comparator
                .comparingDouble((Map<String, Object> r) -> (Double) r.get("points")).reversed()
                .thenComparingInt(r -> ((Number) r.get("participants")).intValue())
                .thenComparing(r -> String.valueOf(r.get("division"))));
        for (int i = 0; i < divisionStandings.size(); i++) {
            divisionStandings.get(i).put("rank", i + 1);
        }

        // Branch standings — internal COLLEGE students only.
        Map<String, Set<String>> branchMembers = new TreeMap<>();
        Map<String, Double> branchPoints = new TreeMap<>();
        for (EventScore s : scores) {
            if (!"COLLEGE".equals(s.getParticipantType())) continue;
            String br = s.getBranch();
            if (br == null || br.isBlank()) continue;
            branchPoints.merge(br, s.getMarks() == null ? 0 : s.getMarks(), Double::sum);
            branchMembers.computeIfAbsent(br, k -> new HashSet<>()).add(s.getParticipantEmail());
        }
        List<Map<String, Object>> branchStandings = new ArrayList<>();
        branchPoints.forEach((br, points) -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("branch", br);
            row.put("points", Math.round(points * 100.0) / 100.0);
            row.put("participants", branchMembers.get(br).size());
            branchStandings.add(row);
        });
        branchStandings.sort(Comparator
                .comparingDouble((Map<String, Object> r) -> (Double) r.get("points")).reversed()
                .thenComparingInt(r -> ((Number) r.get("participants")).intValue())
                .thenComparing(r -> String.valueOf(r.get("branch"))));
        for (int i = 0; i < branchStandings.size(); i++) {
            branchStandings.get(i).put("rank", i + 1);
        }

        // External participants — names only, college affiliation preserved at scoring time.
        List<Map<String, Object>> externals = scores.stream()
                .filter(s -> "EXTERNAL".equals(s.getParticipantType()))
                .collect(Collectors.groupingBy(EventScore::getParticipantEmail, LinkedHashMap::new,
                        Collectors.summingDouble(s -> s.getMarks() == null ? 0 : s.getMarks())))
                .entrySet().stream()
                .map(e -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    nameOf.putIfAbsent(e.getKey(), displayNameFromScores(scores, e.getKey()));
                    row.put("name", nameOf.get(e.getKey()));
                    row.put("points", Math.round(e.getValue() * 100.0) / 100.0);
                    return row;
                })
                .sorted(Comparator.comparingDouble((Map<String, Object> r) -> (Double) r.get("points")).reversed()
                        .thenComparing(r -> String.valueOf(r.get("name"))))
                .collect(Collectors.toList());

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("category", category);
        out.put("lastUpdated", java.time.LocalDateTime.now().toString());
        out.put("scoringPeriod", "Academic Year 2026");
        out.put("totalEvents", eventsInCategory.size());
        out.put("totalEligible", eligibleEmails.size());
        out.put("divisionStandings", divisionStandings);
        out.put("branchStandings", branchStandings);
        out.put("individuals", individuals);
        out.put("externals", externals);
        out.put("tieRule", "Rank by points desc, then participant count asc, then name asc.");

        boolean wantDetails = Boolean.TRUE.equals(includeDetails);
        if (wantDetails) {
            AuthContextService.Actor actor = authContextService.resolve(authHeader);
            if (authContextService.isAdmin(actor)) {
                out.put("adminDetail", scores);
            }
        }
        return ResponseEntity.ok(out);
    }

    /** GET /api/leaderboard/me?category=X&email=Y — a student's own results in a category. */
    @GetMapping("/me")
    public ResponseEntity<?> myResults(@RequestParam String category,
                                       @RequestHeader(value = "Authorization", required = false) String authHeader) {
        AuthContextService.Actor actor = authContextService.resolve(authHeader);
        if (actor == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Sign-in required."));
        }
        String cat = matchCategory(category);
        if (cat == null) return ResponseEntity.badRequest().body(Map.of("message", "Unknown category: " + category));
        List<EventScore> mine = scoreRepository.findByParticipantEmailAndEventCategory(actor.email(), cat);
        // Ownership-containment: results belong to the resolved token subject only.
        return ResponseEntity.ok(mine);
    }

    // ---------- helpers ----------

    private String matchCategory(String param) {
        if (param == null) return null;
        String p = param.trim().toLowerCase();
        for (String c : CATEGORIES) {
            if (c.equalsIgnoreCase(p)) return c;
            if (c.toLowerCase().startsWith(p) && p.length() >= 4) return c;
        }
        if (p.startsWith("techn")) return "Techfest";
        return null;
    }

    private String displayName(EventScore s) {
        String name = s.getParticipantName();
        if (name == null || name.isBlank()) return "Participant";
        return name;
    }

    private String displayNameFromScores(List<EventScore> scores, String email) {
        return scores.stream()
                .filter(s -> s.getParticipantEmail().equalsIgnoreCase(email))
                .map(EventScore::getParticipantName)
                .filter(n -> n != null && !n.isBlank())
                .findFirst()
                .orElse("Participant");
    }

    private String str(Object o) {
        if (o == null) return null;
        String s = String.valueOf(o).trim();
        return s.isEmpty() ? null : s;
    }

    private Double num(Object o) {
        if (o == null) return null;
        try { return Double.parseDouble(String.valueOf(o)); } catch (Exception e) { return null; }
    }

    private Long longOf(Object o) {
        if (o == null) return null;
        try { return Long.parseLong(String.valueOf(o)); } catch (Exception e) { return null; }
    }
}
