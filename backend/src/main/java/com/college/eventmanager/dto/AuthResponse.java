package com.college.eventmanager.dto;

public class AuthResponse {

    private String token;
    private String username;
    private String role;
    private String fullName;
    private String email;
    private String message;

    public AuthResponse() {}

    public AuthResponse(String token, String username, String message) {
        this.token = token;
        this.username = username;
        this.message = message;
    }

    public AuthResponse(String token, String username, String role, String fullName, String email, String message) {
        this.token = token;
        this.username = username;
        this.role = role;
        this.fullName = fullName;
        this.email = email;
        this.message = message;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
