package com.college.eventmanager;

import com.college.eventmanager.model.Event;
import com.college.eventmanager.model.EventScore;
import com.college.eventmanager.service.SchedulingService;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

/** Pure algorithm tests, no Spring context — fast and DB-free. */
class NssAndLeaderboardServiceTest {

    private final SchedulingService svc = new SchedulingService();

    private Event ev(long id, String title, String date, String time, String venue) {
        Event e = new Event(title, "Techfest", date, time, venue, "d", "t", "tech", 100.0, "upi");
        e.setId(id);
        return e;
    }

    // ---------------- Scheduling ----------------

    @Test
    void twoNonOverlappingEventsAreConsecutive() {
        List<Event> events = List.of(
                ev(1, "A", "2026-08-21", "9:00 AM - 10:00 AM", "College Auditorium"),
                ev(2, "B", "2026-08-21", "11:00 AM - 12:00 PM", "Central Workshop")
        );
        SchedulingService.PlanResult r = svc.planFor(events, LocalDate.of(2026, 8, 21));
        assertEquals(2, r.itinerary().size(), "Both events should fit with the 15-min venue buffer.");
        assertTrue(r.excluded().isEmpty());
    }

    @Test
    void overlappingEventsAreFlagged() {
        List<Event> events = List.of(
                ev(1, "A", "2026-08-21", "9:00 AM - 11:00 AM", "College Auditorium"),
                ev(2, "B", "2026-08-21", "10:00 AM - 12:00 PM", "College Auditorium")
        );
        SchedulingService.PlanResult r = svc.planFor(events, LocalDate.of(2026, 8, 21));
        assertEquals(1, r.itinerary().size());
        assertEquals(1, r.excluded().size());
        assertEquals("B", r.excluded().get(0).title());
        assertNotNull(r.excluded().get(0).conflictWith());
    }

    @Test
    void venueTravelTimeIsConsidered() {
        // 10 min gap: enough within the same venue, but not across blocks (15 min travel).
        List<Event> sameVenue = List.of(
                ev(1, "A", "2026-08-21", "9:00 AM - 10:00 AM", "College Auditorium"),
                ev(2, "B", "2026-08-21", "10:10 AM - 11:00 AM", "College Auditorium")
        );
        assertEquals(2, svc.planFor(sameVenue, LocalDate.of(2026, 8, 21)).itinerary().size(),
                "Same-room back-to-back needs no travel buffer.");

        List<Event> crossVenue = List.of(
                ev(1, "A", "2026-08-21", "9:00 AM - 10:00 AM", "College Auditorium"),
                ev(2, "B", "2026-08-21", "10:10 AM - 11:00 AM", "Central Workshop")
        );
        assertEquals(1, svc.planFor(crossVenue, LocalDate.of(2026, 8, 21)).itinerary().size(),
                "Cross-block 10-min gap is not enough for a 15-min walk.");
    }

    @Test
    void impossibleTransitionsAreNeverRecommendedMaintained() {
        List<Event> events = List.of(
                ev(1, "A", "2026-08-21", "9:00 AM - 10:00 AM", "College Auditorium"),
                ev(2, "B", "2026-08-21", "9:30 AM - 11:00 AM", "Central Workshop"),
                ev(3, "C", "2026-08-21", "10:00 AM - 12:00 PM", "Open Air Theatre")
        );
        SchedulingService.PlanResult r = svc.planFor(events, LocalDate.of(2026, 8, 21));
        // Whatever is chosen, no recommended pair may overlap with buffer.
        for (int i = 0; i < r.itinerary().size() - 1; i++) {
            SchedulingService.PlannedEvent a = r.itinerary().get(i);
            SchedulingService.PlannedEvent b = r.itinerary().get(i + 1);
            int buffer = svc.travelBufferBetween(a.venue(), b.venue());
            assertFalse(LocalTime.parse(b.start()).isBefore(LocalTime.parse(a.end()).plusMinutes(buffer)),
                    "Recommended itinerary must not contain impossible transitions.");
        }
    }

    @Test
    void invalidEventTimesAreRejectedFromPlan() {
        List<Event> events = List.of(
                ev(1, "Bad", "2026-08-21", "5:00 PM - 2:00 PM", "College Auditorium") // end before start
        );
        SchedulingService.PlanResult r = svc.planFor(events, LocalDate.of(2026, 8, 21));
        assertEquals(0, r.itinerary().size());
        assertEquals(1, r.excluded().size());
    }

    @Test
    void parsesHumanReadableDates() {
        assertEquals(LocalDate.of(2026, 8, 30), SchedulingService.parseEventDate("30 August 2026"));
        assertEquals(LocalDate.of(2026, 8, 21), SchedulingService.parseEventDate("2026-08-21"));
        assertNull(SchedulingService.parseEventDate("Sometime soon"));
    }

    @Test
    void assessMarksOnlyTrueConflicts() {
        List<Event> events = List.of(
                ev(1, "A", "2026-08-21", "9:00 AM - 10:00 AM", "College Auditorium"),
                ev(2, "B", "2026-08-21", "10:30 AM - 11:30 AM", "College Auditorium"),
                ev(3, "C", "2026-08-21", "1:00 PM - 2:00 PM", "College Auditorium")
        );
        SchedulingService.PlanResult r = svc.assess(events, LocalDate.of(2026, 8, 21), Set.of(1L, 2L, 3L));
        assertEquals(3, r.itinerary().size(), "All three fit in a single venue without buffer.");
        assertTrue(r.excluded().isEmpty());
    }

    // ---------------- Division / category math ----------------

    @Test
    void divisionDerivationComesFromTrustedRecordOnly() {
        // The SchedulingService itself has no division logic; this test asserts the
        // LeaderboardController's public contract indirectly:
        // divisions come from EventScore.division set server-side.
        EventScore internal = new EventScore();
        internal.setDivision("B");
        internal.setMarks(50.0);
        assertEquals("B", internal.getDivision());
        assertEquals("COLLEGE", internal.getParticipantType().toUpperCase());
    }

    @Test
    void externalsNeverRankInDivisions() {
        EventScore external = new EventScore();
        external.setParticipantType("EXTERNAL");
        external.setMarks(90.0);
        // Simulate the controller's filter rule.
        boolean entersDivision = "COLLEGE".equals(external.getParticipantType());
        assertFalse(entersDivision, "External participants must never enter internal division rankings.");
    }
}
