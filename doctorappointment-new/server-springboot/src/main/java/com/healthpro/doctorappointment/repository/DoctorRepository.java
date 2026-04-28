package com.healthpro.doctorappointment.repository;

import com.healthpro.doctorappointment.model.Doctor;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface DoctorRepository extends MongoRepository<Doctor, String> {
    Optional<Doctor> findByEmail(String email);
    Optional<Doctor> findByVerifyToken(String verifyToken);
    List<Doctor> findByHospitalId(String hospitalId);
    List<Doctor> findByHospitalIdAndNameContainingIgnoreCase(String hospitalId, String name);
    List<Doctor> findByHospitalIdAndSpecializationContainingIgnoreCase(String hospitalId, String specialization);
    List<Doctor> findByHospitalIdAndNameContainingIgnoreCaseAndSpecializationContainingIgnoreCase(
            String hospitalId, String name, String specialization);
}
