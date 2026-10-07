package com.college.eventmanager.controller;

import com.college.eventmanager.dto.AuthRequest;
import com.college.eventmanager.dto.AuthResponse;
import com.college.eventmanager.dto.RegisterRequest;
import com.college.eventmanager.model.User;
import com.college.eventmanager.model.Student;
import com.college.eventmanager.repository.StudentRepository;
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
    private final StudentRepository studentRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthController(AuthenticationManager authenticationManager,
                          JwtUtils jwtUtils,
                          UserRepository userRepository,
                          StudentRepository studentRepository,
                          PasswordEncoder passwordEncoder) {
        this.authenticationManager = authenticationManager;
        this.jwtUtils = jwtUtils;
        this.userRepository = userRepository;
        this.studentRepository = studentRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /** POST /api/auth/login - authenticates Admin or Student and returns JWT with role. */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest authRequest) {
        String identifier = authRequest.getEmail() != null && !authRequest.getEmail().isBlank()
                ? authRequest.getEmail().trim()
                : (authRequest.getUsername() != null ? authRequest.getUsername().trim() : "");

        if (identifier.isBlank()) {
            return ResponseEntity.badRequest().body(new AuthResponse(null, null, null, null, null, "Email is required."));
        }

        String cleanIdentifier = identifier.toLowerCase();

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(cleanIdentifier, authRequest.getPassword()));

            String token = jwtUtils.generateToken(authentication.getName());
            Optional<User> userOpt = userRepository.findByEmail(cleanIdentifier);
            Optional<Student> studentOpt = studentRepository.findByEmail(cleanIdentifier);

            String role = userOpt.map(User::getRole).orElse("STUDENT");
            String fullName = userOpt.map(User::getFullName)
                    .orElse(studentOpt.map(Student::getFullName).orElse(cleanIdentifier));
            String email = userOpt.map(User::getEmail)
                    .orElse(studentOpt.map(Student::getEmail).orElse(cleanIdentifier));

            return ResponseEntity.ok(new AuthResponse(
                    token,
                    authentication.getName(),
                    role,
                    fullName,
                    email,
                    "Login successful"
            ));
        } catch (AuthenticationException e) {
            Optional<User> existingUser = userRepository.findByEmail(cleanIdentifier);
            Optional<Student> existingStudent = studentRepository.findByEmail(cleanIdentifier);

            // If student with valid @gmail.com logs in for the first time, auto-create in PostgreSQL!
            if (existingUser.isEmpty() && existingStudent.isEmpty() && cleanIdentifier.endsWith("@gmail.com") && authRequest.getPassword() != null && authRequest.getPassword().length() >= 4) {
                Student newUser = new Student();
                String namePart = cleanIdentifier.split("@")[0];
                String derivedName = Character.toUpperCase(namePart.charAt(0)) + (namePart.length() > 1 ? namePart.substring(1) : "");
                newUser.setFullName(derivedName);
                newUser.setEmail(cleanIdentifier);
                newUser.setPassword(passwordEncoder.encode(authRequest.getPassword()));
                newUser.setCollege("College of Engineering");
                newUser.setBranch("Computer Science");
                newUser.setRollNumber("");
                newUser.setYearSemester("1st Year");
                newUser.setGender("Other");
                Student saved = studentRepository.save(newUser);

                String token = jwtUtils.generateToken(saved.getEmail());
                return ResponseEntity.ok(new AuthResponse(
                        token,
                        saved.getEmail(),
                        "STUDENT",
                        saved.getFullName(),
                        saved.getEmail(),
                        "Account created and logged in successfully"
                ));
            }

            String msg = existingUser.isPresent() || existingStudent.isPresent()
                    ? "Incorrect password. Please try again."
                    : "No account found with this email (" + cleanIdentifier + "). Please register first.";
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new AuthResponse(null, null, null, null, null, msg));
        }
    }

    /**
     * GET /api/auth/check-email?email=...
     * Checks if email is already registered in PostgreSQL.
     */
    @GetMapping("/check-email")
    public ResponseEntity<?> checkEmail(@RequestParam("email") String email) {
        if (email == null || email.isBlank()) {
            return ResponseEntity.ok(Map.of("exists", false));
        }
        String cleanEmail = email.trim().toLowerCase();
        boolean exists = userRepository.existsByEmail(cleanEmail) || studentRepository.existsByEmail(cleanEmail);
        return ResponseEntity.ok(Map.of(
                "exists", exists,
                "email", cleanEmail,
                "message", exists ? "An account with this email already exists. Please log in." : "Email is available."
        ));
    }

    /**
     * POST /api/auth/register - registers student account in PostgreSQL.
     * Validates that student emails end with @gmail.com.
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email is required."));
        }

        String email = request.getEmail().trim().toLowerCase();

        // Enforce requirement: student email must end with @gmail.com
        if (!email.endsWith("@gmail.com")) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", "Email address must end with @gmail.com (e.g. student@gmail.com)"
            ));
        }

        if (userRepository.existsByEmail(email) || studentRepository.existsByEmail(email)) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", "An account with email " + email + " already exists. Please log in instead.",
                    "code", "USER_ALREADY_EXISTS",
                    "email", email
            ));
        }

        if (request.getPassword() == null || request.getPassword().length() < 4) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", "Password must be at least 4 characters."
            ));
        }

        Student user = new Student();
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
        Student saved = studentRepository.save(user);

        String token = jwtUtils.generateToken(saved.getEmail());

        return ResponseEntity.status(HttpStatus.CREATED).body(new AuthResponse(
                token,
                saved.getEmail(),
                "STUDENT",
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
        Optional<User> admin = userRepository.findByEmail(email);
        if (admin.isPresent()) {
            admin.get().setPassword(null);
            return ResponseEntity.ok(admin.get());
        }
        return studentRepository.findByEmail(email)
                .map(student -> ResponseEntity.ok((Object) student))
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "User not found")));
    }

    /** GET /api/auth/users - list all registered users (for admin & database manager). */
    @GetMapping("/users")
    public List<User> getAllUsers() {
        List<User> list = userRepository.findAll();
        list.forEach(u -> u.setPassword(null));
        return list;
    }

    /** GET /api/auth/students - list all registered student accounts. */
    @GetMapping("/students")
    public List<Student> getAllStudents() {
        return studentRepository.findAll();
    }
}
