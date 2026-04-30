package com.healthpro.doctorappointment.service;

import com.healthpro.doctorappointment.dto.DoctorSignupRequest;
import com.healthpro.doctorappointment.dto.ForgotPasswordRequest;
import com.healthpro.doctorappointment.dto.LoginRequest;
import com.healthpro.doctorappointment.dto.ResetPasswordRequest;
import com.healthpro.doctorappointment.dto.VerifyTokenRequest;
import com.healthpro.doctorappointment.exception.ApiException;
import com.healthpro.doctorappointment.model.Doctor;
import com.healthpro.doctorappointment.repository.DoctorRepository;
import com.healthpro.doctorappointment.security.JwtUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class DoctorAuthService {

    private static final Logger log = LoggerFactory.getLogger(DoctorAuthService.class);
    private static final long RESET_TOKEN_TTL_MINUTES = 30;
    private static final String RESET_GENERIC_REPLY = "If that email is registered, a reset link has been sent.";

    private final DoctorRepository doctorRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    public DoctorAuthService(DoctorRepository doctorRepository, PasswordEncoder passwordEncoder,
                             JwtUtil jwtUtil, EmailService emailService) {
        this.doctorRepository = doctorRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.emailService = emailService;
    }

    public Map<String, Object> signup(DoctorSignupRequest req) {
        if (doctorRepository.findByEmail(req.getEmail()).isPresent()) {
            throw ApiException.conflict("Email already exists");
        }

        Doctor doctor = new Doctor();
        doctor.setName(req.getName());
        doctor.setEmail(req.getEmail());
        doctor.setPassword(passwordEncoder.encode(req.getPassword()));
        doctor.setMobile(req.getMobile());
        doctor.setSpecialization(req.getSpecialization());
        doctor.setGender(req.getGender());
        doctor.setExperience(req.getExperience());
        doctor.setHospitalId(req.getHospitalId());
        doctor.setFees(req.getFees());
        doctor.setVerified(true);
        doctor.setVerifyToken(generateToken());
        doctorRepository.save(doctor);

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("success", true);
        resp.put("message", "Signup successful. You can now log in.");
        return resp;
    }

    public Map<String, Object> login(LoginRequest req) {
        Optional<Doctor> doctorOpt = doctorRepository.findByEmail(req.getEmail());
        if (doctorOpt.isEmpty()) {
            throw ApiException.unauthorized("Invalid credentials");
        }
        Doctor doctor = doctorOpt.get();
        if (!passwordEncoder.matches(req.getPassword(), doctor.getPassword())) {
            throw ApiException.unauthorized("Invalid credentials");
        }
        if (doctor.getVerified() == null || !doctor.getVerified()) {
            throw ApiException.unauthorized("Please verify your email first");
        }

        String token = jwtUtil.createToken(doctor.getId(), "doctor");
        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("success", true);
        resp.put("message", "Login successful");
        resp.put("token", token);
        resp.put("data", Map.of("token", token));
        resp.put("name", doctor.getName());
        return resp;
    }

    public Map<String, Object> verifyEmailToken(VerifyTokenRequest req) {
        Doctor doctor = doctorRepository.findByVerifyToken(req.getToken())
                .orElseThrow(() -> ApiException.badRequest("Invalid token"));
        doctor.setVerified(true);
        doctorRepository.save(doctor);
        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("success", true);
        resp.put("message", "Email verified successfully");
        return resp;
    }

    public Map<String, Object> forgotPassword(ForgotPasswordRequest req) {
        doctorRepository.findByEmail(req.getEmail()).ifPresent(doctor -> {
            doctor.setPasswordResetToken(generateToken());
            doctor.setPasswordResetExpiresAt(Instant.now().plus(RESET_TOKEN_TTL_MINUTES, ChronoUnit.MINUTES));
            doctorRepository.save(doctor);
            try {
                emailService.sendPasswordResetEmail(doctor.getEmail(), doctor.getPasswordResetToken(), frontendUrl, "doctor");
            } catch (Exception e) {
                log.error("Failed to send password reset email to {}", doctor.getEmail(), e);
            }
        });
        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("success", true);
        resp.put("message", RESET_GENERIC_REPLY);
        return resp;
    }

    public Map<String, Object> verifyForgotPasswordToken(ResetPasswordRequest req) {
        Doctor doctor = doctorRepository.findByPasswordResetToken(req.getToken())
                .orElseThrow(() -> ApiException.badRequest("Invalid or expired token"));

        Instant expiry = doctor.getPasswordResetExpiresAt();
        if (expiry == null || Instant.now().isAfter(expiry)) {
            doctor.setPasswordResetToken(null);
            doctor.setPasswordResetExpiresAt(null);
            doctorRepository.save(doctor);
            throw ApiException.badRequest("Invalid or expired token");
        }

        doctor.setPassword(passwordEncoder.encode(req.getPassword()));
        doctor.setPasswordResetToken(null);
        doctor.setPasswordResetExpiresAt(null);
        doctor.setVerified(true);
        doctorRepository.save(doctor);

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
