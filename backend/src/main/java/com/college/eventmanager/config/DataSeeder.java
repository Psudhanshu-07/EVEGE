package com.college.eventmanager.config;

import com.college.eventmanager.model.Event;
import com.college.eventmanager.model.User;
import com.college.eventmanager.model.Student;
import com.college.eventmanager.repository.EventRepository;
import com.college.eventmanager.repository.RegistrationRepository;
import com.college.eventmanager.repository.StudentRepository;
import com.college.eventmanager.repository.StudentAccountRepository;
import com.college.eventmanager.repository.UserRepository;
import com.college.eventmanager.service.AccountSyncService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final StudentAccountRepository studentAccountRepository;
    private final RegistrationRepository registrationRepository;
    private final EventRepository eventRepository;
    private final AccountSyncService accountSyncService;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(UserRepository userRepository,
                      StudentRepository studentRepository,
                      StudentAccountRepository studentAccountRepository,
                      RegistrationRepository registrationRepository,
                      EventRepository eventRepository,
                      AccountSyncService accountSyncService,
                      PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.studentRepository = studentRepository;
        this.studentAccountRepository = studentAccountRepository;
        this.registrationRepository = registrationRepository;
        this.eventRepository = eventRepository;
        this.accountSyncService = accountSyncService;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        seedUsers();
        syncAllExistingAccounts();
        seedEvents();
    }

    private void seedUsers() {
        removeLegacyDemoAccounts();

        // Primary Admin account per user requirements: demoadmin@gmail.com / 123321
        if (userRepository.findByEmail("demoadmin@gmail.com").isEmpty()) {
            User admin = new User(
                    "Administrator",
                    "demoadmin@gmail.com",
                    "+91 9876543210",
                    "EVEGE College Central",
                    "Administration",
                    "ADM001",
                    "Staff",
                    "Other",
                    passwordEncoder.encode("123321"),
                    "ADMIN"
            );
            userRepository.save(admin);
        }

        // Also ensure admin is synchronized to student_accounts table for visibility
        if (studentAccountRepository.findByEmail("demoadmin@gmail.com").isEmpty()) {
            accountSyncService.syncAccount(
                    "Administrator",
                    "demoadmin@gmail.com",
                    "+91 9876543210",
                    "EVEGE College Central",
                    "Administration",
                    "ADM001",
                    "Staff",
                    "Other",
                    "123321",
                    "ADMIN"
            );
        }
    }

    private void syncAllExistingAccounts() {
        // 1. Synchronize from students table into student_accounts & users
        studentRepository.findAll().forEach(s -> {
            accountSyncService.syncAccount(
                    s.getFullName(), s.getEmail(), s.getPhone(), s.getCollege(),
                    s.getBranch(), s.getRollNumber(), s.getYearSemester(), s.getGender(),
                    s.getPassword(), "STUDENT"
            );
            if (userRepository.findByEmail(s.getEmail()).isEmpty()) {
                User u = new User();
                u.setFullName(s.getFullName());
                u.setEmail(s.getEmail());
                u.setPhone(s.getPhone());
                u.setCollege(s.getCollege());
                u.setBranch(s.getBranch());
                u.setRollNumber(s.getRollNumber());
                u.setYearSemester(s.getYearSemester());
                u.setGender(s.getGender());
                u.setPassword(s.getPassword());
                u.setRole("STUDENT");
                userRepository.save(u);
            }
        });

        // 2. Synchronize from users table into student_accounts & students
        userRepository.findAll().forEach(u -> {
            accountSyncService.syncAccount(
                    u.getFullName(), u.getEmail(), u.getPhone(), u.getCollege(),
                    u.getBranch(), u.getRollNumber(), u.getYearSemester(), u.getGender(),
                    u.getPassword(), u.getRole()
            );
            if (studentRepository.findByEmail(u.getEmail()).isEmpty() && !"ADMIN".equalsIgnoreCase(u.getRole())) {
                Student s = new Student();
                s.setFullName(u.getFullName());
                s.setEmail(u.getEmail());
                s.setPhone(u.getPhone());
                s.setCollege(u.getCollege());
                s.setBranch(u.getBranch());
                s.setRollNumber(u.getRollNumber());
                s.setYearSemester(u.getYearSemester());
                s.setGender(u.getGender());
                s.setPassword(u.getPassword());
                studentRepository.save(s);
            }
        });

        // 3. Synchronize from registrations table into student_accounts, users, students
        registrationRepository.findAll().forEach(r -> {
            if (r.getStudentEmail() != null && !r.getStudentEmail().isBlank()) {
                String email = r.getStudentEmail().trim().toLowerCase();
                String name = r.getStudentName() != null && !r.getStudentName().isBlank() ? r.getStudentName().trim() : "Student";
                accountSyncService.syncAccount(
                        name, email, "", "College Student", "Engineering",
                        r.getCollegeId(), "1st Year", "Other", "123321", "STUDENT"
                );
                if (userRepository.findByEmail(email).isEmpty()) {
                    User u = new User();
                    u.setFullName(name);
                    u.setEmail(email);
                    u.setRollNumber(r.getCollegeId());
                    u.setPassword(passwordEncoder.encode("123321"));
                    u.setRole("STUDENT");
                    u.setCollege("College Student");
                    userRepository.save(u);
                }
                if (studentRepository.findByEmail(email).isEmpty()) {
                    Student s = new Student();
                    s.setFullName(name);
                    s.setEmail(email);
                    s.setRollNumber(r.getCollegeId());
                    s.setPassword(passwordEncoder.encode("123321"));
                    s.setCollege("College Student");
                    studentRepository.save(s);
                }
            }
        });
    }

    private void removeLegacyDemoAccounts() {
        // These legacy mock accounts are removed
        userRepository.findByEmail("admin").ifPresent(userRepository::delete);
        studentRepository.findByEmail("student@gmail.com").ifPresent(studentRepository::delete);
        studentAccountRepository.findByEmail("student@gmail.com").ifPresent(studentAccountRepository::delete);
    }

    private void seedEvents() {
        if (eventRepository.count() > 0) {
            return;
        }

        // --- Technical / Techfest Events (with [Srujanam] tag) ---
        eventRepository.save(new Event(
                "Tech Fest 2026 [Srujanam]",
                "Techfest",
                "30 August 2026",
                "9:00 AM - 5:00 PM",
                "College Auditorium",
                "Join exciting coding competitions, workshops, and technical showcases.",
                "Build • Learn • Grow",
                "tech",
                100.00,
                "evege@okaxis"
        ));

        eventRepository.save(new Event(
                "HackNova - 24hr Hackathon [Srujanam]",
                "Techfest",
                "15 September 2026",
                "10:00 AM - 10:00 AM (Next Day)",
                "Innovation Lab",
                "Build groundbreaking software and AI prototypes in 24 hours with mentors and prizes.",
                "Innovate • Code • Deploy",
                "tech",
                100.00,
                "evege@okaxis"
        ));

        eventRepository.save(new Event(
                "RoboWars & Drone Grand Prix [Srujanam]",
                "Techfest",
                "22 September 2026",
                "11:00 AM - 4:00 PM",
                "Central Workshop",
                "High-voltage combat robotics battles and autonomous drone racing championship.",
                "Engineered For Speed",
                "tech",
                100.00,
                "evege@okaxis"
        ));

        // --- Sports Events (with [Naad] tag for unit test) ---
        eventRepository.save(new Event(
                "Sports: Inter-College Cricket Cup [Naad]",
                "Sports",
                "05 October 2026",
                "8:00 AM - 6:00 PM",
                "Main Sports Stadium",
                "16 campus teams clash for the coveted annual championship trophy.",
                "Passion • Spirit • Victory",
                "sports",
                100.00,
                "evege@okaxis"
        ));

        eventRepository.save(new Event(
                "Sports: Annual Athletics Meet [Naad]",
                "Sports",
                "08 October 2026",
                "7:00 AM - 1:00 PM",
                "Track & Field Complex",
                "Olympic standard 100m sprint, 4x100m relays, high jump, javelin, and shot put.",
                "Run Fast • Aim High",
                "sports",
                100.00,
                "evege@okaxis"
        ));

        eventRepository.save(new Event(
                "Sports: Volleyball Smash League [Naad]",
                "Sports",
                "12 October 2026",
                "3:00 PM - 8:00 PM",
                "Indoor Sports Arena",
                "Fast-paced tournament with university-wide inter-branch teams.",
                "Spike • Block • Win",
                "sports",
                100.00,
                "evege@okaxis"
        ));

        // --- Cultural Events (with [Naad] tag for unit test) ---
        eventRepository.save(new Event(
                "Cultural: Cultural Night 2026 [Naad]",
                "Cultural",
                "18 October 2026",
                "6:00 PM - 10:30 PM",
                "Open Air Theatre",
                "An unforgettable evening of live bands, music, dance spectacles, and stage drama.",
                "Rhythm • Harmony • Joy",
                "cultural",
                100.00,
                "evege@okaxis"
        ));

        eventRepository.save(new Event(
                "Cultural: Classical Dance & Drama Fest [Naad]",
                "Cultural",
                "20 October 2026",
                "5:00 PM - 9:00 PM",
                "College Auditorium",
                "Celebrating heritage theatrical performances and classical dance traditions.",
                "Art In Motion",
                "cultural",
                100.00,
                "evege@okaxis"
        ));

        eventRepository.save(new Event(
                "Cultural: Battle of the Bands [Naad]",
                "Cultural",
                "25 October 2026",
                "6:30 PM - 11:00 PM",
                "Campus Amphitheater",
                "Live rock, acoustic, and fusion music competitions.",
                "Loud • Live • Legendary",
                "cultural",
                100.00,
                "evege@okaxis"
        ));
    }
}
