package com.college.eventmanager.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "student_accounts")
public class StudentAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(name = "email", nullable = false, unique = true)
    private String email;

    private String phone;
    private String college;
    private String branch;

    @Column(name = "roll_number")
    private String rollNumber;

    @Column(name = "year_semester")
    private String yearSemester;

    private String gender;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String role = "STUDENT";

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public StudentAccount() {}

    public StudentAccount(String fullName, String email, String phone, String college,
                          String branch, String rollNumber, String yearSemester,
                          String gender, String password, String role) {
        this.fullName = fullName;
        this.email = email;
        this.phone = phone;
        this.college = college;
        this.branch = branch;
        this.rollNumber = rollNumber;
        this.yearSemester = yearSemester;
        this.gender = gender;
        this.password = password;
        this.role = role != null ? role : "STUDENT";
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getCollege() { return college; }
    public void setCollege(String college) { this.college = college; }

    public String getBranch() { return branch; }
    public void setBranch(String branch) { this.branch = branch; }

    public String getRollNumber() { return rollNumber; }
    public void setRollNumber(String rollNumber) { this.rollNumber = rollNumber; }

    public String getYearSemester() { return yearSemester; }
    public void setYearSemester(String yearSemester) { this.yearSemester = yearSemester; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}

