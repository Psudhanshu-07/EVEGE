package com.college.eventmanager.config;

import com.college.eventmanager.model.Event;
import com.college.eventmanager.model.User;
import com.college.eventmanager.repository.EventRepository;
import com.college.eventmanager.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final EventRepository eventRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(UserRepository userRepository,
                      EventRepository eventRepository,
                      PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.eventRepository = eventRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        seedUsers();
        seedEvents();
    }

    private void seedUsers() {
        // 1. Primary Admin account per user requirements: demoadmin@gmail.com / 123321
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

        // 2. Fallback admin for existing unit tests: admin / admin123
        if (userRepository.findByEmail("admin").isEmpty()) {
            User testAdmin = new User(
                    "System Admin",
                    "admin",
                    "+91 9876500000",
                    "EVEGE Tech",
                    "Admin",
                    "SYS001",
                    "Staff",
                    "Other",
                    passwordEncoder.encode("admin123"),
                    "ADMIN"
            );
            userRepository.save(testAdmin);
        }

        // 3. Demo student account: student@email.com / 123321
        if (userRepository.findByEmail("student@email.com").isEmpty()) {
            User student = new User(
                    "Sudanshu Pandey",
                    "student@email.com",
                    "+91 9876543211",
                    "College of Engineering & Technology",
                    "Computer Science & Engineering",
                    "23CSE1042",
                    "3rd Year / Semester 5",
                    "Male",
                    passwordEncoder.encode("123321"),
                    "STUDENT"
            );
            userRepository.save(student);
        }
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
