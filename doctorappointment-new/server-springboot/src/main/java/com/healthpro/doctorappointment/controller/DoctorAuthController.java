package com.healthpro.doctorappointment.controller;

import com.healthpro.doctorappointment.service.DoctorAuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/doctor-auth")
public class DoctorAuthController {

    private final DoctorAuthService doctorAuthService;

    public DoctorAuthController(DoctorAuthService doctorAuthService) {
        this.doctorAuthService = doctorAuthService;
    }

    @PostMapping("/signup")
    public ResponseEntity<Map<String, Object>> signup(@RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(doctorAuthService.signup(body));
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(doctorAuthService.login(body));
    }

    @PostMapping("/verify-email-token")
    public ResponseEntity<Map<String, Object>> verifyEmailToken(@RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(doctorAuthService.verifyEmailToken(body));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, Object>> resetPassword(@RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(doctorAuthService.forgotPassword(body));
    }

    @PostMapping("/verify-forgot-password-token")
    public ResponseEntity<Map<String, Object>> verifyForgotPasswordToken(@RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(doctorAuthService.verifyForgotPasswordToken(body));
    }
}
