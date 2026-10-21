package com.college.eventmanager.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "event_scores")
public class EventScore {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Denormalized eventId for simple unique keying. */
    @Column(name = "event_id", nullable = false)
    private Long eventId;

    /** Categorical label used when ranking participant-per-event. */
    @Column(name = "event_category", length = 50)
    private String eventCategory;

    @Column(name = "participant_type", nullable = false, length = 20)
    private String participantType = "COLLEGE"; // COLLEGE / EXTERNAL

    @Column(name = "participant_email", nullable = false, length = 255)
    private String participantEmail;

    @Column(name = "participant_name", nullable = false)
    private String participantName;

    /** Trusted division A-E (internal students only; nullable for externals). */
    @Column(name = "division", length = 1)
    private String division;

    @Column(name = "branch", length = 100)
    private String branch;

    @Column(nullable = false)
    private Double marks;

    @Column(name = "remarks", columnDefinition = "TEXT")
    private String remarks;

    @Column(name = "updated_by", length = 120)
    private String updatedBy; // email of admin who last saved

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "version")
    private Integer version = 1;

    public Long getId() { return id; }
    public Long getEventId() { return eventId; }
    public void setEventId(Long eventId) { this.eventId = eventId; }
    public String getEventCategory() { return eventCategory; }
    public void setEventCategory(String eventCategory) { this.eventCategory = eventCategory; }
    public String getParticipantType() { return participantType; }
    public void setParticipantType(String participantType) { this.participantType = participantType == null ? "COLLEGE" : participantType.toUpperCase(); }
    public String getParticipantEmail() { return participantEmail; }
    public void setParticipantEmail(String participantEmail) { this.participantEmail = participantEmail == null ? null : participantEmail.trim().toLowerCase(); }
    public String getParticipantName() { return participantName; }
    public void setParticipantName(String participantName) { this.participantName = participantName; }
    public String getDivision() { return division; }
    public void setDivision(String division) { this.division = division; }
    public String getBranch() { return branch; }
    public void setBranch(String branch) { this.branch = branch; }
    public Double getMarks() { return marks; }
    public void setMarks(Double marks) { this.marks = marks; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public Integer getVersion() { return version; }
    public void setVersion(Integer version) { this.version = version; }

    @PreUpdate
    void touch() {
        this.updatedAt = LocalDateTime.now();
        if (this.version == null) this.version = 1;
        else this.version = this.version + 1;
    }
}
