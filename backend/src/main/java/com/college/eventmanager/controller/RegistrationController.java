package com.college.eventmanager.controller;

import com.college.eventmanager.dto.RegistrationRequest;
import com.college.eventmanager.model.Event;
import com.college.eventmanager.model.Registration;
import com.college.eventmanager.repository.EventRepository;
import com.college.eventmanager.repository.RegistrationRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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

    public RegistrationController(RegistrationRepository registrationRepository,
                                  EventRepository eventRepository) {
        this.registrationRepository = registrationRepository;
        this.eventRepository = eventRepository;
    }

    /** GET /api/registrations - returns all registrations stored in PostgreSQL. */
    @GetMapping
    public List<Registration> getAllRegistrations(@RequestParam(value = "email", required = false) String email) {
        if (email != null && !email.isBlank()) {
            return registrationRepository.findAll().stream()
                    .filter(r -> email.equalsIgnoreCase(r.getStudentEmail()))
                    .toList();
        }
        return registrationRepository.findAll();
    }

    /**
     * POST /api/registrations - registers student for an event.
     * Auto-generates transaction reference if payment is submitted in mock mode.
     */
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

        // Transaction reference: use provided or auto-generate mock UPI ref
        String txn = request.getTransactionRef();
        if (txn == null || txn.isBlank()) {
            txn = "UPI" + System.currentTimeMillis() + UUID.randomUUID().toString().substring(0, 4).toUpperCase();
        }
        registration.setTransactionRef(txn);

        registration.setPaymentStatus(request.getPaymentStatus() == null || request.getPaymentStatus().isBlank()
                ? "PAID"
                : request.getPaymentStatus());
        registration.setRegisteredAt(LocalDateTime.now());

        Registration saved = registrationRepository.save(registration);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }
}
