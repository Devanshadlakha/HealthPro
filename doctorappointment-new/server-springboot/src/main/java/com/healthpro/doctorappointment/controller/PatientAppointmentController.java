package com.healthpro.doctorappointment.controller;

import com.healthpro.doctorappointment.service.PatientAppointmentService;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/patient-appointment")
public class PatientAppointmentController {

    private static final Logger log = LoggerFactory.getLogger(PatientAppointmentController.class);

    private final PatientAppointmentService service;

    public PatientAppointmentController(PatientAppointmentService service) {
        this.service = service;
    }

    @PostMapping("/create-appointment")
    public ResponseEntity<?> createAppointment(@RequestBody Map<String, Object> body, HttpServletRequest request) {
        try {
            String userId = (String) request.getAttribute("userId");
            return ResponseEntity.ok(service.createAppointment(userId, body));
        } catch (Exception e) {
            return ResponseEntity.status(500).body("error while creating appointment");
        }
    }

    @GetMapping("/get-patient-appointments")
    public ResponseEntity<?> getPatientAppointments(HttpServletRequest request) {
        try {
            String userId = (String) request.getAttribute("userId");
            return ResponseEntity.ok(service.getPatientAppointments(userId));
        } catch (Exception e) {
            log.error("getPatientAppointments failed", e);
            return ResponseEntity.status(500).body(Map.of("err", "Server error"));
        }
    }

    @PostMapping("/accept-your-doctor")
    public ResponseEntity<?> acceptDoctor(@RequestBody Map<String, Object> body) {
        try {
            String doctorId = (String) body.get("doctorId");
            String appointmentId = (String) body.get("appointmentId");
            return ResponseEntity.ok(service.acceptDoctor(doctorId, appointmentId));
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error in accepting doctor");
        }
    }

    @PostMapping("/review-doctor")
    public ResponseEntity<?> reviewDoctor(@RequestBody Map<String, Object> body, HttpServletRequest request) {
        String userId = (String) request.getAttribute("userId");
        return ResponseEntity.ok(service.reviewDoctor(userId, body));
    }

    @GetMapping("/past-appointments")
    public ResponseEntity<?> pastAppointments(HttpServletRequest request) {
        try {
            String userId = (String) request.getAttribute("userId");
            return ResponseEntity.ok(service.getPastAppointments(userId));
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error");
        }
    }

    @GetMapping("/user-profile")
    public ResponseEntity<?> getUserProfile(HttpServletRequest request) {
        try {
            String userId = (String) request.getAttribute("userId");
            return ResponseEntity.ok(service.getUserProfile(userId));
        } catch (Exception e) {
            log.error("getUserProfile failed", e);
            return ResponseEntity.status(500).body(Map.of("err", "Server error"));
        }
    }
}
