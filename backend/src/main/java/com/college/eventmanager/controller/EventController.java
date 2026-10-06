package com.college.eventmanager.controller;

import com.college.eventmanager.dto.DashboardStats;
import com.college.eventmanager.model.Event;
import com.college.eventmanager.repository.EventRepository;
import com.college.eventmanager.repository.RegistrationRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/events")
public class EventController {

    private static final double FEE = 100.00;
    private static final String UPI_ID = "evege@upi";

    private final EventRepository eventRepository;
    private final RegistrationRepository registrationRepository;

    public EventController(EventRepository eventRepository, RegistrationRepository registrationRepository) {
        this.eventRepository = eventRepository;
        this.registrationRepository = registrationRepository;
    }

    /**
     * GET /api/events - lists all events, seeding the dummy events first when the
     * DB is empty: Sports [Naad], Cultural [Naad] and Techfest [Srujanam], each at Rs.100.
     */
    @GetMapping
    public List<Event> getAllEvents() {
        if (eventRepository.count() == 0) {
            seedDummyEvents();
        }
        return eventRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Event> getEvent(@PathVariable Long id) {
        return eventRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Event> createEvent(@RequestBody Event event) {
        if (event.getRegistrationFee() == null) {
            event.setRegistrationFee(FEE);
        }
        if (event.getUpiId() == null || event.getUpiId().isBlank()) {
            event.setUpiId(UPI_ID);
        }
        return ResponseEntity.ok(eventRepository.save(event));
    }

    /** GET /api/events/stats - aggregates for the dashboard stat cards. */
    @GetMapping("/stats")
    public DashboardStats getStats() {
        List<Event> events = eventRepository.findAll();

        long festTracks = events.stream()
                .map(Event::getCategory)
                .distinct()
                .count();

        double collected = registrationRepository.findAll().stream()
                .filter(r -> "PAID".equalsIgnoreCase(r.getPaymentStatus())
                        || "CONFIRMED".equalsIgnoreCase(r.getPaymentStatus()))
                .count() * FEE;

        return new DashboardStats(
                events.size(),
                registrationRepository.count(),
                collected,
                festTracks
        );
    }

    /** Seeds the dummy event set once, when the events table is empty. */
    private void seedDummyEvents() {
        // --- Techfest [Srujanam] ---
        eventRepository.save(new Event("Techfest: Code Marathon [Srujanam]", "Techfest",
                "2026-08-21", "Innovation Lab", FEE, UPI_ID));
        eventRepository.save(new Event("Techfest: Robo Wars [Srujanam]", "Techfest",
                "2026-08-22", "Central Workshop", FEE, UPI_ID));
        eventRepository.save(new Event("Techfest: Paper Presentation [Srujanam]", "Techfest",
                "2026-08-23", "Seminar Hall A", FEE, UPI_ID));

        // --- Cultural [Naad] ---
        eventRepository.save(new Event("Cultural: Classical Dance [Naad]", "Cultural",
                "2026-09-11", "Open Air Theatre", FEE, UPI_ID));
        eventRepository.save(new Event("Cultural: Melody Night [Naad]", "Cultural",
                "2026-09-12", "College Auditorium", FEE, UPI_ID));
        eventRepository.save(new Event("Cultural: Street Play [Naad]", "Cultural",
                "2026-09-13", "Main Courtyard", FEE, UPI_ID));

        // --- Sports [Naad] ---
        eventRepository.save(new Event("Sports: Inter-College Cricket [Naad]", "Sports",
                "2026-10-05", "Main Ground", FEE, UPI_ID));
        eventRepository.save(new Event("Sports: Athletics Meet [Naad]", "Sports",
                "2026-10-06", "Track Field", FEE, UPI_ID));
        eventRepository.save(new Event("Sports: Volleyball League [Naad]", "Sports",
                "2026-10-07", "Indoor Stadium", FEE, UPI_ID));
    }
}
