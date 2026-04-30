package com.healthpro.doctorappointment.repository;

import com.healthpro.doctorappointment.model.Patient;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface PatientRepository extends MongoRepository<Patient, String> {
    Optional<Patient> findByEmail(String email);
    Optional<Patient> findByVerifyToken(String verifyToken);
    Optional<Patient> findByPasswordResetToken(String passwordResetToken);
    List<Patient> findByNameContainingIgnoreCase(String name);
}
