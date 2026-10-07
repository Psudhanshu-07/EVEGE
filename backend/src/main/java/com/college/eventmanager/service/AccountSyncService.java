package com.college.eventmanager.service;

import com.college.eventmanager.model.Student;
import com.college.eventmanager.model.StudentAccount;
import com.college.eventmanager.repository.StudentAccountRepository;
import com.college.eventmanager.repository.StudentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.Timestamp;
import java.time.LocalDateTime;

@Service
public class AccountSyncService {

    private static final Logger log = LoggerFactory.getLogger(AccountSyncService.class);

    private final StudentAccountRepository studentAccountRepository;
    private final StudentRepository studentRepository;
    private final JdbcTemplate jdbcTemplate;

    @Value("${spring.datasource.username:postgres}")
    private String dbUser;

    @Value("${spring.datasource.password:PandeyS}")
    private String dbPass;

    public AccountSyncService(StudentAccountRepository studentAccountRepository,
                              StudentRepository studentRepository,
                              JdbcTemplate jdbcTemplate) {
        this.studentAccountRepository = studentAccountRepository;
        this.studentRepository = studentRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * Synchronizes a newly created or updated account across all student tables:
     * 1. student_accounts (primary new table)
     * 2. students
     * 3. user_accounts
     * And syncs across databases (evege_db, postgres, evening) so that wherever
     * the administrator or user looks in pgAdmin, the data is immediately visible.
     */
    public void syncAccount(String fullName, String email, String phone, String college,
                            String branch, String rollNumber, String yearSemester,
                            String gender, String password, String role) {
        if (email == null || email.isBlank()) {
            return;
        }

        String cleanEmail = email.trim().toLowerCase();
        String safeName = fullName != null && !fullName.isBlank() ? fullName.trim() : "Student";
        String safeRole = role != null && !role.isBlank() ? role.trim() : "STUDENT";

        // 1. Save to StudentAccount entity (maps to table 'student_accounts' in evege_db)
        try {
            StudentAccount account = studentAccountRepository.findByEmail(cleanEmail)
                    .orElseGet(StudentAccount::new);
            account.setFullName(safeName);
            account.setEmail(cleanEmail);
            account.setPhone(phone);
            account.setCollege(college);
            account.setBranch(branch);
            account.setRollNumber(rollNumber);
            account.setYearSemester(yearSemester);
            account.setGender(gender);
            account.setPassword(password != null ? password : "");
            account.setRole(safeRole);
            studentAccountRepository.save(account);
            log.info("Saved to student_accounts table in evege_db: {}", cleanEmail);
        } catch (Exception e) {
            log.warn("Error saving to student_accounts entity: {}", e.getMessage());
        }

        // 2. Save to Student entity (maps to table 'students' in evege_db)
        try {
            Student student = studentRepository.findByEmail(cleanEmail)
                    .orElseGet(Student::new);
            student.setFullName(safeName);
            student.setEmail(cleanEmail);
            student.setPhone(phone);
            student.setCollege(college);
            student.setBranch(branch);
            student.setRollNumber(rollNumber);
            student.setYearSemester(yearSemester);
            student.setGender(gender);
            student.setPassword(password != null ? password : "");
            studentRepository.save(student);
            log.info("Saved to students table in evege_db: {}", cleanEmail);
        } catch (Exception e) {
            log.warn("Error saving to students entity: {}", e.getMessage());
        }

        // 3. Upsert into user_accounts in current datasource (evege_db)
        try {
            String upsertUserAccounts = """
                INSERT INTO user_accounts (full_name, email, phone, college, branch, roll_number, year_semester, gender, password, role, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT (email) DO UPDATE SET
                    full_name = EXCLUDED.full_name,
                    phone = EXCLUDED.phone,
                    college = EXCLUDED.college,
                    branch = EXCLUDED.branch,
                    roll_number = EXCLUDED.roll_number,
                    year_semester = EXCLUDED.year_semester,
                    gender = EXCLUDED.gender,
                    password = EXCLUDED.password,
                    role = EXCLUDED.role;
            """;
            jdbcTemplate.update(upsertUserAccounts, safeName, cleanEmail, phone, college, branch,
                    rollNumber, yearSemester, gender, password, safeRole, Timestamp.valueOf(LocalDateTime.now()));
        } catch (Exception e) {
            log.warn("Error updating user_accounts in evege_db: {}", e.getMessage());
        }

        // 4. Cross-database synchronization for local development (postgres & evening DBs in pgAdmin)
        syncToDatabase("postgres", safeName, cleanEmail, phone, college, branch, rollNumber, yearSemester, gender, password, safeRole);
        syncToDatabase("evening", safeName, cleanEmail, phone, college, branch, rollNumber, yearSemester, gender, password, safeRole);
    }

    private void syncToDatabase(String dbName, String fullName, String email, String phone,
                                String college, String branch, String rollNumber,
                                String yearSemester, String gender, String password, String role) {
        String url = "jdbc:postgresql://localhost:5432/" + dbName;
        try (Connection conn = DriverManager.getConnection(url, dbUser, dbPass)) {
            String[] targetTables = {"student_accounts", "user_accounts", "students"};
            for (String table : targetTables) {
                String sql = "INSERT INTO " + table + " (full_name, email, phone, college, branch, roll_number, year_semester, gender, password, role, created_at) "
                        + "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) "
                        + "ON CONFLICT (email) DO UPDATE SET "
                        + "full_name = EXCLUDED.full_name, "
                        + "phone = EXCLUDED.phone, "
                        + "college = EXCLUDED.college, "
                        + "branch = EXCLUDED.branch, "
                        + "roll_number = EXCLUDED.roll_number, "
                        + "year_semester = EXCLUDED.year_semester, "
                        + "gender = EXCLUDED.gender, "
                        + "password = EXCLUDED.password, "
                        + "role = EXCLUDED.role;";
                try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                    stmt.setString(1, fullName);
                    stmt.setString(2, email);
                    stmt.setString(3, phone);
                    stmt.setString(4, college);
                    stmt.setString(5, branch);
                    stmt.setString(6, rollNumber);
                    stmt.setString(7, yearSemester);
                    stmt.setString(8, gender);
                    stmt.setString(9, password);
                    stmt.setString(10, role);
                    stmt.setTimestamp(11, Timestamp.valueOf(LocalDateTime.now()));
                    stmt.executeUpdate();
                }
            }
            log.info("Successfully synced account for {} to database '{}'", email, dbName);
        } catch (Exception e) {
            // Ignore if secondary DB is not accessible (e.g. cloud deployment)
            log.debug("Secondary DB {} sync skipped: {}", dbName, e.getMessage());
        }
    }
}

