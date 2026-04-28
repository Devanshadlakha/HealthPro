package com.healthpro.doctorappointment.controller;

import com.healthpro.doctorappointment.service.PatientAuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/patient-auth")
public class PatientAuthController {

    private final PatientAuthService patientAuthService;

    public PatientAuthController(PatientAuthService patientAuthService) {
        this.patientAuthService = patientAuthService;
    }

    @PostMapping("/signup")
    public ResponseEntity<Map<String, Object>> signup(@RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(patientAuthService.signup(body));
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(patientAuthService.login(body));
    }

    @PostMapping("/verify-email-token")
    public ResponseEntity<Map<String, Object>> verifyEmailToken(@RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(patientAuthService.verifyEmailToken(body));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, Object>> resetPassword(@RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(patientAuthService.forgotPassword(body));
    }

    @PostMapping("/verify-forgot-password-token")
    public ResponseEntity<Map<String, Object>> verifyForgotPasswordToken(@RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(patientAuthService.verifyForgotPasswordToken(body));
    }
}
