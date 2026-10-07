package com.college.eventmanager.controller;

import com.college.eventmanager.dto.AuthRequest;
import com.college.eventmanager.dto.AuthResponse;
import com.college.eventmanager.dto.RegisterRequest;
import com.college.eventmanager.model.User;
import com.college.eventmanager.model.Student;
import com.college.eventmanager.model.StudentAccount;
import com.college.eventmanager.repository.StudentRepository;
import com.college.eventmanager.repository.StudentAccountRepository;
import com.college.eventmanager.repository.UserRepository;
import com.college.eventmanager.repository.RegistrationRepository;
import com.college.eventmanager.security.JwtUtils;
import com.college.eventmanager.service.AccountSyncService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.HashMap;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;
    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final StudentAccountRepository studentAccountRepository;
    private final RegistrationRepository registrationRepository;
    private final AccountSyncService accountSyncService;
    private final JdbcTemplate jdbcTemplate;
    private final PasswordEncoder passwordEncoder;

    public AuthController(AuthenticationManager authenticationManager,
                          JwtUtils jwtUtils,
                          UserRepository userRepository,
                          StudentRepository studentRepository,
                          StudentAccountRepository studentAccountRepository,
                          RegistrationRepository registrationRepository,
                          AccountSyncService accountSyncService,
                          JdbcTemplate jdbcTemplate,
                          PasswordEncoder passwordEncoder) {
        this.authenticationManager = authenticationManager;
        this.jwtUtils = jwtUtils;
        this.userRepository = userRepository;
        this.studentRepository = studentRepository;
        this.studentAccountRepository = studentAccountRepository;
        this.registrationRepository = registrationRepository;
        this.accountSyncService = accountSyncService;
        this.jdbcTemplate = jdbcTemplate;
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
                String namePart = cleanIdentifier.split("@")[0];
                String derivedName = Character.toUpperCase(namePart.charAt(0)) + (namePart.length() > 1 ? namePart.substring(1) : "");

                User userEntity = new User();
                userEntity.setFullName(derivedName);
                userEntity.setEmail(cleanIdentifier);
                userEntity.setPassword(passwordEncoder.encode(authRequest.getPassword()));
                userEntity.setRole("STUDENT");
                userEntity.setCollege("College of Engineering");
                userEntity.setBranch("Computer Science");
                userEntity.setRollNumber("");
                userEntity.setYearSemester("1st Year");
                userEntity.setGender("Other");
                userRepository.save(userEntity);

                Student studentEntity = new Student();
                studentEntity.setFullName(derivedName);
                studentEntity.setEmail(cleanIdentifier);
                studentEntity.setPassword(passwordEncoder.encode(authRequest.getPassword()));
                studentEntity.setCollege("College of Engineering");
                studentEntity.setBranch("Computer Science");
                studentEntity.setRollNumber("");
                studentEntity.setYearSemester("1st Year");
                studentEntity.setGender("Other");
                Student saved = studentRepository.save(studentEntity);

                // Synchronize to student_accounts table and all databases
                accountSyncService.syncAccount(derivedName, cleanIdentifier, "", "College of Engineering",
                        "Computer Science", "", "1st Year", "Other", authRequest.getPassword(), "STUDENT");

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

        String safeName = request.getFullName() != null && !request.getFullName().isBlank()
                ? request.getFullName().trim() : "Student";

        User userEntity = new User();
        userEntity.setFullName(safeName);
        userEntity.setEmail(email);
        userEntity.setPhone(request.getPhone());
        userEntity.setCollege(request.getCollege() != null ? request.getCollege() : "College of Engineering");
        userEntity.setBranch(request.getBranch() != null ? request.getBranch() : "Computer Science");
        userEntity.setRollNumber(request.getRollNumber() != null ? request.getRollNumber() : "");
        userEntity.setYearSemester(request.getYearSemester() != null ? request.getYearSemester() : "1st Year");
        userEntity.setGender(request.getGender() != null ? request.getGender() : "Other");
        userEntity.setPassword(passwordEncoder.encode(request.getPassword()));
        userEntity.setRole("STUDENT");
        userRepository.save(userEntity);

        Student student = new Student();
        student.setFullName(safeName);
        student.setEmail(email);
        student.setPhone(request.getPhone());
        student.setCollege(request.getCollege() != null ? request.getCollege() : "College of Engineering");
        student.setBranch(request.getBranch() != null ? request.getBranch() : "Computer Science");
        student.setRollNumber(request.getRollNumber() != null ? request.getRollNumber() : "");
        student.setYearSemester(request.getYearSemester() != null ? request.getYearSemester() : "1st Year");
        student.setGender(request.getGender() != null ? request.getGender() : "Other");
        student.setPassword(passwordEncoder.encode(request.getPassword()));
        Student saved = studentRepository.save(student);

        // Synchronize to student_accounts table and all databases
        accountSyncService.syncAccount(
                safeName,
                email,
                request.getPhone(),
                request.getCollege() != null ? request.getCollege() : "College of Engineering",
                request.getBranch() != null ? request.getBranch() : "Computer Science",
                request.getRollNumber() != null ? request.getRollNumber() : "",
                request.getYearSemester() != null ? request.getYearSemester() : "1st Year",
                request.getGender() != null ? request.getGender() : "Other",
                request.getPassword(),
                "STUDENT"
        );

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

    /** GET /api/auth/students - list all registered student accounts from students table. */
    @GetMapping("/students")
    public List<Student> getAllStudents() {
        return studentRepository.findAll();
    }

    /** GET /api/auth/student-accounts - list all registered student accounts from new student_accounts table. */
    @GetMapping("/student-accounts")
    public List<StudentAccount> getAllStudentAccounts() {
        return studentAccountRepository.findAll();
    }

    /**
     * GET /api/auth/debug-email?email=...
     * Inspects every table in PostgreSQL to find exactly where this email exists.
     */
    @GetMapping("/debug-email")
    public ResponseEntity<?> debugEmail(@RequestParam("email") String email) {
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email query param required"));
        }
        String cleanEmail = email.trim().toLowerCase();
        Map<String, Object> result = new HashMap<>();
        result.put("queryEmail", cleanEmail);

        Optional<User> inUsers = userRepository.findByEmail(cleanEmail);
        result.put("foundIn_users", inUsers.map(u -> Map.of("id", u.getId(), "name", u.getFullName(), "role", u.getRole())).orElse(null));

        Optional<Student> inStudents = studentRepository.findByEmail(cleanEmail);
        result.put("foundIn_students", inStudents.map(s -> Map.of("id", s.getId(), "name", s.getFullName(), "college", s.getCollege())).orElse(null));

        Optional<StudentAccount> inAccounts = studentAccountRepository.findByEmail(cleanEmail);
        result.put("foundIn_student_accounts", inAccounts.map(a -> Map.of("id", a.getId(), "name", a.getFullName(), "password", a.getPassword())).orElse(null));

        long regCount = registrationRepository.findAll().stream()
                .filter(r -> cleanEmail.equalsIgnoreCase(r.getStudentEmail()))
                .count();
        result.put("foundIn_registrations_count", regCount);

        boolean overallExists = inUsers.isPresent() || inStudents.isPresent() || inAccounts.isPresent() || regCount > 0;
        result.put("existsOverall", overallExists);

        return ResponseEntity.ok(result);
    }

    /**
     * DELETE /api/auth/delete-user?email=...
     * Allows deleting a test or stuck user account from all tables so they can register fresh.
     */
    @DeleteMapping("/delete-user")
    public ResponseEntity<?> deleteUser(@RequestParam("email") String email) {
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email query param required"));
        }
        String cleanEmail = email.trim().toLowerCase();
        if ("demoadmin@gmail.com".equalsIgnoreCase(cleanEmail)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Cannot delete primary demo admin account"));
        }

        userRepository.findByEmail(cleanEmail).ifPresent(userRepository::delete);
        studentRepository.findByEmail(cleanEmail).ifPresent(studentRepository::delete);
        studentAccountRepository.findByEmail(cleanEmail).ifPresent(studentAccountRepository::delete);

        try {
            jdbcTemplate.update("DELETE FROM user_accounts WHERE email = ?", cleanEmail);
        } catch (Exception ignored) {}

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Account for " + cleanEmail + " was completely removed from all PostgreSQL tables."
        ));
    }

    /**
     * POST /api/auth/reset-students
     * Clears all student test accounts while preserving demoadmin@gmail.com.
     */
    @PostMapping("/reset-students")
    public ResponseEntity<?> resetStudents() {
        try {
            jdbcTemplate.update("DELETE FROM registrations");
            jdbcTemplate.update("DELETE FROM student_accounts WHERE email != 'demoadmin@gmail.com'");
            jdbcTemplate.update("DELETE FROM user_accounts WHERE email != 'demoadmin@gmail.com'");
            jdbcTemplate.update("DELETE FROM students WHERE email != 'demoadmin@gmail.com'");
            jdbcTemplate.update("DELETE FROM users WHERE email != 'demoadmin@gmail.com'");
            return ResponseEntity.ok(Map.of("success", true, "message", "All student test data cleared. Admin account preserved."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}
