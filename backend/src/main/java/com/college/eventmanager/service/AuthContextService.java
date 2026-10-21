package com.college.eventmanager.service;

import com.college.eventmanager.model.User;
import com.college.eventmanager.repository.UserRepository;
import com.college.eventmanager.security.JwtUtils;
import org.springframework.stereotype.Service;

@Service
public class AuthContextService {

    private final JwtUtils jwtUtils;
    private final UserRepository userRepository;

    public AuthContextService(JwtUtils jwtUtils, UserRepository userRepository) {
        this.jwtUtils = jwtUtils;
        this.userRepository = userRepository;
    }

    public record Actor(String email, String role, String fullName) {}

    /** Resolve the signed-in user from the Bearer token. Never trusts client body fields. */
    public Actor resolve(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) return null;
        String email = jwtUtils.validateAndGetUsername(authHeader.substring(7));
        if (email == null) return null;
        User user = userRepository.findByEmail(email.toLowerCase()).orElse(null);
        if (user == null) return new Actor(email.toLowerCase(), "STUDENT", email);
        return new Actor(user.getEmail(), user.getRole() == null ? "STUDENT" : user.getRole(), user.getFullName());
    }

    public boolean isAdmin(Actor actor) {
        return actor != null && "ADMIN".equalsIgnoreCase(actor.role());
    }
}
