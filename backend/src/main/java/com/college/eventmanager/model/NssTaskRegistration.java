package com.college.eventmanager.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "nss_task_registrations")
public class NssTaskRegistration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "task_id", nullable = false)
    private Long taskId;

    @Column(name = "volunteer_email", nullable = false, length = 255)
    private String volunteerEmail;

    @Column(name = "attendance_status")
    private String attendanceStatus = "PENDING"; // PENDING / PRESENT / ABSENT

    @Column(name = "verified_hours")
    private Double verifiedHours; // actual completed hours, admin-verified

    @Column(name = "verification_status")
    private String verificationStatus = "NOT_VERIFIED"; // NOT_VERIFIED / VERIFIED

    @Column(name = "verified_by", length = 120)
    private String verifiedBy;

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    @Column(name = "registered_at")
    private LocalDateTime registeredAt = LocalDateTime.now();

    public Long getId() { return id; }
    public String getVolunteerEmail() { return volunteerEmail; }
    public void setVolunteerEmail(String volunteerEmail) { this.volunteerEmail = volunteerEmail == null ? null : volunteerEmail.trim().toLowerCase(); }
    public Long getTaskId() { return taskId; }
    public void setTaskId(Long taskId) { this.taskId = taskId; }
    public String getAttendanceStatus() { return attendanceStatus; }
    public void setAttendanceStatus(String attendanceStatus) { this.attendanceStatus = attendanceStatus == null ? "PENDING" : attendanceStatus.toUpperCase(); }
    public Double getVerifiedHours() { return verifiedHours; }
    public void setVerifiedHours(Double verifiedHours) { this.verifiedHours = verifiedHours; }
    public String getVerificationStatus() { return verificationStatus; }
    public void setVerificationStatus(String verificationStatus) { this.verificationStatus = verificationStatus == null ? "NOT_VERIFIED" : verificationStatus.toUpperCase(); }
    public String getVerifiedBy() { return verifiedBy; }
    public void setVerifiedBy(String verifiedBy) { this.verifiedBy = verifiedBy; }
    public LocalDateTime getVerifiedAt() { return verifiedAt; }
    public void setVerifiedAt(LocalDateTime verifiedAt) { this.verifiedAt = verifiedAt; }
    public LocalDateTime getRegisteredAt() { return registeredAt; }
    public void setRegisteredAt(LocalDateTime registeredAt) { this.registeredAt = registeredAt; }

    @PrePersist
    @PreUpdate
    void normalize() {
        if (volunteerEmail != null) volunteerEmail = volunteerEmail.trim().toLowerCase();
        if (attendanceStatus == null) attendanceStatus = "PENDING";
        else attendanceStatus = attendanceStatus.toUpperCase();
        if (verificationStatus == null) verificationStatus = "NOT_VERIFIED";
        else verificationStatus = verificationStatus.toUpperCase();
    }
}
