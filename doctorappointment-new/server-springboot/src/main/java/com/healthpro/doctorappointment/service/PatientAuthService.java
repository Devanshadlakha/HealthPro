package com.healthpro.doctorappointment.service;

import com.healthpro.doctorappointment.dto.ForgotPasswordRequest;
import com.healthpro.doctorappointment.dto.LoginRequest;
import com.healthpro.doctorappointment.dto.PatientSignupRequest;
import com.healthpro.doctorappointment.dto.ResetPasswordRequest;
import com.healthpro.doctorappointment.dto.VerifyTokenRequest;
import com.healthpro.doctorappointment.exception.ApiException;
import com.healthpro.doctorappointment.model.Patient;
import com.healthpro.doctorappointment.model.PatientProfile;
import com.healthpro.doctorappointment.repository.PatientRepository;
import com.healthpro.doctorappointment.security.JwtUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class PatientAuthService {

    private static final Logger log = LoggerFactory.getLogger(PatientAuthService.class);
    private static final long RESET_TOKEN_TTL_MINUTES = 30;
    private static final String RESET_GENERIC_REPLY = "If that email is registered, a reset link has been sent.";

    private final PatientRepository patientRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    public PatientAuthService(PatientRepository patientRepository, PasswordEncoder passwordEncoder,
                              JwtUtil jwtUtil, EmailService emailService) {
        this.patientRepository = patientRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.emailService = emailService;
    }

    public Map<String, Object> signup(PatientSignupRequest req) {
        if (patientRepository.findByEmail(req.getEmail()).isPresent()) {
            throw ApiException.conflict("Email already exists");
        }

        Patient patient = new Patient();
        patient.setName(req.getName());
        patient.setEmail(req.getEmail());
        patient.setPassword(passwordEncoder.encode(req.getPassword()));
        patient.setMobile(req.getMobile());
        patient.setDob(req.getDob());
        patient.setGender(req.getGender());
        patient.setAge(req.getAge());
        patient.setVerified(true);
        patient.setVerifyToken(generateToken());

        // Bootstrap the "self" profile from signup data so this account can book immediately.
        PatientProfile self = new PatientProfile();
        self.setId(UUID.randomUUID().toString());
        self.setName(req.getName());
        self.setDob(req.getDob());
        self.setAge(req.getAge());
        self.setGender(req.getGender());
        self.setRelation("self");
        patient.setProfiles(new ArrayList<>(List.of(self)));

        patientRepository.save(patient);

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("success", true);
        resp.put("message", "Signup successful. You can now log in.");
        return resp;
    }

    public Map<String, Object> login(LoginRequest req) {
        Optional<Patient> patientOpt = patientRepository.findByEmail(req.getEmail());
        if (patientOpt.isEmpty()) {
            throw ApiException.unauthorized("Invalid credentials");
        }
        Patient patient = patientOpt.get();
        if (!passwordEncoder.matches(req.getPassword(), patient.getPassword())) {
            throw ApiException.unauthorized("Invalid credentials");
        }
        if (patient.getVerified() == null || !patient.getVerified()) {
            throw ApiException.unauthorized("Please verify your email first");
        }

        String token = jwtUtil.createToken(patient.getId(), "patient");
        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("success", true);
        resp.put("message", "Login successful");
        resp.put("token", token);
        resp.put("data", Map.of("token", token));
        resp.put("name", patient.getName());
        return resp;
    }

    public Map<String, Object> verifyEmailToken(VerifyTokenRequest req) {
        Patient patient = patientRepository.findByVerifyToken(req.getToken())
                .orElseThrow(() -> ApiException.badRequest("Invalid token"));
        patient.setVerified(true);
        patientRepository.save(patient);
        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("success", true);
        resp.put("message", "Email verified successfully");
        return resp;
    }

    public Map<String, Object> forgotPassword(ForgotPasswordRequest req) {
        // Same response whether or not the email exists, to prevent account enumeration.
        patientRepository.findByEmail(req.getEmail()).ifPresent(patient -> {
            patient.setPasswordResetToken(generateToken());
            patient.setPasswordResetExpiresAt(Instant.now().plus(RESET_TOKEN_TTL_MINUTES, ChronoUnit.MINUTES));
            patientRepository.save(patient);
            try {
                emailService.sendPasswordResetEmail(patient.getEmail(), patient.getPasswordResetToken(), frontendUrl, "patient");
            } catch (Exception e) {
                log.error("Failed to send password reset email to {}", patient.getEmail(), e);
            }
        });
        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("success", true);
        resp.put("message", RESET_GENERIC_REPLY);
        return resp;
    }

    public Map<String, Object> verifyForgotPasswordToken(ResetPasswordRequest req) {
        Patient patient = patientRepository.findByPasswordResetToken(req.getToken())
                .orElseThrow(() -> ApiException.badRequest("Invalid or expired token"));

        Instant expiry = patient.getPasswordResetExpiresAt();
        if (expiry == null || Instant.now().isAfter(expiry)) {
            patient.setPasswordResetToken(null);
            patient.setPasswordResetExpiresAt(null);
            patientRepository.save(patient);
            throw ApiException.badRequest("Invalid or expired token");
        }

        patient.setPassword(passwordEncoder.encode(req.getPassword()));
        // Invalidate the token so it cannot be reused.
        patient.setPasswordResetToken(null);
        patient.setPasswordResetExpiresAt(null);
        patient.setVerified(true);
        patientRepository.save(patient);

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("success", true);
        resp.put("message", "Password reset successful");
        return resp;
    }

    private String generateToken() {
        byte[] bytes = new byte[32];
        new SecureRandom().nextBytes(bytes);
        return HexFormat.of().formatHex(bytes);
    }
}
