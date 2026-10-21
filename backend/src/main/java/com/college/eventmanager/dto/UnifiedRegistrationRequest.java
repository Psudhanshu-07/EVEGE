package com.college.eventmanager.dto;

/** Unified event registration for COLLEGE / EXTERNAL participants. */
public class UnifiedRegistrationRequest {

    private String participantType; // COLLEGE | EXTERNAL
    private Long eventId;

    private String fullName;
    private String studentEmail;
    private String mobile;

    // College student fields
    private String rollNumber;
    private String branch;
    private String division;
    private String academicYear;

    // External student fields
    private String collegeName;

    private String transactionRef;
    private String paymentStatus;

    public String getParticipantType() { return participantType; }
    public void setParticipantType(String participantType) {
        this.participantType = participantType == null ? "COLLEGE" : participantType.toUpperCase();
    }
    public Long getEventId() { return eventId; }
    public void setEventId(Long eventId) { this.eventId = eventId; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getStudentEmail() { return studentEmail; }
    public void setStudentEmail(String studentEmail) { this.studentEmail = studentEmail; }
    public String getMobile() { return mobile; }
    public void setMobile(String mobile) { this.mobile = mobile; }
    public String getRollNumber() { return rollNumber; }
    public void setRollNumber(String rollNumber) { this.rollNumber = rollNumber; }
    public String getBranch() { return branch; }
    public void setBranch(String branch) { this.branch = branch; }
    public String getDivision() { return division; }
    public void setDivision(String division) { this.division = division; }
    public String getAcademicYear() { return academicYear; }
    public void setAcademicYear(String academicYear) { this.academicYear = academicYear; }
    public String getCollegeName() { return collegeName; }
    public void setCollegeName(String collegeName) { this.collegeName = collegeName; }
    public String getTransactionRef() { return transactionRef; }
    public void setTransactionRef(String transactionRef) { this.transactionRef = transactionRef; }
    public String getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }
}
