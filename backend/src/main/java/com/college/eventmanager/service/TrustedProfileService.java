package com.college.eventmanager.service;

import com.college.eventmanager.model.Student;
import com.college.eventmanager.model.User;
import com.college.eventmanager.repository.StudentRepository;
import com.college.eventmanager.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.Optional;

/**
 * Resolves the college student's trusted identity (branch / division / roll number)
 * from internal database records only — never from what a client submits.
 * This is what leaderboards and scheduling rely on, so it must be tamper-proof.
 */
@Service
public class TrustedProfileService {

    private final UserRepository userRepository;
    private final StudentRepository studentRepository;

    public TrustedProfileService(UserRepository userRepository, StudentRepository studentRepository) {
        this.userRepository = userRepository;
        this.studentRepository = studentRepository;
    }

    public record TrustedProfile(String email, String fullName, String branch, String division, String rollNumber) {}

    public Optional<TrustedProfile> resolve(String email) {
        if (email == null) return Optional.empty();
        String clean = email.trim().toLowerCase();

        return userRepository.findByEmail(clean)
                .map(u -> new TrustedProfile(clean, u.getFullName(), normalize(u.getBranch()), deriveDivision(u.getRollNumber(), u.getYearSemester()), u.getRollNumber()))
                .or(() -> studentRepository.findByEmail(clean)
                        .map(s -> new TrustedProfile(clean, s.getFullName(), normalize(s.getBranch(), s.getCollege()), deriveDivision(s.getRollNumber(), s.getYearSemester()), s.getRollNumber())));
    }

    private String normalize(String branch, String college) {
        if (branch != null && !branch.isBlank()) return branch.trim();
        return normalize(college);
    }

    private String normalize(String branch) {
        if (branch == null || branch.isBlank()) return null;
        String b = branch.trim();
        // Canonicalize common acronym map
        String up = b.toUpperCase();
        if (up.contains("COMPUTER") || up.equals("CS") || up.equals("CSE")) return "Computer Science";
        if (up.contains("MECHAN") || up.equals("ME")) return "Mechanical";
        if (up.contains("ELECTRIC") || up.equals("EE") || up.equals("ECE") || up.contains("ELECTRONIC")) return "Electronics";
        if (up.contains("CIVIL") || up.equals("CE")) return "Civil";
        if (up.contains("IT") || up.equals("INFORMATION")) return "Information Technology";
        return b;
    }

    /**
     * Derives division A-E heuristically from stored profile (roll number prefix or year/semester string).
     * The heuristic is deliberately transparent, not magical: clients cannot supply a division,
     * it must already be part of the trusted record.
     */
    private String deriveDivision(String rollNumber, String yearSemester) {
        String candidate = null;
        if (yearSemester != null && yearSemester.toUpperCase().matches(".*\\bDIV(ISION)?\\s*([A-E])\\b.*")) {
            candidate = yearSemester.toUpperCase().replaceAll(".*\\bDIV(ISION)?\\s*([A-E])\\b.*", "$2");
        } else if (rollNumber != null && rollNumber.toUpperCase().matches(".*\\bDIV(ISION)?\\s*([A-E])\\b.*")) {
            candidate = rollNumber.toUpperCase().replaceAll(".*\\bDIV(ISION)?\\s*([A-E])\\b.*", "$2");
        } else if (yearSemester != null && yearSemester.toUpperCase().matches(".*\\b([A-E])\\b.*")) {
            candidate = yearSemester.replaceAll("(?i).*\\b([A-E])\\b.*", "$1");
        } else if (rollNumber != null && rollNumber.toUpperCase().matches(".*[-_\\s/]([A-E])[-_\\s/\\d].*")) {
            candidate = rollNumber.replaceAll("(?i).*[-_\\s/]([A-E])[-_\\s/\\d].*", "$1");
        } else if (rollNumber != null && rollNumber.toUpperCase().matches(".*\\b([A-E])\\d.*")) {
            candidate = rollNumber.replaceAll("(?i).*\\b([A-E])\\d.*", "$1");
        }
        if (candidate != null && candidate.matches("[A-Ea-e]")) return candidate.toUpperCase();
        return null; // division is optional; leaderboard handles null by skipping
    }

    /** Infer participantType from email domain. Defaults to COLLEGE student inside the domain. */
    public String inferParticipantType(String email) {
        if (email == null || email.isBlank()) return "EXTERNAL";
        String clean = email.trim().toLowerCase();
        if (clean.endsWith("@gmail.com")) {
            // A college student is one that has a trusted profile; otherwise assumes external.
            return resolve(clean).map(p -> "COLLEGE").orElse("EXTERNAL");
        }
        return resolve(clean).isPresent() ? "COLLEGE" : "EXTERNAL";
    }
}
