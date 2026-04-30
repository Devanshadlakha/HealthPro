package com.healthpro.doctorappointment.controller;

import com.healthpro.doctorappointment.dto.PageResponse;
import com.healthpro.doctorappointment.model.Hospital;
import com.healthpro.doctorappointment.service.HospitalService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/hospitals")
public class HospitalController {

    private static final int MAX_PAGE_SIZE = 50;

    private final HospitalService hospitalService;

    public HospitalController(HospitalService hospitalService) {
        this.hospitalService = hospitalService;
    }

    @GetMapping
    public ResponseEntity<PageResponse<Hospital>> getHospitals(
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        return ResponseEntity.ok(hospitalService.getHospitals(city, search, clampPage(page), clampSize(size)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getHospital(@PathVariable String id) {
        return hospitalService.getHospitalById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/doctors")
    public ResponseEntity<PageResponse<Map<String, Object>>> getDoctorsByHospital(
            @PathVariable String id,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String specialization,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        return ResponseEntity.ok(hospitalService.getDoctorsByHospital(id, search, specialization,
                clampPage(page), clampSize(size)));
    }

    @GetMapping("/cities")
    public ResponseEntity<List<String>> getCities() {
        return ResponseEntity.ok(hospitalService.getDistinctCities());
    }

    private int clampPage(int page) {
        return Math.max(page, 0);
    }

    private int clampSize(int size) {
        if (size <= 0) return 12;
        return Math.min(size, MAX_PAGE_SIZE);
    }
}
