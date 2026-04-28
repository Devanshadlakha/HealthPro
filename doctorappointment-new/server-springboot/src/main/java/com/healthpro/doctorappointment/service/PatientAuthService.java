package com.healthpro.doctorappointment.service;

import com.healthpro.doctorappointment.model.Patient;
import com.healthpro.doctorappointment.repository.PatientRepository;
import com.healthpro.doctorappointment.security.JwtUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.HexFormat;
import java.util.Map;
import java.util.regex.Pattern;

@Service
public class PatientAuthService {

    private static final Pattern EMAIL_RE = Pattern.compile("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");
    private static final Pattern MOBILE_RE = Pattern.compile("^\\d{10}$");

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

    public Map<String, Object> signup(Map<String, Object> body) {
        String name = (String) body.get("name");
        String email = (String) body.get("email");
        String password = (String) body.get("password");
        String mobile = (String) body.get("mobile");
        String dob = (String) body.get("dob");
        String gender = (String) body.get("gender");
        Integer age = body.get("age") != null ? Integer.parseInt(body.get("age").toString()) : null;

        if (name == null || email == null || password == null || mobile == null
                || dob == null || gender == null || age == null) {
            return Map.of("success", false, "message", "All fields are required");
        }

        if (!EMAIL_RE.matcher(email.trim()).matches()) {
            return Map.of("success", false, "message", "Invalid email format");
        }
        if (!MOBILE_RE.matcher(mobile.trim()).matches()) {
            return Map.of("success", false, "message", "Mobile number must be 10 digits");
        }
        if (password.length() < 6) {
            return Map.of("success", false, "message", "Password must be at least 6 characters");
        }
        if (age < 0 || age > 120) {
            return Map.of("success", false, "message", "Age must be between 0 and 120");
        }

        if (patientRepository.findByEmail(email).isPresent()) {
            return Map.of("success", false, "message", "Email already exists");
        }

        Patient patient = new Patient();
        patient.setName(name);
        patient.setEmail(email);
        patient.setPassword(passwordEncoder.encode(password));
        patient.setMobile(mobile);
        patient.setDob(dob);
        patient.setGender(gender);
        patient.setAge(age);
        patient.setVerified(true);
        patient.setVerifyToken(generateVerificationToken());

        patientRepository.save(patient);

        return Map.of("success", true, "message", "Signup successful. Please verify your email.");
    }

    public Map<String, Object> login(Map<String, Object> body) {
        String email = (String) body.get("email");
        String password = (String) body.get("password");

        if (email == null || password == null) {
            return Map.of("success", false, "message", "Email and password are required");
        }

        var patientOpt = patientRepository.findByEmail(email);
        if (patientOpt.isEmpty()) {
            return Map.of("success", false, "message", "Invalid credentials");
        }

        Patient patient = patientOpt.get();

        if (!passwordEncoder.matches(password, patient.getPassword())) {
            return Map.of("success", false, "message", "Invalid credentials");
        }

        if (patient.getVerified() == null || !patient.getVerified()) {
            return Map.of("success", false, "message", "Please verify your email first");
        }

        String token = jwtUtil.createToken(patient.getId(), "patient");
        return Map.of("success", true, "message", "Login successful",
                "token", token, "data", Map.of("token", token), "name", patient.getName());
    }

    public Map<String, Object> verifyEmailToken(Map<String, Object> body) {
        String token = (String) body.get("token");
        if (token == null) {
            return Map.of("success", false, "message", "Token is required");
        }

        var patientOpt = patientRepository.findByVerifyToken(token);
        if (patientOpt.isEmpty()) {
            return Map.of("success", false, "message", "Invalid token");
        }

        Patient patient = patientOpt.get();
        patient.setVerified(true);
        patientRepository.save(patient);

        return Map.of("success", true, "message", "Email verified successfully");
    }

    public Map<String, Object> forgotPassword(Map<String, Object> body) {
        String email = (String) body.get("email");
        if (email == null) {
            return Map.of("success", false, "message", "Email is required");
        }

        var patientOpt = patientRepository.findByEmail(email);
        if (patientOpt.isEmpty()) {
            return Map.of("success", false, "message", "Email not found");
        }

        Patient patient = patientOpt.get();
        try {
            emailService.sendPasswordResetEmail(email, patient.getVerifyToken(), frontendUrl);
        } catch (Exception e) {
            return Map.of("success", false, "message", "Failed to send reset email");
        }

        return Map.of("success", true, "message", "Password reset email sent");
    }

    public Map<String, Object> verifyForgotPasswordToken(Map<String, Object> body) {
        String token = (String) body.get("token");
        String newPassword = (String) body.get("password");

        if (token == null || newPassword == null) {
            return Map.of("success", false, "message", "Token and password are required");
        }

        var patientOpt = patientRepository.findByVerifyToken(token);
        if (patientOpt.isEmpty()) {
            return Map.of("success", false, "message", "Invalid token");
        }

        Patient patient = patientOpt.get();
        patient.setPassword(passwordEncoder.encode(newPassword));
        patient.setVerified(true);
        patientRepository.save(patient);

        return Map.of("success", true, "message", "Password reset successful");
    }

    private String generateVerificationToken() {
        byte[] bytes = new byte[32];
        new SecureRandom().nextBytes(bytes);
        return HexFormat.of().formatHex(bytes);
    }
}
