package com.college.eventmanager.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "nss_applications")
public class NssApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_email", nullable = false, length = 255)
    private String studentEmail;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(name = "student_id")
    private String studentId; // roll number / college id

    @Column(name = "phone")
    private String phone;

    @Column(name = "branch")
    private String branch;

    @Column(name = "division", length = 1)
    private String division; // A-E, for internal students (nullable)

    @Column(name = "academic_year")
    private String academicYear;

    @Column(name = "experience", columnDefinition = "TEXT")
    private String experience;

    @Column(name = "availability", columnDefinition = "TEXT")
    private String availability;

    @Column(name = "motivation", columnDefinition = "TEXT")
    private String motivation;

    @Column(name = "consent_given")
    private Boolean consentGiven = Boolean.TRUE;

    @Column(name = "status", nullable = false)
    private String status = "PENDING"; // PENDING / APPROVED / REJECTED / WITHDRAWN

    @Column(name = "status_upgraded_at")
    private LocalDateTime statusUpgradedAt;

    private Integer version = 0;

    @Column(name = "admin_note", columnDefinition = "TEXT")
    private String adminNote;

    @Column(name = "reviewed_by", length = 120)
    private String reviewedBy;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    /** Allows at most ONE active application per email (PENDING or APPROVED). */
    @Column(name = "active")
    private Integer active;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt = LocalDateTime.now();

    public Long getId() { return id; }
    public String getStudentEmail() { return studentEmail; }
    public void setStudentEmail(String studentEmail) { this.studentEmail = studentEmail == null ? null : studentEmail.trim().toLowerCase(); }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getStudentId() { return studentId; }
    public void setStudentId(String studentId) { this.studentId = studentId; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getBranch() { return branch; }
    public void setBranch(String branch) { this.branch = branch; }
    public String getDivision() { return division; }
    public void setDivision(String division) { this.division = division; }
    public String getAcademicYear() { return academicYear; }
    public void setAcademicYear(String academicYear) { this.academicYear = academicYear; }
    public String getExperience() { return experience; }
    public void setExperience(String experience) { this.experience = experience; }
    public String getAvailability() { return availability; }
    public void setAvailability(String availability) { this.availability = availability; }
    public String getMotivation() { return motivation; }
    public void setMotivation(String motivation) { this.motivation = motivation; }
    public Boolean getConsentGiven() { return consentGiven; }
    public void setConsentGiven(Boolean consentGiven) { this.consentGiven = consentGiven; }
    public String getStatus() { return status; }
    public void setStatus(String status) {
        this.status = status == null ? "PENDING" : status.toUpperCase();
        this.statusUpgradedAt = LocalDateTime.now();
    }
    public LocalDateTime getStatusUpgradedAt() { return statusUpgradedAt; }
    public void setStatusUpgradedAt(LocalDateTime statusUpgradedAt) { this.statusUpgradedAt = statusUpgradedAt; }
    public Integer getVersion() { return version; }
    public void setVersion(Integer version) { this.version = version; }
    public String getAdminNote() { return adminNote; }
    public void setAdminNote(String adminNote) { this.adminNote = adminNote; }
    public String getReviewedBy() { return reviewedBy; }
    public void setReviewedBy(String reviewedBy) { this.reviewedBy = reviewedBy; }
    public LocalDateTime getReviewedAt() { return reviewedAt; }
    public void setReviewedAt(LocalDateTime reviewedAt) { this.reviewedAt = reviewedAt; }
    public Integer getActive() { return active; }
    public void setActive(Integer active) { this.active = active; }
    public LocalDateTime getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }
}
