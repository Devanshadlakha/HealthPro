package com.healthpro.doctorappointment.controller;

import com.healthpro.doctorappointment.model.Doctor;
import com.healthpro.doctorappointment.model.Hospital;
import com.healthpro.doctorappointment.repository.DoctorRepository;
import com.healthpro.doctorappointment.repository.HospitalRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/doctors")
public class DoctorProfileController {

    private final DoctorRepository doctorRepository;
    private final HospitalRepository hospitalRepository;

    public DoctorProfileController(DoctorRepository doctorRepository, HospitalRepository hospitalRepository) {
        this.doctorRepository = doctorRepository;
        this.hospitalRepository = hospitalRepository;
    }

    @GetMapping("/{id}/profile")
    public ResponseEntity<?> getDoctorProfile(@PathVariable String id) {
        return doctorRepository.findById(id)
                .map(doctor -> {
                    Map<String, Object> profile = new LinkedHashMap<>();
                    profile.put("id", doctor.getId());
                    profile.put("name", doctor.getName());
                    profile.put("specialization", doctor.getSpecialization());
                    profile.put("designation", doctor.getDesignation());
                    profile.put("experience", doctor.getExperience());
                    profile.put("fees", doctor.getFees());
                    profile.put("photoUrl", doctor.getPhotoUrl());
                    profile.put("qualification", doctor.getQualification());
                    profile.put("gender", doctor.getGender());
                    profile.put("about", doctor.getAbout());
                    profile.put("mobile", doctor.getMobile());
                    profile.put("hospitalId", doctor.getHospitalId());

                    // Hospital info
                    if (doctor.getHospitalId() != null) {
                        hospitalRepository.findById(doctor.getHospitalId()).ifPresent(hospital -> {
                            profile.put("hospitalName", hospital.getName());
                            profile.put("hospitalCity", hospital.getCity());
                            profile.put("hospitalAddress", hospital.getAddress());
                        });
                    }

                    // Ratings
                    if (doctor.getRating() != null && !doctor.getRating().isEmpty()) {
                        double avg = doctor.getRating().stream().mapToInt(r -> r.getRate()).average().orElse(0);
                        profile.put("averageRating", Math.round(avg * 10.0) / 10.0);
                        profile.put("totalReviews", doctor.getRating().size());
                        profile.put("reviews", doctor.getRating());
                    } else {
                        profile.put("averageRating", 0);
                        profile.put("totalReviews", 0);
                        profile.put("reviews", java.util.Collections.emptyList());
                    }

                    return ResponseEntity.ok(profile);
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
