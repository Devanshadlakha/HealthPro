package com.healthpro.doctorappointment.service;

import com.healthpro.doctorappointment.dto.PageResponse;
import com.healthpro.doctorappointment.model.Doctor;
import com.healthpro.doctorappointment.model.Hospital;
import com.healthpro.doctorappointment.repository.DoctorRepository;
import com.healthpro.doctorappointment.repository.HospitalRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class HospitalService {

    private final HospitalRepository hospitalRepository;
    private final DoctorRepository doctorRepository;
    private final ReviewService reviewService;

    public HospitalService(HospitalRepository hospitalRepository, DoctorRepository doctorRepository,
                           ReviewService reviewService) {
        this.hospitalRepository = hospitalRepository;
        this.doctorRepository = doctorRepository;
        this.reviewService = reviewService;
    }

    public PageResponse<Hospital> getHospitals(String city, String search, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("name").ascending());
        Page<Hospital> result;
        if (city != null && !city.isEmpty() && search != null && !search.isEmpty()) {
            result = hospitalRepository.findByCityAndNameContainingIgnoreCaseAndActiveTrue(city, search, pageable);
        } else if (city != null && !city.isEmpty()) {
            result = hospitalRepository.findByCityAndActiveTrue(city, pageable);
        } else if (search != null && !search.isEmpty()) {
            result = hospitalRepository.findByNameContainingIgnoreCaseAndActiveTrue(search, pageable);
        } else {
            result = hospitalRepository.findByActiveTrue(pageable);
        }
        return PageResponse.from(result, h -> h);
    }

    public Optional<Hospital> getHospitalById(String id) {
        return hospitalRepository.findById(id);
    }

    public PageResponse<Map<String, Object>> getDoctorsByHospital(String hospitalId, String search,
                                                                  String specialization, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("name").ascending());
        Page<Doctor> result;
        if (search != null && !search.isEmpty() && specialization != null && !specialization.isEmpty()) {
            result = doctorRepository.findByHospitalIdAndNameContainingIgnoreCaseAndSpecializationContainingIgnoreCase(
                    hospitalId, search, specialization, pageable);
        } else if (search != null && !search.isEmpty()) {
            result = doctorRepository.findByHospitalIdAndNameContainingIgnoreCase(hospitalId, search, pageable);
        } else if (specialization != null && !specialization.isEmpty()) {
            result = doctorRepository.findByHospitalIdAndSpecializationContainingIgnoreCase(hospitalId, specialization, pageable);
        } else {
            result = doctorRepository.findByHospitalId(hospitalId, pageable);
        }

        // Single batch lookup for all doctor aggregates on this page (was N+1).
        List<String> doctorIds = result.getContent().stream().map(Doctor::getId).toList();
        Map<String, ReviewService.AggregateRating> aggregates = reviewService.aggregatesForDoctors(doctorIds);
        return PageResponse.from(result, doctor -> doctorToPublicMap(doctor, aggregates.get(doctor.getId())));
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

    private Map<String, Object> doctorToPublicMap(Doctor doctor, ReviewService.AggregateRating preloadedAggregate) {
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

        ReviewService.AggregateRating agg = preloadedAggregate != null
                ? preloadedAggregate
                : reviewService.aggregateForDoctor(doctor.getId());
        map.put("averageRating", agg.average());
        map.put("totalReviews", agg.total());
        return map;
    }
}
