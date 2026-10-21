package com.college.eventmanager.controller;

import com.college.eventmanager.model.*;
import com.college.eventmanager.repository.*;
import com.college.eventmanager.service.AuditService;
import com.college.eventmanager.service.AuthContextService;
import com.college.eventmanager.service.TrustedProfileService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/nss")
public class NssController {

    private final NssApplicationRepository applicationRepository;
    private final NssTaskRepository taskRepository;
    private final NssTaskRegistrationRepository taskRegistrationRepository;
    private final AuditService auditService;
    private final AuthContextService authContextService;
    private final TrustedProfileService trustedProfileService;

    public NssController(NssApplicationRepository applicationRepository,
                         NssTaskRepository taskRepository,
                         NssTaskRegistrationRepository taskRegistrationRepository,
                         AuditService auditService,
                         AuthContextService authContextService,
                         TrustedProfileService trustedProfileService) {
        this.applicationRepository = applicationRepository;
        this.taskRepository = taskRepository;
        this.taskRegistrationRepository = taskRegistrationRepository;
        this.auditService = auditService;
        this.authContextService = authContextService;
        this.trustedProfileService = trustedProfileService;
    }

    // ---------- Volunteer applications ----------

    /** GET /api/nss/status?email=x — the caller's own lifetime-state (NOT_REGISTERED / PENDING / APPROVED / REJECTED / WITHDRAWN). */
    @GetMapping("/status")
    public ResponseEntity<?> status(@RequestParam(value = "email", required = false) String email,
                                    @RequestHeader(value = "Authorization", required = false) String authHeader) {
        String target = email != null && !email.isBlank() ? email.trim().toLowerCase() : subjectOf(authHeader);
        if (target == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email is required."));
        }
        // Enrollment privacy: a non-admin may only read their own status.
        AuthContextService.Actor actor = authContextService.resolve(authHeader);
        if (!target.equalsIgnoreCase(subjectOf(authHeader)) && !authContextService.isAdmin(actor)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Not allowed to read someone else's NSS status."));
        }

        String state = computeLifetimeState(target);
        NssApplication app = applicationRepository.findByStudentEmailAndStatus(target, "PENDING")
                .orElse(applicationRepository.findByStudentEmailAndStatus(target, "APPROVED")
                        .orElse(applicationRepository.findByStudentEmailAndStatus(target, "REJECTED")
                                .orElse(null)));
        // Null-safe payload: Map.of rejects null values, and `app` may legitimately be null.
        Map<String, Object> payload = new java.util.HashMap<>();
        payload.put("state", state);
        payload.put("application", app);
        return ResponseEntity.ok(payload);
    }

    /** POST /api/nss/apply — create an application (one active application per student). */
    @PostMapping("/apply")
    public ResponseEntity<?> apply(@RequestBody Map<String, Object> body,
                                   @RequestHeader(value = "Authorization", required = false) String authHeader) {
        String subject = subjectOf(authHeader);
        if (subject == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Sign in required to submit an NSS application."));
        }
        String email = body.get("email") != null ? String.valueOf(body.get("email")).trim().toLowerCase() : subject;
        if (!email.equals(subject)) {
            // A student may only apply for themselves. Admin bypass: admin can create on behalf.
            AuthContextService.Actor actor = authContextService.resolve(authHeader);
            if (!authContextService.isAdmin(actor)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "You may only submit an application for your own account."));
            }
        }

        Set<String> allowed = Set.of("PENDING", "APPROVED");
        boolean hasActive = allowed.stream()
                .anyMatch(s -> applicationRepository.findByStudentEmailAndStatus(email, s).isPresent());
        if (hasActive) {
            return ResponseEntity.badRequest().body(Map.of("message", "You already have an active NSS application. Withdraw it first to reapply."));
        }

        NssApplication app = new NssApplication();
        app.setStudentEmail(email);
        String fullName = str(body.get("fullName"));
        String studentId = str(body.get("studentId"));
        if (fullName == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "fullName is required."));
        }
        app.setFullName(fullName);
        app.setStudentId(studentId);
        app.setPhone(str(body.get("phone")));
        app.setBranch(str(body.get("branch")));

        // Division is TRUSTED DATA — it comes from the internal profile only, never from the client.
        TrustedProfileService.TrustedProfile trusted = trustedProfileService.resolve(email).orElse(null);
        if (trusted != null) {
            app.setBranch(trusted.branch() != null ? trusted.branch() : app.getBranch());
            app.setDivision(trusted.division());
        }

        app.setAcademicYear(str(body.get("academicYear")));
        app.setExperience(str(body.get("experience")));
        app.setAvailability(str(body.get("availability")));
        app.setMotivation(str(body.get("motivation")));

        Object consentObj = body.get("consentGiven");
        boolean consent = consentObj == null || Boolean.parseBoolean(String.valueOf(consentObj));
        if (!consent) {
            return ResponseEntity.badRequest().body(Map.of("message", "Consent is required to join NSS."));
        }
        app.setConsentGiven(true);
        app.setStatus("PENDING");
        app.setSubmittedAt(LocalDateTime.now());

        NssApplication saved = applicationRepository.save(app);
        auditService.log(subject, "NSS_APPLICATION_SUBMIT", "NssApplication", saved.getId(), "status=PENDING");

        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    /** POST /api/nss/withdraw — student sides with integrity: retire an active application. */
    @PostMapping("/withdraw")
    public ResponseEntity<?> withdraw(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        String subject = subjectOf(authHeader);
        if (subject == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Sign-in required."));
        }
        NssApplication active = applicationRepository.findByStudentEmailAndStatus(subject, "PENDING")
                .orElse(applicationRepository.findByStudentEmailAndStatus(subject, "APPROVED").orElse(null));
        if (active == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "No active application to withdraw."));
        }
        active.setStatus("WITHDRAWN");
        active.setActive(null);
        applicationRepository.save(active);
        auditService.log(subject, "NSS_APPLICATION_WITHDRAW", "NssApplication", active.getId(), "status=WITHDRAWN");
        return ResponseEntity.ok(active);
    }

    /** GET /api/nss/applications — admin only, list all applications. */
    @GetMapping("/applications")
    public ResponseEntity<?> allApplications(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        AuthContextService.Actor actor = authContextService.resolve(authHeader);
        if (!authContextService.isAdmin(actor)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Admin access required."));
        }
        List<NssApplication> all = applicationRepository.findAll();
        all.sort(Comparator.comparing(NssApplication::getSubmittedAt).reversed());
        return ResponseEntity.ok(all);
    }

    /** POST /api/nss/applications/{id}/review — admin approves or rejects with optional note. */
    @PostMapping("/applications/{id}/review")
    public ResponseEntity<?> reviewApplication(@PathVariable Long id,
                                               @RequestBody Map<String, Object> body,
                                               @RequestHeader(value = "Authorization", required = false) String authHeader) {
        AuthContextService.Actor actor = authContextService.resolve(authHeader);
        if (!authContextService.isAdmin(actor)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Admin access required."));
        }
        String decision = str(body.get("decision"));
        if (decision == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "decision must be APPROVE or REJECT."));
        }
        boolean approve = decision.equalsIgnoreCase("APPROVE");

        return applicationRepository.findById(id).map(app -> {
            if ("APPROVED".equals(app.getStatus()) || "REJECTED".equals(app.getStatus())) {
                return ResponseEntity.badRequest().body((Object) Map.of("message", "Application already finalized."));
            }
            app.setStatus(approve ? "APPROVED" : "REJECTED");
            app.setAdminNote(str(body.get("adminNote")));
            app.setReviewedBy(actor.email() != null ? hash(actor.email()) : null);
            app.setReviewedAt(LocalDateTime.now());
            app.setActive(approve ? 1 : null);
            NssApplication saved = applicationRepository.save(app);
            auditService.log(actor.email(), approve ? "NSS_APPLICATION_APPROVE" : "NSS_APPLICATION_REJECT",
                    "NssApplication", id, "note=" + str(body.get("adminNote")));
            return ResponseEntity.ok((Object) saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    // ---------- NSS tasks ----------

    /** GET /api/nss/tasks — published tasks for everyone; admins also see drafts. */
    @GetMapping("/tasks")
    public ResponseEntity<?> tasks(@RequestHeader(value = "Authorization", required = false) String authHeader,
                                   @RequestParam(value = "all", required = false) Boolean all) {
        AuthContextService.Actor actor = authContextService.resolve(authHeader);
        List<NssTask> tasks = taskRepository.findAll();
        boolean wantAll = Boolean.TRUE.equals(all);
        if (wantAll) {
            if (!authContextService.isAdmin(actor)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Admin access required."));
            }
            return ResponseEntity.ok(tasks);
        }
        List<NssTask> visible = tasks.stream()
                .filter(t -> "PUBLISHED".equalsIgnoreCase(t.getStatus()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(visible);
    }

    /** GET /api/nss/tasks/{id} — detail. Volunteers see published; admins see all. */
    @GetMapping("/tasks/{id}")
    public ResponseEntity<?> task(@PathVariable Long id,
                                  @RequestHeader(value = "Authorization", required = false) String authHeader) {
        AuthContextService.Actor actor = authContextService.resolve(authHeader);
        Optional<NssTask> task = taskRepository.findById(id);
        if (task.isEmpty()) return ResponseEntity.notFound().build();
        NssTask t = task.get();
        if (!"PUBLISHED".equalsIgnoreCase(t.getStatus()) && !authContextService.isAdmin(actor)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Task not published."));
        }
        return ResponseEntity.ok(t);
    }

    /** POST /api/nss/tasks — admin creates a task. */
    @PostMapping("/tasks")
    @Transactional
    public ResponseEntity<?> createTask(@RequestBody Map<String, Object> body,
                                        @RequestHeader(value = "Authorization", required = false) String authHeader) {
        AuthContextService.Actor actor = authContextService.resolve(authHeader);
        if (!authContextService.isAdmin(actor)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Admin access required."));
        }

        String title = str(body.get("title"));
        String date = str(body.get("taskDate"));
        String start = str(body.get("startTime"));
        String end = str(body.get("endTime"));
        if (title == null || date == null || start == null || end == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "title, taskDate, startTime, endTime are required."));
        }
        Double hours = num(body.get("expectedHours"));
        if (hours == null || hours <= 0) {
            return ResponseEntity.badRequest().body(Map.of("message", "expectedHours must be a positive number."));
        }
        if (start.compareTo(end) >= 0) {
            return ResponseEntity.badRequest().body(Map.of("message", "endTime must be after startTime."));
        }
        Integer capacity = intOf(body.get("capacity"), 50);
        if (capacity <= 0) {
            return ResponseEntity.badRequest().body(Map.of("message", "capacity must be at least 1."));
        }

        NssTask task = new NssTask();
        task.setTitle(title);
        task.setDescription(str(body.get("description")));
        task.setServiceCategory(str(body.get("serviceCategory")));
        task.setTaskDate(date);
        task.setStartTime(start);
        task.setEndTime(end);
        task.setLocation(str(body.get("location")));
        task.setExpectedHours(hours);
        task.setTravelAssistance(bool(body.get("travelAssistance")));
        task.setAccommodationProvided(bool(body.get("accommodationProvided")));
        task.setCapacity(capacity);
        task.setRegistrationDeadline(str(body.get("registrationDeadline")));
        task.setEligibility(str(body.get("eligibility")));
        task.setInstructions(str(body.get("instructions")));
        task.setStatus(str(body.get("status")) == null ? "PUBLISHED" : "PUBLISHED");
        task.setIsDemo(Boolean.parseBoolean(String.valueOf(body.getOrDefault("isDemo", "false"))));

        NssTask saved = taskRepository.save(task);
        auditService.log(actor.email(), "NSS_TASK_CREATE", "NssTask", saved.getId(), "title=" + title);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    /** PUT /api/nss/tasks/{id} — admin edits a task. */
    @PutMapping("/tasks/{id}")
    @Transactional
    public ResponseEntity<?> updateTask(@PathVariable Long id,
                                        @RequestBody Map<String, Object> body,
                                        @RequestHeader(value = "Authorization", required = false) String authHeader) {
        AuthContextService.Actor actor = authContextService.resolve(authHeader);
        if (!authContextService.isAdmin(actor)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Admin access required."));
        }
        Optional<NssTask> opt = taskRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        NssTask task = opt.get();

        if (body.containsKey("title")) task.setTitle(str(body.get("title")));
        if (body.containsKey("description")) task.setDescription(str(body.get("description")));
        if (body.containsKey("serviceCategory")) task.setServiceCategory(str(body.get("serviceCategory")));
        if (body.containsKey("taskDate")) task.setTaskDate(str(body.get("taskDate")));
        if (body.containsKey("startTime")) task.setStartTime(str(body.get("startTime")));
        if (body.containsKey("endTime")) task.setEndTime(str(body.get("endTime")));
        if (body.containsKey("location")) task.setLocation(str(body.get("location")));
        if (body.containsKey("expectedHours")) {
            Double hours = num(body.get("expectedHours"));
            if (hours == null || hours <= 0) {
                return ResponseEntity.badRequest().body(Map.of("message", "expectedHours must be a positive number."));
            }
            task.setExpectedHours(hours);
        }
        if (body.containsKey("travelAssistance")) task.setTravelAssistance(bool(body.get("travelAssistance")));
        if (body.containsKey("accommodationProvided")) task.setAccommodationProvided(bool(body.get("accommodationProvided")));
        if (body.containsKey("capacity")) {
            Integer cap = intOf(body.get("capacity"), task.getCapacity());
            if (cap <= 0) return ResponseEntity.badRequest().body(Map.of("message", "capacity must be at least 1."));
            task.setCapacity(cap);
        }
        if (body.containsKey("registrationDeadline")) task.setRegistrationDeadline(str(body.get("registrationDeadline")));
        if (body.containsKey("eligibility")) task.setEligibility(str(body.get("eligibility")));
        if (body.containsKey("instructions")) task.setInstructions(str(body.get("instructions")));
        if (body.containsKey("status")) {
            String s = str(body.get("status")).toUpperCase();
            if (!List.of("DRAFT", "PUBLISHED", "COMPLETED", "CANCELLED").contains(s)) {
                return ResponseEntity.badRequest().body(Map.of("message", "status must be DRAFT, PUBLISHED, COMPLETED or CANCELLED."));
            }
            task.setStatus(s);
        }

        NssTask saved = taskRepository.save(task);
        auditService.log(actor.email(), "NSS_TASK_UPDATE", "NssTask", id, saved.toString());
        return ResponseEntity.ok(saved);
    }

    /** DELETE /api/nss/tasks/{id} — admin deletes a task. */
    @DeleteMapping("/tasks/{id}")
    @Transactional
    public ResponseEntity<?> deleteTask(@PathVariable Long id,
                                        @RequestHeader(value = "Authorization", required = false) String authHeader) {
        AuthContextService.Actor actor = authContextService.resolve(authHeader);
        if (!authContextService.isAdmin(actor)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Admin access required."));
        }
        if (taskRepository.findById(id).isEmpty()) return ResponseEntity.notFound().build();
        long regs = taskRegistrationRepository.countByTaskId(id);
        if (regs > 0) {
            return ResponseEntity.badRequest().body(Map.of("message", "Task has " + regs + " registrations; cancel it instead of deleting."));
        }
        taskRepository.deleteById(id);
        auditService.log(actor.email(), "NSS_TASK_DELETE", "NssTask", id, null);
        return ResponseEntity.ok(Map.of("message", "Task deleted.", "id", id));
    }

    // ---------- Volunteer task interactions ----------

    /** GET /api/nss/my/registrations?email= — a volunteer's own task registrations. */
    @GetMapping("/my/registrations")
    public ResponseEntity<?> myRegistrations(@RequestParam(value = "email", required = false) String email,
                                             @RequestHeader(value = "Authorization", required = false) String authHeader) {
        String target = email != null && !email.isBlank() ? email.trim().toLowerCase() : subjectOf(authHeader);
        if (target == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Sign-in required."));
        }
        AuthContextService.Actor actor = authContextService.resolve(authHeader);
        if (!target.equalsIgnoreCase(subjectOf(authHeader)) && !authContextService.isAdmin(actor)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Not allowed."));
        }
        List<NssTaskRegistration> regs = taskRegistrationRepository.findByVolunteerEmail(target);
        List<Map<String, Object>> enriched = new ArrayList<>();
        for (NssTaskRegistration r : regs) {
            Map<String, Object> row = new HashMap<>();
            row.put("registration", r);
            taskRepository.findById(r.getTaskId()).ifPresent(t -> row.put("task", t));
            enriched.add(row);
        }
        return ResponseEntity.ok(enriched);
    }

    /** POST /api/nss/tasks/{id}/register — approved volunteer registers for a task. */
    @PostMapping("/tasks/{id}/register")
    @Transactional
    public ResponseEntity<?> registerForTask(@PathVariable Long id,
                                             @RequestHeader(value = "Authorization", required = false) String authHeader) {
        String subject = subjectOf(authHeader);
        if (subject == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Sign-in required."));
        }

        // Backend-authorized rule: only APPROVED volunteers can register for restricted tasks.
        String state = computeLifetimeState(subject);
        if (!"APPROVED".equals(state)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Only approved NSS volunteers can register for tasks. Your status: " + state));
        }

        Optional<NssTask> opt = taskRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        NssTask task = opt.get();
        if (!"PUBLISHED".equalsIgnoreCase(task.getStatus())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Task is not open for registration."));
        }

        if (taskRegistrationRepository.findByTaskIdAndVolunteerEmail(id, subject).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("message", "You are already registered for this task."));
        }
        long taken = taskRegistrationRepository.countByTaskId(id);
        if (task.getCapacity() != null && taken >= task.getCapacity()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Task is full (" + taken + "/" + task.getCapacity() + ")."));
        }
        if (task.getRegistrationDeadline() != null && !task.getRegistrationDeadline().isBlank()) {
            LocalDate deadline;
            try {
                deadline = LocalDate.parse(task.getRegistrationDeadline());
                if (LocalDate.now().isAfter(deadline)) {
                    return ResponseEntity.badRequest().body(Map.of("message", "Registration deadline has passed (" + task.getRegistrationDeadline() + ")."));
                }
            } catch (Exception ignored) {
            }
        }

        NssTaskRegistration reg = new NssTaskRegistration();
        reg.setTaskId(id);
        reg.setVolunteerEmail(subject);
        reg.setAttendanceStatus("PENDING");
        reg.setVerificationStatus("NOT_VERIFIED");
        NssTaskRegistration saved = taskRegistrationRepository.save(reg);
        auditService.log(subject, "NSS_TASK_REGISTER", "NssTaskRegistration", saved.getId(), "taskId=" + id);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    /** GET /api/nss/tasks/{id}/registrations — admin views registered volunteers. */
    @GetMapping("/tasks/{id}/registrations")
    public ResponseEntity<?> taskRegistrations(@PathVariable Long id,
                                               @RequestHeader(value = "Authorization", required = false) String authHeader) {
        AuthContextService.Actor actor = authContextService.resolve(authHeader);
        if (!authContextService.isAdmin(actor)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Admin access required."));
        }
        List<NssTaskRegistration> regs = taskRegistrationRepository.findByTaskId(id);
        return ResponseEntity.ok(regs);
    }

    /** POST /api/nss/tasks/{id}/attendance — admin marks attendance (PRESENT/ABSENT per volunteer). */
    @PostMapping("/tasks/{id}/attendance")
    @Transactional
    public ResponseEntity<?> markAttendance(@PathVariable Long id,
                                            @RequestBody Map<String, Object> body,
                                            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        AuthContextService.Actor actor = authContextService.resolve(authHeader);
        if (!authContextService.isAdmin(actor)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Admin access required."));
        }
        String volunteerEmail = str(body.get("volunteerEmail"));
        String attendance = str(body.get("attendance"));
        if (volunteerEmail == null || attendance == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "volunteerEmail and attendance (PRESENT|ABSENT) are required."));
        }
        String clean = attendance.trim().toUpperCase();
        if (!List.of("PRESENT", "ABSENT").contains(clean)) {
            return ResponseEntity.badRequest().body(Map.of("message", "attendance must be PRESENT or ABSENT."));
        }
        Optional<NssTaskRegistration> reg = taskRegistrationRepository.findByTaskIdAndVolunteerEmail(id, volunteerEmail.toLowerCase());
        if (reg.isEmpty()) return ResponseEntity.notFound().build();

        NssTaskRegistration updated = reg.get();
        updated.setAttendanceStatus(clean);
        if ("ABSENT".equals(clean)) {
            // Absent volunteers receive zero verified hours.
            updated.setVerifiedHours(0.0);
            updated.setVerificationStatus("VERIFIED");
            updated.setVerifiedBy(null);
            updated.setVerifiedAt(LocalDateTime.now());
        }
        NssTaskRegistration saved = taskRegistrationRepository.save(updated);
        auditService.log(actor.email(), "NSS_ATTENDANCE_MARK", "NssTaskRegistration", saved.getId(),
                volunteerEmail + "=" + clean);
        return ResponseEntity.ok(saved);
    }

    /** POST /api/nss/tasks/{id}/hours — admin verifies actual completed hours for an attended volunteer. */
    @PostMapping("/tasks/{id}/hours")
    @Transactional
    public ResponseEntity<?> verifyHours(@PathVariable Long id,
                                         @RequestBody Map<String, Object> body,
                                         @RequestHeader(value = "Authorization", required = false) String authHeader) {
        AuthContextService.Actor actor = authContextService.resolve(authHeader);
        if (!authContextService.isAdmin(actor)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Admin access required."));
        }
        String volunteerEmail = str(body.get("volunteerEmail"));
        Double actualHours = num(body.get("actualHours"));
        if (volunteerEmail == null || actualHours == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "volunteerEmail and actualHours are required."));
        }
        if (actualHours < 0 || actualHours > 24) {
            return ResponseEntity.badRequest().body(Map.of("message", "actualHours must be between 0 and 24."));
        }
        Optional<NssTaskRegistration> reg =
                taskRegistrationRepository.findByTaskIdAndVolunteerEmail(id, volunteerEmail.toLowerCase());
        if (reg.isEmpty()) return ResponseEntity.notFound().build();
        NssTaskRegistration r = reg.get();

        if (!"PRESENT".equals(r.getAttendanceStatus())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Only PRESENT volunteers can receive verified hours."));
        }
        if ("VERIFIED".equals(r.getVerificationStatus())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Hours already verified for this participation; duplicates are not allowed."));
        }

        Double cap = taskRepository.findById(id).map(NssTask::getExpectedHours).orElse(24.0);
        Double award = Math.min(actualHours, cap);
        r.setVerifiedHours(award);
        r.setVerificationStatus("VERIFIED");
        r.setVerifiedBy(actor.email() != null ? hash(actor.email()) : null);
        r.setVerifiedAt(LocalDateTime.now());
        NssTaskRegistration saved = taskRegistrationRepository.save(r);
        auditService.log(actor.email(), "NSS_HOURS_VERIFY", "NssTaskRegistration", saved.getId(),
                volunteerEmail + "=" + award + "h (cap " + cap + "h)");
        return ResponseEntity.ok(saved);
    }

    /** GET /api/nss/my/hours?email= — service-hour totals. Only verified + attended participation counts. */
    @GetMapping("/my/hours")
    public ResponseEntity<?> myHours(@RequestParam(value = "email", required = false) String email,
                                     @RequestHeader(value = "Authorization", required = false) String authHeader) {
        String target = email != null && !email.isBlank() ? email.trim().toLowerCase() : subjectOf(authHeader);
        if (target == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Sign-in required."));
        }
        AuthContextService.Actor actor = authContextService.resolve(authHeader);
        if (!target.equalsIgnoreCase(subjectOf(authHeader)) && !authContextService.isAdmin(actor)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Not allowed."));
        }
        List<NssTaskRegistration> regs = taskRegistrationRepository.findByVolunteerEmail(target);
        double verified = regs.stream()
                .filter(r -> "PRESENT".equals(r.getAttendanceStatus()))
                .filter(r -> "VERIFIED".equals(r.getVerificationStatus()))
                .filter(r -> r.getVerifiedHours() != null && r.getVerifiedHours() > 0)
                .mapToDouble(NssTaskRegistration::getVerifiedHours)
                .sum();
        double pending = regs.stream()
                .filter(r -> "PRESENT".equals(r.getAttendanceStatus()))
                .filter(r -> !"VERIFIED".equals(r.getVerificationStatus()))
                .mapToDouble(r -> taskRepository.findById(r.getTaskId()).map(NssTask::getExpectedHours).orElse(0.0))
                .sum();
        double scheduled = regs.stream()
                .filter(r -> "PENDING".equals(r.getAttendanceStatus()))
                .mapToDouble(r -> taskRepository.findById(r.getTaskId()).map(NssTask::getExpectedHours).orElse(0.0))
                .sum();
        long attendedCount = regs.stream().filter(r -> "PRESENT".equals(r.getAttendanceStatus())).count();
        long completedCount = regs.stream()
                .filter(r -> "PRESENT".equals(r.getAttendanceStatus()) && "VERIFIED".equals(r.getVerificationStatus()))
                .count();

        Map<String, Object> out = new HashMap<>();
        out.put("verifiedHours", verified);
        out.put("scheduledHours", scheduled);
        out.put("pendingVerificationHours", pending);
        out.put("attendedTasks", attendedCount);
        out.put("completedTasks", completedCount);
        return ResponseEntity.ok(out);
    }

    /** GET /api/nss/summary — public landing-page aggregates (counts only, no PII). */
    @GetMapping("/summary")
    public ResponseEntity<?> publicSummary() {
        long approved = applicationRepository.findAll().stream()
                .filter(a -> "APPROVED".equals(a.getStatus()))
                .count();
        long publishedTasks = taskRepository.findAll().stream()
                .filter(t -> "PUBLISHED".equalsIgnoreCase(t.getStatus()))
                .count();
        double totalVerifiedHours = taskRegistrationRepository.findAll().stream()
                .filter(r -> "PRESENT".equals(r.getAttendanceStatus()) && "VERIFIED".equals(r.getVerificationStatus()))
                .filter(r -> r.getVerifiedHours() != null)
                .mapToDouble(NssTaskRegistration::getVerifiedHours)
                .sum();
        return ResponseEntity.ok(Map.of(
                "approvedVolunteers", approved,
                "publishedTasks", publishedTasks,
                "totalVerifiedHours", totalVerifiedHours
        ));
    }

    // ---------- helpers ----------

    /** Lifetime state used everywhere for authorization. */
    private String computeLifetimeState(String email) {
        if (applicationRepository.findByStudentEmailAndStatus(email, "APPROVED").isPresent()) return "APPROVED";
        if (applicationRepository.findByStudentEmailAndStatus(email, "PENDING").isPresent()) return "PENDING";
        if (applicationRepository.findByStudentEmailAndStatus(email, "REJECTED").isPresent()) return "REJECTED";
        if (applicationRepository.findByStudentEmailAndStatus(email, "WITHDRAWN").isPresent()) return "WITHDRAWN";
        return "NOT_REGISTERED";
    }

    private String subjectOf(String authHeader) {
        AuthContextService.Actor actor = authContextService.resolve(authHeader);
        return actor == null ? null : actor.email();
    }

    private String hash(String email) {
        // Privacy-preserving opaque reference for stored reviewedBy / verifiedBy fields.
        if (email == null) return null;
        return String.format("%08x", email.hashCode());
    }

    private String str(Object o) {
        if (o == null) return null;
        String s = String.valueOf(o).trim();
        return s.isEmpty() ? null : s;
    }

    private Double num(Object o) {
        if (o == null) return null;
        try {
            return Double.parseDouble(String.valueOf(o));
        } catch (Exception e) {
            return null;
        }
    }

    private Integer intOf(Object o, Integer dflt) {
        if (o == null) return dflt;
        try {
            return Integer.parseInt(String.valueOf(o));
        } catch (Exception e) {
            return dflt;
        }
    }

    private Boolean bool(Object o) {
        if (o == null) return Boolean.FALSE;
        if (o instanceof Boolean b) return b;
        return Boolean.parseBoolean(String.valueOf(o));
    }
}
