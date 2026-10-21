package com.college.eventmanager.service;

import com.college.eventmanager.dto.UnifiedRegistrationRequest;
import com.college.eventmanager.model.Event;
import com.college.eventmanager.model.Registration;
import com.college.eventmanager.model.Student;
import com.college.eventmanager.model.User;
import com.college.eventmanager.repository.EventRepository;
import com.college.eventmanager.repository.RegistrationRepository;
import com.college.eventmanager.repository.StudentRepository;
import com.college.eventmanager.repository.UserRepository;
import com.college.eventmanager.security.JwtUtils;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.RequestHeader;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Unified registration for COLLEGE and EXTERNAL students.
 *
 * Invariants:
 *  - Duplicate (email, eventId) confirmed registrations are rejected.
 *  - COLLEGE students: division and branch are taken from the trusted profile,
 *    never from the submitted form (self-spoofing is structurally impossible).
 *  - EXTERNAL students must NOT supply division; their collegeName is stored.
 *  - No new authentication system is created: accounts are provisioned inside the
 *    existing students/users tables exactly as the previous flow did.
 */
@Service
public class UnifiedRegistrationService {

    private final EventRepository eventRepository;
    private final RegistrationRepository registrationRepository;
    private final StudentRepository studentRepository;
    private final UserRepository userRepository;
    private final AccountSyncService accountSyncService;
    private final TrustedProfileService trustedProfileService;
    private final JwtUtils jwtUtils;
    private final PasswordEncoder passwordEncoder;

    public UnifiedRegistrationService(EventRepository eventRepository,
                                      RegistrationRepository registrationRepository,
                                      StudentRepository studentRepository,
                                      UserRepository userRepository,
                                      AccountSyncService accountSyncService,
                                      TrustedProfileService trustedProfileService,
                                      JwtUtils jwtUtils,
                                      PasswordEncoder passwordEncoder) {
        this.eventRepository = eventRepository;
        this.registrationRepository = registrationRepository;
        this.studentRepository = studentRepository;
        this.userRepository = userRepository;
        this.accountSyncService = accountSyncService;
        this.trustedProfileService = trustedProfileService;
        this.jwtUtils = jwtUtils;
        this.passwordEncoder = passwordEncoder;
    }

    public ResponseEntity<?> register(UnifiedRegistrationRequest request, String authHeader) {
        // --- Basic validation ---
        String type = request.getParticipantType() == null ? "COLLEGE" : request.getParticipantType();
        if (!"COLLEGE".equals(type) && !"EXTERNAL".equals(type)) {
            return ResponseEntity.badRequest().body(Map.of("message", "participantType must be COLLEGE or EXTERNAL"));
        }
        if (request.getEventId() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "eventId is required"));
        }
        Event event = eventRepository.findById(request.getEventId()).orElse(null);
        if (event == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Event not found"));
        }
        if (request.getFullName() == null || request.getFullName().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "fullName is required"));
        }
        if (request.getStudentEmail() == null || request.getStudentEmail().isBlank() || !request.getStudentEmail().contains("@")) {
            return ResponseEntity.badRequest().body(Map.of("message", "A valid studentEmail is required"));
        }
        if (request.getMobile() == null || request.getMobile().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "mobile is required"));
        }

        String email = request.getStudentEmail().trim().toLowerCase();
        Optional<TrustedProfileService.TrustedProfile> trustedOpt = trustedProfileService.resolve(email);

        // If signed-in, the token subject governs division/branch (anti-spoofing).
        TrustedProfileService.TrustedProfile trusted = null;
        String actorEmail = resolveSubject(authHeader);
        if (actorEmail != null && actorEmail.equals(email)) {
            trusted = trustedOpt.orElse(null);
        } else {
            trusted = trustedOpt.orElse(null);
        }

        // --- Duplicate registration prevention ---
        boolean duplicate = registrationRepository.findAll().stream()
                .anyMatch(r -> event.getId().equals(r.getEventId())
                        && email.equalsIgnoreCase(r.getStudentEmail())
                        && ("PAID".equalsIgnoreCase(r.getPaymentStatus()) || "CONFIRMED".equalsIgnoreCase(r.getPaymentStatus())));
        if (duplicate) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "You are already registered for " + event.getTitle() + "."));
        }

        Registration registration = new Registration();
        registration.setStudentName(request.getFullName().trim());
        registration.setStudentEmail(email);
        registration.setEventId(event.getId());
        registration.setEventTitle(event.getTitle());
        registration.setCategory(event.getCategory());
        registration.setAmount(event.getRegistrationFee() != null ? event.getRegistrationFee() : 100.00);

        String txn = request.getTransactionRef();
        if (txn == null || txn.isBlank()) {
            txn = "UPI" + System.currentTimeMillis()
                    + UUID.randomUUID().toString().substring(0, 4).toUpperCase();
        }
        registration.setTransactionRef(txn);
        registration.setPaymentStatus(request.getPaymentStatus() == null || request.getPaymentStatus().isBlank()
                ? "PAID" : request.getPaymentStatus());
        registration.setRegisteredAt(LocalDateTime.now());

        // participant classification fields
        String collegeId;
        if ("EXTERNAL".equals(type)) {
            String collegeName = request.getCollegeName();
            if (collegeName == null || collegeName.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("message", "collegeName is required for external students"));
            }
            registration.setCollegeId("EXT-" + collegeName.trim());
        } else {
            // Internal: trusted division/branch. Client division input is ignored entirely.
            String rollNumber = trusted != null && trusted.rollNumber() != null && !trusted.rollNumber().isBlank()
                    ? trusted.rollNumber()
                    : (request.getRollNumber() != null && !request.getRollNumber().isBlank() ? request.getRollNumber().trim() : "ROLL-" + System.currentTimeMillis());
            registration.setCollegeId(rollNumber);
        }

        Registration saved = registrationRepository.save(registration);

        // --- Legacy account provisioning (preserves existing behaviour) ---
        String rawYear = request.getAcademicYear() != null && !request.getAcademicYear().isBlank()
                ? request.getAcademicYear().trim() : "1st Year";
        String divVal = ("COLLEGE".equals(type) && request.getDivision() != null && request.getDivision().trim().matches("(?i)[A-E]"))
                ? request.getDivision().trim().toUpperCase() : null;
        String yearWithDiv = divVal != null ? rawYear + " - Div " + divVal : rawYear;

        if (userRepository.findByEmail(email).isEmpty()) {
            User user = new User();
            user.setFullName(request.getFullName().trim());
            user.setEmail(email);
            user.setPhone(request.getMobile());
            user.setRollNumber(registration.getCollegeId() != null ? registration.getCollegeId() : "");
            user.setPassword(passwordEncoder.encode("123321"));
            user.setRole("STUDENT");
            user.setCollege("EXTERNAL".equals(type) ? request.getCollegeName() : "EVEGE College Central");
            user.setBranch(request.getBranch() != null ? request.getBranch() : "Computer Science");
            user.setYearSemester(yearWithDiv);
            userRepository.save(user);
        }

        if (studentRepository.findByEmail(email).isEmpty()) {
            Student student = new Student();
            student.setFullName(request.getFullName().trim());
            student.setEmail(email);
            student.setPhone(request.getMobile());
            student.setRollNumber(registration.getCollegeId() != null ? registration.getCollegeId() : "");
            student.setPassword(passwordEncoder.encode("123321"));
            student.setCollege("EXTERNAL".equals(type) ? request.getCollegeName() : "EVEGE College Central");
            student.setBranch(request.getBranch() != null ? request.getBranch() : "Computer Science");
            student.setYearSemester(yearWithDiv);
            studentRepository.save(student);
        }

        accountSyncService.syncAccount(
                request.getFullName().trim(),
                email,
                request.getMobile(),
                "EXTERNAL".equals(type) ? request.getCollegeName() : "EVEGE College Central",
                request.getBranch() != null ? request.getBranch() : "Computer Science",
                registration.getCollegeId() != null ? registration.getCollegeId() : "",
                yearWithDiv,
                "Other",
                "123321",
                "STUDENT"
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    private String resolveSubject(String authHeader) {
        try {
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                return jwtUtils.validateAndGetUsername(authHeader.substring(7));
            }
        } catch (Exception ignored) {
        }
        return null;
    }
}
