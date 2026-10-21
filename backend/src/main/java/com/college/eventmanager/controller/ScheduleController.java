package com.college.eventmanager.controller;

import com.college.eventmanager.model.Event;
import com.college.eventmanager.repository.EventRepository;
import com.college.eventmanager.service.SchedulingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Scheduling assistant API.
 *
 * GET /api/schedule/day?date=yyyy-MM-dd
 *   → all events on that date, optimal feasible itinerary, and exclusions with reasons.
 *
 * POST /api/schedule/assess
 *   body: { "date": "yyyy-MM-dd", "selectedEventIds": [1,3,4] }
 *   → conflict analysis for the student's own selection.
 */
@RestController
@RequestMapping("/api/schedule")
public class ScheduleController {

    private final EventRepository eventRepository;
    private final SchedulingService schedulingService;

    public ScheduleController(EventRepository eventRepository, SchedulingService schedulingService) {
        this.eventRepository = eventRepository;
        this.schedulingService = schedulingService;
    }

    @GetMapping("/day")
    public ResponseEntity<?> planForDay(@RequestParam("date") String date) {
        LocalDate d;
        try {
            d = LocalDate.parse(date);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "date must be in yyyy-MM-dd format"));
        }

        List<Event> candidates = eventRepository.findAll().stream()
                .filter(e -> sameDate(e, d))
                .toList();

        if (candidates.isEmpty()) {
            return ResponseEntity.ok(Map.of(
                    "date", date,
                    "itinerary", List.of(),
                    "excluded", List.of(),
                    "totalEvents", 0,
                    "totalMinutes", 0,
                    "note", "No events are scheduled on " + date + "."
            ));
        }

        SchedulingService.PlanResult result = schedulingService.planFor(candidates, d);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/assess")
    public ResponseEntity<?> assessSelection(@RequestBody Map<String, Object> body) {
        Object dateObj = body.get("date");
        Object idsObj = body.get("selectedEventIds");
        if (dateObj == null || idsObj == null || !(idsObj instanceof List<?> list)) {
            return ResponseEntity.badRequest().body(Map.of("message", "date and selectedEventIds are required"));
        }

        LocalDate d;
        try {
            d = LocalDate.parse(String.valueOf(dateObj));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "date must be in yyyy-MM-dd format"));
        }

        Set<Long> selectedIds = list.stream()
                .map(o -> {
                    try { return Long.parseLong(String.valueOf(o)); }
                    catch (Exception ex) { return null; }
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        if (selectedIds.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "selectedEventIds must not be empty"));
        }

        List<Event> candidates = eventRepository.findAll().stream()
                .filter(e -> sameDate(e, d))
                .toList();

        SchedulingService.PlanResult result = schedulingService.assess(candidates, d, selectedIds);
        return ResponseEntity.ok(result);
    }

    private boolean sameDate(Event e, LocalDate target) {
        LocalDate parsed = SchedulingService.parseEventDate(e.getEventDate());
        return parsed != null && parsed.equals(target);
    }
}
