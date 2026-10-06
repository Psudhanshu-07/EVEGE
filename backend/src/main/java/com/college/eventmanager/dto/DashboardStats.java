package com.college.eventmanager.dto;

public class DashboardStats {

    private long totalEvents;
    private long totalRegistrations;
    private double totalCollectedFees;
    private long festTracks;

    public DashboardStats() {}

    public DashboardStats(long totalEvents, long totalRegistrations,
                          double totalCollectedFees, long festTracks) {
        this.totalEvents = totalEvents;
        this.totalRegistrations = totalRegistrations;
        this.totalCollectedFees = totalCollectedFees;
        this.festTracks = festTracks;
    }

    public long getTotalEvents() { return totalEvents; }
    public void setTotalEvents(long totalEvents) { this.totalEvents = totalEvents; }

    public long getTotalRegistrations() { return totalRegistrations; }
    public void setTotalRegistrations(long totalRegistrations) { this.totalRegistrations = totalRegistrations; }

    public double getTotalCollectedFees() { return totalCollectedFees; }
    public void setTotalCollectedFees(double totalCollectedFees) { this.totalCollectedFees = totalCollectedFees; }

    public long getFestTracks() { return festTracks; }
    public void setFestTracks(long festTracks) { this.festTracks = festTracks; }
}
