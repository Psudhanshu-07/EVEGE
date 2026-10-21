package com.college.eventmanager.model;

import jakarta.persistence.*;

@Entity
@Table(name = "nss_tasks")
public class NssTask {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "service_category", length = 100)
    private String serviceCategory; // CLEANLINESS / ENVIRONMENT / COMMUNITY_OUTREACH / AWARENESS / OTHER

    @Column(name = "task_date")
    private String taskDate; // yyyy-MM-dd (text-friendly with existing Event.date)

    @Column(name = "start_time")
    private String startTime; // HH:mm

    @Column(name = "end_time")
    private String endTime;   // HH:mm

    @Column(length = 255)
    private String location;

    @Column(name = "expected_hours")
    private Double expectedHours; // scheduled duration

    @Column(name = "travel_assistance")
    private Boolean travelAssistance = Boolean.FALSE;

    @Column(name = "accommodation_provided")
    private Boolean accommodationProvided = Boolean.FALSE;

    @Column(name = "capacity")
    private Integer capacity = 50;

    @Column(name = "registration_deadline")
    private String registrationDeadline;

    @Column(name = "eligibility", columnDefinition = "TEXT")
    private String eligibility;

    @Column(name = "instructions", columnDefinition = "TEXT")
    private String instructions;

    @Column(name = "status", nullable = false, length = 30)
    private String status = "DRAFT"; // DRAFT / PUBLISHED / COMPLETED / CANCELLED

    @Column(name = "is_demo")
    private Boolean isDemo = Boolean.FALSE;

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getServiceCategory() { return serviceCategory; }
    public void setServiceCategory(String serviceCategory) { this.serviceCategory = serviceCategory; }
    public String getTaskDate() { return taskDate; }
    public void setTaskDate(String taskDate) { this.taskDate = taskDate; }
    public String getStartTime() { return startTime; }
    public void setStartTime(String startTime) { this.startTime = startTime; }
    public String getEndTime() { return endTime; }
    public void setEndTime(String endTime) { this.endTime = endTime; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public Double getExpectedHours() { return expectedHours; }
    public void setExpectedHours(Double expectedHours) { this.expectedHours = expectedHours; }
    public Boolean getTravelAssistance() { return travelAssistance; }
    public void setTravelAssistance(Boolean travelAssistance) { this.travelAssistance = travelAssistance; }
    public Boolean getAccommodationProvided() { return accommodationProvided; }
    public void setAccommodationProvided(Boolean accommodationProvided) { this.accommodationProvided = accommodationProvided; }
    public Integer getCapacity() { return capacity; }
    public void setCapacity(Integer capacity) { this.capacity = capacity; }
    public String getRegistrationDeadline() { return registrationDeadline; }
    public void setRegistrationDeadline(String registrationDeadline) { this.registrationDeadline = registrationDeadline; }
    public String getEligibility() { return eligibility; }
    public void setEligibility(String eligibility) { this.eligibility = eligibility; }
    public String getInstructions() { return instructions; }
    public void setInstructions(String instructions) { this.instructions = instructions; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status == null ? "DRAFT" : status.toUpperCase(); }
    public Boolean getIsDemo() { return isDemo; }
    public void setIsDemo(Boolean isDemo) { this.isDemo = isDemo; }
}
