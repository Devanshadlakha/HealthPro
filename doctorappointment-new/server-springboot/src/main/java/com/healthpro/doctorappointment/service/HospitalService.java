package com.healthpro.doctorappointment.service;

import com.healthpro.doctorappointment.model.Doctor;
import com.healthpro.doctorappointment.model.Hospital;
import com.healthpro.doctorappointment.repository.DoctorRepository;
import com.healthpro.doctorappointment.repository.HospitalRepository;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class HospitalService {

    private final HospitalRepository hospitalRepository;
    private final DoctorRepository doctorRepository;

    public HospitalService(HospitalRepository hospitalRepository, DoctorRepository doctorRepository) {
        this.hospitalRepository = hospitalRepository;
        this.doctorRepository = doctorRepository;
    }

    public List<Hospital> getHospitals(String city, String search) {
        if (city != null && !city.isEmpty() && search != null && !search.isEmpty()) {
            return hospitalRepository.findByCityAndNameContainingIgnoreCaseAndActiveTrue(city, search);
        } else if (city != null && !city.isEmpty()) {
            return hospitalRepository.findByCityAndActiveTrue(city);
        } else if (search != null && !search.isEmpty()) {
            return hospitalRepository.findByNameContainingIgnoreCaseAndActiveTrue(search);
        }
        return hospitalRepository.findByActiveTrue();
    }

    public Optional<Hospital> getHospitalById(String id) {
        return hospitalRepository.findById(id);
    }

    public List<Map<String, Object>> getDoctorsByHospital(String hospitalId, String search, String specialization) {
        List<Doctor> doctors;
        if (search != null && !search.isEmpty() && specialization != null && !specialization.isEmpty()) {
            doctors = doctorRepository.findByHospitalIdAndNameContainingIgnoreCaseAndSpecializationContainingIgnoreCase(
                    hospitalId, search, specialization);
        } else if (search != null && !search.isEmpty()) {
            doctors = doctorRepository.findByHospitalIdAndNameContainingIgnoreCase(hospitalId, search);
        } else if (specialization != null && !specialization.isEmpty()) {
            doctors = doctorRepository.findByHospitalIdAndSpecializationContainingIgnoreCase(hospitalId, specialization);
        } else {
            doctors = doctorRepository.findByHospitalId(hospitalId);
        }

        return doctors.stream().map(this::doctorToPublicMap).collect(Collectors.toList());
    }

    public List<String> getDistinctCities() {
        List<Hospital> hospitals = hospitalRepository.findByActiveTrue();
        return hospitals.stream()
                .map(Hospital::getCity)
                .filter(Objects::nonNull)
                .distinct()
                .sorted()
                .collect(Collectors.toList());
    }

    private Map<String, Object> doctorToPublicMap(Doctor doctor) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", doctor.getId());
        map.put("name", doctor.getName());
        map.put("specialization", doctor.getSpecialization());
        map.put("designation", doctor.getDesignation());
        map.put("experience", doctor.getExperience());
        map.put("fees", doctor.getFees());
        map.put("photoUrl", doctor.getPhotoUrl());
        map.put("qualification", doctor.getQualification());
        map.put("gender", doctor.getGender());
        map.put("about", doctor.getAbout());
        map.put("hospitalId", doctor.getHospitalId());

        // Average rating
        if (doctor.getRating() != null && !doctor.getRating().isEmpty()) {
            double avg = doctor.getRating().stream().mapToInt(r -> r.getRate()).average().orElse(0);
            map.put("averageRating", Math.round(avg * 10.0) / 10.0);
            map.put("totalReviews", doctor.getRating().size());
        } else {
            map.put("averageRating", 0);
            map.put("totalReviews", 0);
        }
        return map;
    }
}
