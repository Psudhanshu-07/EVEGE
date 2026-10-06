package com.college.eventmanager.dto;

public class AuthRequest {

    private String username;
    private String email;
    private String password;

    public AuthRequest() {}

    public AuthRequest(String username, String password) {
        this.username = username;
        this.password = password;
    }

    public String getUsername() {
        if (username != null && !username.isBlank()) return username;
        return email;
    }

    public void setUsername(String username) { this.username = username; }

    public String getEmail() {
        if (email != null && !email.isBlank()) return email;
        return username;
    }

    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}
