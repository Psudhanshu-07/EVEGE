package com.college.eventmanager.repository;

import com.college.eventmanager.model.EventScore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EventScoreRepository extends JpaRepository<EventScore, Long> {
    Optional<EventScore> findByEventIdAndParticipantEmail(Long eventId, String participantEmail);
    List<EventScore> findByEventId(Long eventId);
    List<EventScore> findByEventCategory(String eventCategory);
    List<EventScore> findByParticipantEmailAndEventCategory(String participantEmail, String eventCategory);
}
