package com.college.eventmanager.controller;

import com.college.eventmanager.dto.RegistrationRequest;
import com.college.eventmanager.model.Event;
import com.college.eventmanager.model.Registration;
import com.college.eventmanager.model.Student;
import com.college.eventmanager.model.User;
import com.college.eventmanager.repository.EventRepository;
import com.college.eventmanager.repository.RegistrationRepository;
import com.college.eventmanager.repository.StudentRepository;
import com.college.eventmanager.repository.UserRepository;
import com.college.eventmanager.service.AccountSyncService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/registrations")
public class RegistrationController {

    private final RegistrationRepository registrationRepository;
    private final EventRepository eventRepository;
    private final StudentRepository studentRepository;
    private final UserRepository userRepository;
    private final AccountSyncService accountSyncService;
    private final PasswordEncoder passwordEncoder;

    public RegistrationController(RegistrationRepository registrationRepository,
                                  EventRepository eventRepository,
                                  StudentRepository studentRepository,
                                  UserRepository userRepository,
                                  AccountSyncService accountSyncService,
                                  PasswordEncoder passwordEncoder) {
        this.registrationRepository = registrationRepository;
        this.eventRepository = eventRepository;
        this.studentRepository = studentRepository;
        this.userRepository = userRepository;
        this.accountSyncService = accountSyncService;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping
    public List<Registration> getAllRegistrations(@RequestParam(value = "email", required = false) String email) {
        if (email != null && !email.isBlank()) {
            return registrationRepository.findAll().stream()
                    .filter(r -> email.equalsIgnoreCase(r.getStudentEmail()))
                    .toList();
        }
        return registrationRepository.findAll();
    }

    @PostMapping
    public ResponseEntity<?> createRegistration(@RequestBody RegistrationRequest request) {
        if (request.getEventId() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "eventId is required"));
        }

        Event event = eventRepository.findById(request.getEventId()).orElse(null);
        if (event == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Event not found"));
        }

        Registration registration = new Registration();
        registration.setStudentName(request.getStudentName() != null && !request.getStudentName().isBlank()
                ? request.getStudentName() : "Student Participant");
        registration.setStudentEmail(request.getStudentEmail());
        registration.setCollegeId(request.getCollegeId() != null && !request.getCollegeId().isBlank()
                ? request.getCollegeId() : "COLLEGE-ID");
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

        Registration saved = registrationRepository.save(registration);

        if (request.getStudentEmail() != null && !request.getStudentEmail().isBlank()) {
            String studentEmail = request.getStudentEmail().trim().toLowerCase();
            String studentName = request.getStudentName() != null && !request.getStudentName().isBlank()
                    ? request.getStudentName().trim() : "Student Participant";
            String rollNum = request.getCollegeId() != null && !request.getCollegeId().isBlank()
                    ? request.getCollegeId().trim() : "COLLEGE-ID";

            if (userRepository.findByEmail(studentEmail).isEmpty()) {
                User user = new User();
                user.setFullName(studentName);
                user.setEmail(studentEmail);
                user.setRollNumber(rollNum);
                user.setPassword(passwordEncoder.encode("123321"));
                user.setRole("STUDENT");
                user.setCollege("College Student");
                userRepository.save(user);
            }

            if (studentRepository.findByEmail(studentEmail).isEmpty()) {
                Student student = new Student();
                student.setFullName(studentName);
                student.setEmail(studentEmail);
                student.setRollNumber(rollNum);
                student.setPassword(passwordEncoder.encode("123321"));
                student.setCollege("College Student");
                studentRepository.save(student);
            }

            accountSyncService.syncAccount(
                    studentName,
                    studentEmail,
                    "",
                    "College Student",
                    "Engineering",
                    rollNum,
                    "1st Year",
                    "Other",
                    "123321",
                    "STUDENT"
            );
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }
}
