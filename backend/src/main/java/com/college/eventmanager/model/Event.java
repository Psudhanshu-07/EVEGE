package com.college.eventmanager.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "events")
public class Event {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "category", nullable = false)
    private String category; // "Technical", "Sports", "Cultural"

    @Column(name = "event_date")
    private String eventDate;

    @Column(name = "event_time")
    private String eventTime;

    @Column(name = "venue")
    private String venue;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "tagline")
    private String tagline;

    @Column(name = "banner_theme")
    private String bannerTheme;

    @Column(name = "registration_fee")
    private Double registrationFee = 100.00;

    @Column(name = "upi_id")
    private String upiId = "evege@okaxis";

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    public Event() {}

    public Event(String title, String category, String eventDate, String eventTime,
                 String venue, String description, String tagline, String bannerTheme,
                 Double registrationFee, String upiId) {
        this.title = title;
        this.category = category;
        this.eventDate = eventDate;
        this.eventTime = eventTime;
        this.venue = venue;
        this.description = description;
        this.tagline = tagline;
        this.bannerTheme = bannerTheme;
        this.registrationFee = registrationFee != null ? registrationFee : 100.00;
        this.upiId = upiId != null && !upiId.isBlank() ? upiId : "evege@okaxis";
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getEventDate() { return eventDate; }
    public void setEventDate(String eventDate) { this.eventDate = eventDate; }

    public String getEventTime() { return eventTime; }
    public void setEventTime(String eventTime) { this.eventTime = eventTime; }

    public String getVenue() { return venue; }
    public void setVenue(String venue) { this.venue = venue; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getTagline() { return tagline; }
    public void setTagline(String tagline) { this.tagline = tagline; }

    public String getBannerTheme() { return bannerTheme; }
    public void setBannerTheme(String bannerTheme) { this.bannerTheme = bannerTheme; }

    public Double getRegistrationFee() { return registrationFee; }
    public void setRegistrationFee(Double registrationFee) { this.registrationFee = registrationFee; }

    public String getUpiId() { return upiId; }
    public void setUpiId(String upiId) { this.upiId = upiId; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
