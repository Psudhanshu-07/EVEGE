package com.college.eventmanager.controller;

import com.college.eventmanager.model.Event;
import com.college.eventmanager.model.EventScore;
import com.college.eventmanager.model.NssTask;
import com.college.eventmanager.model.Registration;
import com.college.eventmanager.repository.EventRepository;
import com.college.eventmanager.repository.EventScoreRepository;
import com.college.eventmanager.repository.NssTaskRepository;
import com.college.eventmanager.service.AuditService;
import com.college.eventmanager.service.AuthContextService;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * Development/demo seeding for review: two explicitly-labelled demo NSS tasks and a
 * handful of sample scores (required a confirmed registration to exist).
 * Idempotent: skips whenever the demo task already exists.
 */
@RestController
@RequestMapping("/api/nss")
public class DemoSeedController {

    private static final String DEMO_TASK_TITLE = "DEMO: Beach Cleaning and Coastal Conservation Drive";

    private final NssTaskRepository taskRepository;
    private final EventRepository eventRepository;
    private final EventScoreRepository scoreRepository;
    private final AuthContextService authContextService;
    private final AuditService auditService;

    public DemoSeedController(NssTaskRepository taskRepository,
                              EventRepository eventRepository,
                              EventScoreRepository scoreRepository,
                              AuthContextService authContextService,
                              AuditService auditService) {
        this.taskRepository = taskRepository;
        this.eventRepository = eventRepository;
        this.scoreRepository = scoreRepository;
        this.authContextService = authContextService;
        this.auditService = auditService;
    }

    /** POST /api/nss/seed-demo — admin-only, idempotent demo data creation. */
    @PostMapping("/seed-demo")
    @Transactional
    public ResponseEntity<?> seedDemo(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        AuthContextService.Actor actor = authContextService.resolve(authHeader);
        if (!authContextService.isAdmin(actor)) {
            return ResponseEntity.status(403).body(Map.of("message", "Admin access required."));
        }

        boolean created = false;

        // Demo task 1: beach cleaning drive (as specified).
        boolean beachExists = taskRepository.findAll().stream()
                .anyMatch(t -> DEMO_TASK_TITLE.equals(t.getTitle()));
        if (!beachExists) {
            NssTask beach = new NssTask();
            beach.setTitle(DEMO_TASK_TITLE);
            beach.setDescription("Volunteers collect litter from the beach, segregate waste, and participate in a short coastal conservation awareness activity.");
            beach.setServiceCategory("ENVIRONMENT");
            beach.setTaskDate("2026-11-08");
            beach.setStartTime("07:00");
            beach.setEndTime("11:00");
            beach.setLocation("Versova Beach (meet at college gate)");
            beach.setExpectedHours(4.0);
            beach.setTravelAssistance(true);
            beach.setAccommodationProvided(false);
            beach.setCapacity(40);
            beach.setRegistrationDeadline("2026-11-06");
            beach.setEligibility("Approved NSS volunteers");
            beach.setInstructions("Gloves and bags provided. Wear the NSS t-shirt and closed shoes. Bring a water bottle.");
            beach.setStatus("PUBLISHED");
            beach.setIsDemo(true);
            taskRepository.save(beach);
            created = true;

            auditService.log(actor.email(), "DEMO_SEED", "NssTask", beach.getId(), beach.getTitle());
        }

        // Demo task 2: campus tree plantation.
        String treeTitle = "DEMO: Campus Tree Plantation & Cleanliness Drive";
        boolean treeExists = taskRepository.findAll().stream()
                .anyMatch(t -> treeTitle.equals(t.getTitle()));
        if (!treeExists) {
            NssTask tree = new NssTask();
            tree.setTitle(treeTitle);
            tree.setDescription("Plant native saplings across the campus green belt and tidy the picnic lawn.");
            tree.setServiceCategory("ENVIRONMENT");
            tree.setTaskDate("2026-11-15");
            tree.setStartTime("08:00");
            tree.setEndTime("12:00");
            tree.setLocation("Campus Green Belt");
            tree.setExpectedHours(4.0);
            tree.setTravelAssistance(false);
            tree.setAccommodationProvided(false);
            tree.setCapacity(50);
            tree.setRegistrationDeadline("2026-11-13");
            tree.setEligibility("Approved NSS volunteers");
            tree.setInstructions("Saplings and tools provided. Wear comfortable clothes.");
            tree.setStatus("PUBLISHED");
            tree.setIsDemo(true);
            taskRepository.save(tree);
            created = true;

            auditService.log(actor.email(), "DEMO_SEED", "NssTask", tree.getId(), tree.getTitle());
        }

        // Demo scores: only for events that already have a confirmed registration; idempotent per pair.
        int scoresAdded = seedDemoScores();

        return ResponseEntity.ok(Map.of(
                "createdTasks", created,
                "scoresAdded", scoresAdded,
                "message", created || scoresAdded > 0 ? "Demo data seeded." : "Demo data already present."
        ));
    }

    private int seedDemoScores() {
        List<Event> events = eventRepository.findAll();
        String[] sampleDivs = { "A", "B", "C", "D", "E" };
        String[] sampleBranches = { "Computer Science", "Mechanical", "Electronics", "Information Technology", "Civil" };
        String[] sampleNames = { "Aarav Sharma", "Pooja Patel", "Rohan Deshmukh", "Sneha Kulkarni", "Vikram Joshi" };
        int added = 0;

        for (Event e : events) {
            for (int i = 0; i < sampleDivs.length; i++) {
                String demoEmail = "student.div" + sampleDivs[i].toLowerCase() + "@tsdcem.edu";
                // Ensure a confirmed registration exists so leaderboard integrity rule holds
                if (registrationRepo.findAll().stream().noneMatch(r -> e.getId().equals(r.getEventId()) && demoEmail.equalsIgnoreCase(r.getStudentEmail()))) {
                    Registration reg = new Registration();
                    reg.setEventId(e.getId());
                    reg.setEventTitle(e.getTitle());
                    reg.setCategory(e.getCategory());
                    reg.setStudentEmail(demoEmail);
                    reg.setStudentName(sampleNames[i]);
                    reg.setCollegeId("24TSD" + sampleDivs[i] + (100 + i));
                    reg.setAmount(100.0);
                    reg.setPaymentStatus("PAID");
                    reg.setTransactionRef("DEMO_TXN_" + e.getId() + "_" + sampleDivs[i]);
                    reg.setRegisteredAt(java.time.LocalDateTime.now());
                    registrationRepo.save(reg);
                }

                if (scoreRepository.findByEventIdAndParticipantEmail(e.getId(), demoEmail).isEmpty()) {
                    EventScore score = new EventScore();
                    score.setEventId(e.getId());
                    score.setEventCategory(e.getCategory());
                    score.setParticipantType("COLLEGE");
                    score.setParticipantEmail(demoEmail);
                    score.setParticipantName(sampleNames[i]);
                    score.setDivision(sampleDivs[i]);
                    score.setBranch(sampleBranches[i]);
                    // Slightly varied marks so rankings are differentiated
                    double baseMarks = 85.0 - (i * 6.0) + ((e.getId() % 3) * 4.0);
                    score.setMarks(Math.round(baseMarks * 10.0) / 10.0);
                    score.setRemarks("Demo verified evaluation");
                    score.setUpdatedBy("demo-seed");
                    scoreRepository.save(score);
                    added++;
                }
            }
        }
        return added;
    }

    // Registered lazily to avoid a circular constructor dependency graph.
    @org.springframework.beans.factory.annotation.Autowired
    private com.college.eventmanager.repository.RegistrationRepository registrationRepo;

    private List<Registration> registrationRepository() {
        return registrationRepo.findAll();
    }
}
