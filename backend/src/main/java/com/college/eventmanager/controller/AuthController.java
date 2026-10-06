package com.college.eventmanager.controller;

import com.college.eventmanager.dto.AuthRequest;
import com.college.eventmanager.dto.AuthResponse;
import com.college.eventmanager.dto.RegisterRequest;
import com.college.eventmanager.model.User;
import com.college.eventmanager.repository.UserRepository;
import com.college.eventmanager.security.JwtUtils;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthController(AuthenticationManager authenticationManager,
                          JwtUtils jwtUtils,
                          UserRepository userRepository,
                          PasswordEncoder passwordEncoder) {
        this.authenticationManager = authenticationManager;
        this.jwtUtils = jwtUtils;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /** POST /api/auth/login - authenticates Admin or Student and returns JWT with role. */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest authRequest) {
        String identifier = authRequest.getEmail() != null && !authRequest.getEmail().isBlank()
                ? authRequest.getEmail().trim()
                : authRequest.getUsername().trim();

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(identifier, authRequest.getPassword()));

            String token = jwtUtils.generateToken(authentication.getName());
            Optional<User> userOpt = userRepository.findByEmail(identifier);

            String role = userOpt.map(User::getRole).orElse("STUDENT");
            String fullName = userOpt.map(User::getFullName).orElse(identifier);
            String email = userOpt.map(User::getEmail).orElse(identifier);

            return ResponseEntity.ok(new AuthResponse(
                    token,
                    authentication.getName(),
                    role,
                    fullName,
                    email,
                    "Login successful"
            ));
        } catch (AuthenticationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new AuthResponse(null, null, null, null, null, "Invalid email or password"));
        }
    }

    /**
     * POST /api/auth/register - registers student account in PostgreSQL.
     * Validates that student emails end with @email.com.
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email is required."));
        }

        String email = request.getEmail().trim().toLowerCase();

        // Enforce requirement: student email must end with @email.com
        if (!email.endsWith("@email.com")) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", "Email address must end with @email.com (e.g. student@email.com)"
            ));
        }

        if (userRepository.existsByEmail(email)) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", "An account with email " + email + " already exists."
            ));
        }

        if (request.getPassword() == null || request.getPassword().length() < 4) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", "Password must be at least 4 characters."
            ));
        }

        User user = new User();
        user.setFullName(request.getFullName() != null && !request.getFullName().isBlank()
                ? request.getFullName().trim() : "Student");
        user.setEmail(email);
        user.setPhone(request.getPhone());
        user.setCollege(request.getCollege() != null ? request.getCollege() : "College of Engineering");
        user.setBranch(request.getBranch() != null ? request.getBranch() : "Computer Science");
        user.setRollNumber(request.getRollNumber() != null ? request.getRollNumber() : "");
        user.setYearSemester(request.getYearSemester() != null ? request.getYearSemester() : "1st Year");
        user.setGender(request.getGender() != null ? request.getGender() : "Other");
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole("STUDENT");

        User saved = userRepository.save(user);

        String token = jwtUtils.generateToken(saved.getEmail());

        return ResponseEntity.status(HttpStatus.CREATED).body(new AuthResponse(
                token,
                saved.getEmail(),
                saved.getRole(),
                saved.getFullName(),
                saved.getEmail(),
                "Account created successfully"
        ));
    }

    /** GET /api/auth/me - gets profile of currently authenticated user. */
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Not authenticated"));
        }
        String token = authHeader.substring(7);
        String email = jwtUtils.validateAndGetUsername(token);
        if (email == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Invalid or expired token"));
        }
        return userRepository.findByEmail(email)
                .map(u -> {
                    u.setPassword(null); // never expose hashed password
                    return ResponseEntity.ok((Object) u);
                })
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "User not found")));
    }

    /** GET /api/auth/users - list all registered users (for admin & database manager). */
    @GetMapping("/users")
    public List<User> getAllUsers() {
        List<User> list = userRepository.findAll();
        list.forEach(u -> u.setPassword(null));
        return list;
    }
}
