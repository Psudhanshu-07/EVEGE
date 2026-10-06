package com.college.eventmanager.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "registrations")
public class Registration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_name")
    private String studentName;

    @Column(name = "student_email")
    private String studentEmail;

    @Column(name = "college_id")
    private String collegeId;

    @Column(name = "event_id")
    private Long eventId;

    @Column(name = "event_title")
    private String eventTitle;

    @Column(name = "category")
    private String category;

    @Column(name = "amount")
    private Double amount = 100.00;

    @Column(name = "transaction_ref")
    private String transactionRef;

    @Column(name = "payment_status")
    private String paymentStatus = "CONFIRMED";

    @Column(name = "registered_at")
    private LocalDateTime registeredAt = LocalDateTime.now();

    public Registration() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getStudentName() { return studentName; }
    public void setStudentName(String studentName) { this.studentName = studentName; }

    public String getStudentEmail() { return studentEmail; }
    public void setStudentEmail(String studentEmail) { this.studentEmail = studentEmail; }

    public String getCollegeId() { return collegeId; }
    public void setCollegeId(String collegeId) { this.collegeId = collegeId; }

    public Long getEventId() { return eventId; }
    public void setEventId(Long eventId) { this.eventId = eventId; }

    public String getEventTitle() { return eventTitle; }
    public void setEventTitle(String eventTitle) { this.eventTitle = eventTitle; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public Double getAmount() { return amount; }
    public void setAmount(Double amount) { this.amount = amount; }

    public String getTransactionRef() { return transactionRef; }
    public void setTransactionRef(String transactionRef) { this.transactionRef = transactionRef; }

    public String getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }

    public LocalDateTime getRegisteredAt() { return registeredAt; }
    public void setRegisteredAt(LocalDateTime registeredAt) { this.registeredAt = registeredAt; }
}
