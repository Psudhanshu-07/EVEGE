package com.college.eventmanager.controller;

import com.college.eventmanager.dto.DashboardStats;
import com.college.eventmanager.model.Event;
import com.college.eventmanager.repository.EventRepository;
import com.college.eventmanager.repository.RegistrationRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/events")
public class EventController {

    private static final double FEE = 100.00;
    private static final String UPI_ID = "evege@okaxis";

    private final EventRepository eventRepository;
    private final RegistrationRepository registrationRepository;

    public EventController(EventRepository eventRepository, RegistrationRepository registrationRepository) {
        this.eventRepository = eventRepository;
        this.registrationRepository = registrationRepository;
    }

    /** GET /api/events - lists all events. Seeds if empty. */
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

    /** POST /api/events - create new event (Admin panel). */
    @PostMapping
    public ResponseEntity<Event> createEvent(@RequestBody Event event) {
        if (event.getRegistrationFee() == null) {
            event.setRegistrationFee(FEE);
        }
        if (event.getUpiId() == null || event.getUpiId().isBlank()) {
            event.setUpiId(UPI_ID);
        }
        if (event.getCategory() == null || event.getCategory().isBlank()) {
            event.setCategory("Technical");
        }
        if (event.getTagline() == null || event.getTagline().isBlank()) {
            event.setTagline("Build • Learn • Grow");
        }
        if (event.getBannerTheme() == null || event.getBannerTheme().isBlank()) {
            event.setBannerTheme(event.getCategory().toLowerCase().startsWith("tech") ? "tech"
                    : event.getCategory().toLowerCase().startsWith("sport") ? "sports" : "cultural");
        }
        return ResponseEntity.ok(eventRepository.save(event));
    }

    /** DELETE /api/events/{id} - delete event (Admin panel). */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteEvent(@PathVariable Long id) {
        return eventRepository.findById(id).map(e -> {
            eventRepository.delete(e);
            return ResponseEntity.ok(Map.of("message", "Event removed successfully", "id", id));
        }).orElse(ResponseEntity.notFound().build());
    }

    /** GET /api/events/stats - aggregates for dashboard stat cards. */
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

    /** Seeds dummy event set once, matching test requirements. */
    private void seedDummyEvents() {
        // --- Techfest [Srujanam] ---
        eventRepository.save(new Event("Techfest: Code Marathon [Srujanam]", "Techfest",
                "2026-08-21", "9:00 AM - 5:00 PM", "Innovation Lab",
                "Join exciting coding competitions and workshops.", "Build • Learn • Grow", "tech", FEE, UPI_ID));
        eventRepository.save(new Event("Techfest: Robo Wars [Srujanam]", "Techfest",
                "2026-08-22", "11:00 AM - 4:00 PM", "Central Workshop",
                "Combat robotics tournament and robot soccer.", "Innovate • Code • Deploy", "tech", FEE, UPI_ID));
        eventRepository.save(new Event("Techfest: Paper Presentation [Srujanam]", "Techfest",
                "2026-08-23", "10:00 AM - 2:00 PM", "Seminar Hall A",
                "Technical research and engineering project showcases.", "Engineered For Speed", "tech", FEE, UPI_ID));

        // --- Cultural [Naad] ---
        eventRepository.save(new Event("Cultural: Classical Dance [Naad]", "Cultural",
                "2026-09-11", "5:00 PM - 9:00 PM", "Open Air Theatre",
                "Classical and folk dance competitions.", "Art In Motion", "cultural", FEE, UPI_ID));
        eventRepository.save(new Event("Cultural: Melody Night [Naad]", "Cultural",
                "2026-09-12", "6:00 PM - 10:30 PM", "College Auditorium",
                "An evening of campus musical sensations.", "Rhythm • Harmony • Joy", "cultural", FEE, UPI_ID));
        eventRepository.save(new Event("Cultural: Street Play [Naad]", "Cultural",
                "2026-09-13", "4:00 PM - 7:00 PM", "Main Courtyard",
                "Dramatic street plays and skits addressing social issues.", "Loud • Live • Legendary", "cultural", FEE, UPI_ID));

        // --- Sports [Naad] ---
        eventRepository.save(new Event("Sports: Inter-College Cricket [Naad]", "Sports",
                "2026-10-05", "8:00 AM - 5:00 PM", "Main Ground",
                "Annual inter-college T20 cricket showdown.", "Passion • Spirit • Victory", "sports", FEE, UPI_ID));
        eventRepository.save(new Event("Sports: Athletics Meet [Naad]", "Sports",
                "2026-10-06", "7:00 AM - 1:00 PM", "Track Field",
                "100m sprint, relays, shot put and field events.", "Run Fast • Aim High", "sports", FEE, UPI_ID));
        eventRepository.save(new Event("Sports: Volleyball League [Naad]", "Sports",
                "2026-10-07", "3:00 PM - 7:00 PM", "Indoor Stadium",
                "Championship volleyball clash between campus branches.", "Spike • Block • Win", "sports", FEE, UPI_ID));
    }
}
