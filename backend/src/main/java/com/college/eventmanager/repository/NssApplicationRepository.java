package com.college.eventmanager.repository;

import com.college.eventmanager.model.NssApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface NssApplicationRepository extends JpaRepository<NssApplication, Long> {
    Optional<NssApplication> findByStudentEmailAndStatus(String studentEmail, String status);
}
