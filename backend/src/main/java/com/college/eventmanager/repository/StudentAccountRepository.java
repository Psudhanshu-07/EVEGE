package com.college.eventmanager.repository;

import com.college.eventmanager.model.StudentAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StudentAccountRepository extends JpaRepository<StudentAccount, Long> {
    Optional<StudentAccount> findByEmail(String email);
    boolean existsByEmail(String email);
}

