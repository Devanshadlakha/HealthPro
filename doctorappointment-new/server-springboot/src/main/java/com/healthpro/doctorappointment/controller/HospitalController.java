package com.healthpro.doctorappointment.controller;

import com.healthpro.doctorappointment.model.Hospital;
import com.healthpro.doctorappointment.service.HospitalService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/hospitals")
public class HospitalController {

    private final HospitalService hospitalService;

    public HospitalController(HospitalService hospitalService) {
        this.hospitalService = hospitalService;
    }

    @GetMapping
    public ResponseEntity<List<Hospital>> getHospitals(
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(hospitalService.getHospitals(city, search));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getHospital(@PathVariable String id) {
        return hospitalService.getHospitalById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/doctors")
    public ResponseEntity<List<Map<String, Object>>> getDoctorsByHospital(
            @PathVariable String id,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String specialization) {
        return ResponseEntity.ok(hospitalService.getDoctorsByHospital(id, search, specialization));
    }

    @GetMapping("/cities")
    public ResponseEntity<List<String>> getCities() {
        return ResponseEntity.ok(hospitalService.getDistinctCities());
    }
}
