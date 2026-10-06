package com.college.eventmanager.model;

import jakarta.persistence.*;

@Entity
@Table(name = "events")
public class Event {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "category")
    private String category;

    @Column(name = "event_date")
    private String eventDate;

    @Column(name = "venue")
    private String venue;

    @Column(name = "registration_fee")
    private Double registrationFee;

    @Column(name = "upi_id")
    private String upiId;

    public Event() {}

    public Event(String title, String category, String eventDate,
                 String venue, Double registrationFee, String upiId) {
        this.title = title;
        this.category = category;
        this.eventDate = eventDate;
        this.venue = venue;
        this.registrationFee = registrationFee;
        this.upiId = upiId;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getEventDate() { return eventDate; }
    public void setEventDate(String eventDate) { this.eventDate = eventDate; }

    public String getVenue() { return venue; }
    public void setVenue(String venue) { this.venue = venue; }

    public Double getRegistrationFee() { return registrationFee; }
    public void setRegistrationFee(Double registrationFee) { this.registrationFee = registrationFee; }

    public String getUpiId() { return upiId; }
    public void setUpiId(String upiId) { this.upiId = upiId; }
}
