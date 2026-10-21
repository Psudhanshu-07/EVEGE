package com.college.eventmanager.repository;

import com.college.eventmanager.model.NssTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NssTaskRepository extends JpaRepository<NssTask, Long> {
}
