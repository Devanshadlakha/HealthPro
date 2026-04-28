package com.healthpro.doctorappointment.repository;

import com.healthpro.doctorappointment.model.TimeSlot;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface TimeSlotRepository extends MongoRepository<TimeSlot, String> {
    List<TimeSlot> findByDoctorIdAndDate(String doctorId, String date);
    List<TimeSlot> findByDoctorIdAndDateAndStatus(String doctorId, String date, String status);
    Optional<TimeSlot> findByDoctorIdAndDateAndStartTime(String doctorId, String date, String startTime);
    List<TimeSlot> findByStatusAndReservedAtBefore(String status, Instant cutoff);
}
