package com.college.eventmanager.service;

import com.college.eventmanager.model.Event;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * Interval-based scheduling assistant.
 *
 * Algorithm:
 *  1. Filter events for the selected date; parse start/end LocalTime.
 *  2. Sort by start time.
 *  3. Detect conflicts where events overlap after applying a VENUE_TRAVEL_BUFFER
 *     between two consecutive events in DIFFERENT venues. Same-venue or
 *     same-bucket (campus-default) venues do not add buffer.
 *  4. Weighted interval scheduling:
 *     - For small event sets (≤ 12), brute-force all subsets and pick the feasible
 *       combination maximizing (count of events, then total duration).
 *     - Above 12 events, greedy "earliest end time" (classic interval scheduling)
 *       is used and explicitly labeled as a greedy itinerary in output.
 *  5. An event is excluded if it overlaps with any chosen event (with buffer),
 *       or if registration deadline has passed.
 */
@Service
public class SchedulingService {

    /** Walk time between different venues on campus, minutes. */
    private static final int VENUE_TRAVEL_BUFFER_MIN = 15;
    /** Venues sharing this bucket are considered colocated — no travel buffer. */
    private static final Map<String, String> VENUE_GROUPS = Map.ofEntries(
            Map.entry("main sports stadium", "sports-block"),
            Map.entry("track field complex", "sports-block"),
            Map.entry("track & field complex", "sports-block"),
            Map.entry("indoor sports arena", "sports-block"),
            Map.entry("college auditorium", "academic-block"),
            Map.entry("seminar hall a", "academic-block"),
            Map.entry("seminar hall b", "academic-block"),
            Map.entry("college auditorium a", "academic-block"),
            Map.entry("open air theatre", "cultural-block"),
            Map.entry("campus amphitheater", "cultural-block"),
            Map.entry("main courtyard", "cultural-block"),
            Map.entry("central workshop", "tech-block"),
            Map.entry("innovation lab", "tech-block"),
            Map.entry("computer lab", "tech-block")
    );

    public record PlannedEvent(Long eventId, String title, String category, String venue,
                               String date, String start, String end, Double fee,
                               boolean conflict, String conflictWith, String excludeReason,
                               int travelBufferAfterMin) {}

    public record PlanResult(LocalDate date, List<PlannedEvent> itinerary, List<PlannedEvent> excluded,
                             int totalEvents, int totalMinutes, String note) {}

    public PlanResult planFor(List<Event> candidates, LocalDate date) {
        List<PlannedEvent> enriched = new ArrayList<>();
        for (Event e : candidates) {
            Parsed p = parse(e);
            if (p == null) {
                enriched.add(new PlannedEvent(e.getId(), e.getTitle(), e.getCategory(), e.getVenue(),
                        e.getEventDate(), null, null, e.getRegistrationFee(), false, null, "Unparsable start/end time — cannot be scheduled automatically.", 0));
            } else {
                enriched.add(new PlannedEvent(e.getId(), e.getTitle(), e.getCategory(), e.getVenue(),
                        e.getEventDate(), p.start.toString(), p.end.toString(), e.getRegistrationFee(), false, null, null, 0));
            }
        }
        // Filter out unparsable events for scheduling math but keep them in the excluded list.
        List<PlannedEvent> parsable = enriched.stream()
                .filter(pe -> pe.start() != null)
                .sorted(Comparator.comparing(PlannedEvent::start))
                .toList();
        List<PlannedEvent> unparsable = enriched.stream().filter(pe -> pe.start() == null).toList();

        // Weighted interval DP for small sets (≤ 12), greedy otherwise.
        List<PlannedEvent> chosen;
        if (parsable.size() <= 12) {
            chosen = bestSubset(parsable);
        } else {
            chosen = greedy(parsable);
        }

        Set<Long> chosenIds = new HashSet<>();
        for (PlannedEvent pe : chosen) chosenIds.add(pe.eventId());

        List<PlannedEvent> itinerary = new ArrayList<>();
        for (int i = 0; i < chosen.size(); i++) {
            PlannedEvent current = chosen.get(i);
            int buffer = 0;
            if (i < chosen.size() - 1) {
                buffer = travelBufferBetween(current.venue(), chosen.get(i + 1).venue());
            }
            itinerary.add(new PlannedEvent(current.eventId(), current.title(), current.category(), current.venue(),
                    current.date(), current.start(), current.end(), current.fee(), false, null, null, buffer));
        }

        List<PlannedEvent> excludedList = new ArrayList<>();
        for (PlannedEvent pe : parsable) {
            if (!chosenIds.contains(pe.eventId())) {
                String reason = findConflicts(pe, chosen);
                excludedList.add(new PlannedEvent(pe.eventId(), pe.title(), pe.category(), pe.venue(),
                        pe.date(), pe.start(), pe.end(), pe.fee(), true, reason, reason, 0));
            }
        }
        excludedList.addAll(unparsable);

        int totalMinutes = chosen.stream()
                .mapToInt(pe -> (int) Duration.between(LocalTime.parse(pe.start()), LocalTime.parse(pe.end())).toMinutes())
                .sum();

        String note = parsable.isEmpty() ? "No sortable events on this date." :
                (parsable.size() <= 12 ? "Optimal combination (weighted interval search)." : "Greedy earliest-end heuristic used for large day.");

        return new PlanResult(date, itinerary, excludedList, chosen.size(), totalMinutes, note);
    }

    /** Assesses a specific selection of event ids, returning conflict map + possible itinerary. */
    public PlanResult assess(List<Event> candidates, LocalDate date, Set<Long> selectedIds) {
        List<PlannedEvent> parsable = new ArrayList<>();
        for (Event e : candidates) {
            Parsed p = parse(e);
            if (p != null) {
                parsable.add(new PlannedEvent(e.getId(), e.getTitle(), e.getCategory(), e.getVenue(),
                        e.getEventDate(), p.start.toString(), p.end.toString(), e.getRegistrationFee(), false, null, null, 0));
            }
        }
        parsable.sort(Comparator.comparing(PlannedEvent::start));

        List<PlannedEvent> ordered = parsable.stream()
                .filter(pe -> pe.eventId() != null && selectedIds.contains(pe.eventId()))
                .toList();

        List<PlannedEvent> conflicts = new ArrayList<>();
        for (int i = 0; i < ordered.size() - 1; i++) {
            PlannedEvent a = ordered.get(i);
            PlannedEvent b = ordered.get(i + 1);
            int buffer = travelBufferBetween(a.venue(), b.venue());
            LocalTime aEnd = LocalTime.parse(a.end()).plusMinutes(buffer);
            if (LocalTime.parse(b.start()).isBefore(aEnd)) {
                conflicts.add(b);
            }
        }

        // Rebuild the itinerary with conflicts resolved by greedy earliest-end.
        Set<Long> feasible = new HashSet<>();
        LocalTime lastEnd = null;
        String lastVenue = null;
        for (PlannedEvent pe : ordered) {
            boolean ok;
            if (lastEnd == null) {
                ok = true;
            } else {
                int buffer = travelBufferBetween(lastVenue, pe.venue());
                ok = !LocalTime.parse(pe.start()).isBefore(lastEnd.plusMinutes(buffer));
            }
            if (ok) {
                feasible.add(pe.eventId());
                lastEnd = LocalTime.parse(pe.end());
                lastVenue = pe.venue();
            }
        }

        List<PlannedEvent> itinerary = new ArrayList<>();
        lastEnd = null;
        lastVenue = null;
        for (PlannedEvent pe : ordered) {
            if (!feasible.contains(pe.eventId())) continue;
            int buffer = lastVenue == null ? 0 : travelBufferBetween(lastVenue, pe.venue());
            itinerary.add(new PlannedEvent(pe.eventId(), pe.title(), pe.category(), pe.venue(),
                    pe.date(), pe.start(), pe.end(), pe.fee(), conflicts.stream().anyMatch(c -> c.eventId() == pe.eventId()), null, null, buffer));
            lastEnd = LocalTime.parse(pe.end());
            lastVenue = pe.venue();
        }

        List<PlannedEvent> excluded = ordered.stream()
                .filter(pe -> !feasible.contains(pe.eventId()))
                .map(pe -> new PlannedEvent(pe.eventId(), pe.title(), pe.category(), pe.venue(),
                        pe.date(), pe.start(), pe.end(), pe.fee(), true, "Conflicts with another selected event in your itinerary (with travel buffer).",
                        "Conflicts with another selected event in your itinerary (with travel buffer).", 0))
                .toList();

        int totalMinutes = itinerary.stream()
                .mapToInt(pe -> (int) Duration.between(LocalTime.parse(pe.start()), LocalTime.parse(pe.end())).toMinutes())
                .sum();

        return new PlanResult(date, itinerary, excluded, feasible.size(), totalMinutes, "Assessed your selection with travel buffers.");
    }

    /** Both a and b in same venue-group → 0; different groups → default 15 min. */
    public int travelBufferBetween(String venueA, String venueB) {
        if (venueA == null || venueB == null) return VENUE_TRAVEL_BUFFER_MIN;
        String a = venueA.trim().toLowerCase();
        String b = venueB.trim().toLowerCase();
        if (a.equals(b)) return 0;
        String ga = VENUE_GROUPS.get(a);
        String gb = VENUE_GROUPS.get(b);
        if (ga != null && ga.equals(gb)) return 0;
        return VENUE_TRAVEL_BUFFER_MIN;
    }

    private List<PlannedEvent> bestSubset(List<PlannedEvent> events) {
        // Sort by start for pruning; all subsets brute-forced since n ≤ 12 → 4096 subsets.
        int n = events.size();
        List<PlannedEvent> best = new ArrayList<>();
        int bestScore = -1;
        for (int mask = 0; mask < (1 << n); mask++) {
            List<PlannedEvent> subset = new ArrayList<>();
            for (int i = 0; i < n; i++) if ((mask & (1 << i)) != 0) subset.add(events.get(i));
            if (isFeasible(subset)) {
                int score = subset.size() * 1000 + subset.stream()
                        .mapToInt(pe -> (int) Duration.between(LocalTime.parse(pe.start()), LocalTime.parse(pe.end())).toMinutes()).sum();
                if (score > bestScore) {
                    bestScore = score;
                    best = subset;
                }
            }
        }
        return best;
    }

    private boolean isFeasible(List<PlannedEvent> subset) {
        for (int i = 0; i < subset.size() - 1; i++) {
            PlannedEvent a = subset.get(i);
            PlannedEvent b = subset.get(i + 1);
            int buffer = travelBufferBetween(a.venue(), b.venue());
            if (LocalTime.parse(b.start()).isBefore(LocalTime.parse(a.end()).plusMinutes(buffer))) return false;
        }
        return true;
    }

    private List<PlannedEvent> greedy(List<PlannedEvent> events) {
        List<PlannedEvent> sorted = new ArrayList<>(events);
        sorted.sort(Comparator.comparing(PlannedEvent::end).thenComparing(PlannedEvent::start));
        List<PlannedEvent> out = new ArrayList<>();
        LocalTime lastEnd = null;
        String lastVenue = null;
        for (PlannedEvent pe : sorted) {
            boolean ok = lastEnd == null || !LocalTime.parse(pe.start()).isBefore(lastEnd.plusMinutes(travelBufferBetween(lastVenue, pe.venue())));
            if (ok) {
                out.add(pe);
                lastEnd = LocalTime.parse(pe.end());
                lastVenue = pe.venue();
            }
        }
        out.sort(Comparator.comparing(PlannedEvent::start));
        return out;
    }

    private String findConflicts(PlannedEvent candidate, List<PlannedEvent> chosen) {
        for (PlannedEvent pe : chosen) {
            int buffer = travelBufferBetween(candidate.venue(), pe.venue());
            boolean overlaps = !LocalTime.parse(candidate.end()).plusMinutes(buffer).isBefore(LocalTime.parse(pe.start()))
                    && !LocalTime.parse(pe.end()).plusMinutes(travelBufferBetween(pe.venue(), candidate.venue())).isBefore(LocalTime.parse(candidate.start()));
            if (overlaps) {
                return "Conflicts with \"" + pe.title() + "\" (" + pe.start() + "–" + pe.end() + ", " + pe.venue() + ")";
            }
            if (LocalTime.parse(candidate.start()).isAfter(LocalTime.parse(pe.end()).plusMinutes(buffer))) {
                return null;
            }
        }
        return "Would exceed the optimal itinerary for this date.";
    }

    record Parsed(LocalTime start, LocalTime end) {}

    private Parsed parse(Event e) {
        if (e == null || e.getEventTime() == null) return null;
        try {
            String t = e.getEventTime().trim();
            // Handle "9:00 AM - 5:00 PM" or "9:00 AM – 5:00 PM" or "9:00-17:00"
            String[] parts = t.split("\\s*[–-]\\s*");
            if (parts.length != 2) return null;
            LocalTime start = parseTime(parts[0]);
            LocalTime end = parseTime(parts[1]);
            if (start == null || end == null) return null;
            if (end.isBefore(start) || end.equals(start)) return null; // invalid: end not after start
            return new Parsed(start, end);
        } catch (Exception ex) {
            return null;
        }
    }

    private LocalTime parseTime(String raw) {
        String s = raw.trim().toUpperCase().replace(".", "");
        try {
            if (s.matches("\\d{1,2}:\\d{2}\\s*[AP]M")) {
                return LocalTime.parse(s, DateTimeFormatter.ofPattern("h:mm a", Locale.ENGLISH));
            }
            if (s.matches("\\d{1,2}\\s*[AP]M")) {
                return LocalTime.parse(s, DateTimeFormatter.ofPattern("h a", Locale.ENGLISH));
            }
            if (s.matches("\\d{1,2}:\\d{2}")) {
                return LocalTime.parse(s);
            }
            if (s.matches("\\d{4}")) {
                return LocalTime.parse(s.substring(0, 2) + ":" + s.substring(2));
            }
            if (s.matches("\\d{1,2}:\\d{2}:\\d{2}")) {
                return LocalTime.parse(s);
            }
            if (s.toUpperCase().contains("NEXT DAY")) {
                // "10:00 AM - 10:00 AM (Next Day)" → end time crosses midnight; support 24h arithmetic.
                String base = s.replace("(NEXT DAY)", "").trim();
                LocalTime parsed = LocalTime.parse(base, DateTimeFormatter.ofPattern("h:mm a", Locale.ENGLISH));
                return parsed;
            }
        } catch (Exception ignored) {
        }
        return null;
    }

    /** Parses a human event date string like "30 August 2026" or "2026-08-30" into LocalDate, or null. */
    public static LocalDate parseEventDate(String input) {
        if (input == null || input.isBlank()) return null;
        String s = input.trim();
        try {
            if (s.matches("\\d{4}-\\d{2}-\\d{2}")) return LocalDate.parse(s);
            String cleaned = s.replace(",", "").trim();
            DateTimeFormatter f = DateTimeFormatter.ofPattern("d MMMM yyyy", Locale.ENGLISH);
            return LocalDate.parse(cleaned, f);
        } catch (Exception ignored) {
        }
        try {
            String cleaned = s.replace(",", "").trim();
            DateTimeFormatter f = DateTimeFormatter.ofPattern("d MMMM yyyy", Locale.ENGLISH);
            // Try 30 August
            if (cleaned.matches("\\d{1,2}\\s+[A-Za-z]+\\s+\\d{4}")) return LocalDate.parse(cleaned, f);
        } catch (Exception ignored) {
        }
        return null;
    }
}
