package com.healthpro.doctorappointment.repository;

import com.healthpro.doctorappointment.model.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends MongoRepository<Review, String> {
    Page<Review> findByDoctorId(String doctorId, Pageable pageable);
    List<Review> findByDoctorId(String doctorId);
    List<Review> findByDoctorIdIn(java.util.Collection<String> doctorIds);
    Optional<Review> findByAppointmentId(String appointmentId);
    long countByDoctorId(String doctorId);
}
