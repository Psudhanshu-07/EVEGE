package com.college.eventmanager.repository;

import com.college.eventmanager.model.NssTaskRegistration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NssTaskRegistrationRepository extends JpaRepository<NssTaskRegistration, Long> {
    Optional<NssTaskRegistration> findByTaskIdAndVolunteerEmail(Long taskId, String volunteerEmail);
    List<NssTaskRegistration> findByTaskId(Long taskId);
    List<NssTaskRegistration> findByVolunteerEmail(String volunteerEmail);
    long countByTaskId(Long taskId);
}
