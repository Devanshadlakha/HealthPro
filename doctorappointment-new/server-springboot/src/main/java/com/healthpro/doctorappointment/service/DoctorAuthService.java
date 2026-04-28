package com.healthpro.doctorappointment.service;

import com.healthpro.doctorappointment.model.Doctor;
import com.healthpro.doctorappointment.repository.DoctorRepository;
import com.healthpro.doctorappointment.security.JwtUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.HexFormat;
import java.util.Map;
import java.util.regex.Pattern;

@Service
public class DoctorAuthService {

    private static final Pattern EMAIL_RE = Pattern.compile("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");
    private static final Pattern MOBILE_RE = Pattern.compile("^\\d{10}$");

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

    @SuppressWarnings("unchecked")
    private Map<String, Object> unwrap(Map<String, Object> body) {
        if (body.containsKey("formData") && body.get("formData") instanceof Map) {
            return (Map<String, Object>) body.get("formData");
        }
        return body;
    }

    public Map<String, Object> signup(Map<String, Object> body) {
        body = unwrap(body);
        String name = (String) body.get("name");
        String email = (String) body.get("email");
        String password = (String) body.get("password");
        String mobile = (String) body.get("mobile");
        String specialization = (String) body.get("specialization");
        String gender = (String) body.get("gender");
        String hospitalId = (String) body.get("hospitalId");
        Integer experience = body.get("experience") != null ? Integer.parseInt(body.get("experience").toString()) : null;
        Integer fees = body.get("fees") != null && !body.get("fees").toString().isEmpty()
                ? Integer.parseInt(body.get("fees").toString()) : null;

        if (name == null || email == null || password == null || mobile == null
                || specialization == null || gender == null || experience == null
                || hospitalId == null || hospitalId.isEmpty() || fees == null) {
            return Map.of("success", false, "message", "All fields are required (including hospital and consultation fees)");
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
        if (experience < 0 || experience > 80) {
            return Map.of("success", false, "message", "Experience must be between 0 and 80 years");
        }
        if (fees <= 0 || fees > 100000) {
            return Map.of("success", false, "message", "Consultation fees must be between 1 and 100000");
        }

        if (doctorRepository.findByEmail(email).isPresent()) {
            return Map.of("success", false, "message", "Email already exists");
        }

        Doctor doctor = new Doctor();
        doctor.setName(name);
        doctor.setEmail(email);
        doctor.setPassword(passwordEncoder.encode(password));
        doctor.setMobile(mobile);
        doctor.setSpecialization(specialization);
        doctor.setGender(gender);
        doctor.setExperience(experience);
        doctor.setVerified(true);
        doctor.setVerifyToken(generateVerificationToken());
        doctor.setHospitalId(hospitalId);
        doctor.setFees(fees);

        doctorRepository.save(doctor);

        return Map.of("success", true, "message", "Signup successful. Please verify your email.");
    }

    public Map<String, Object> login(Map<String, Object> body) {
        body = unwrap(body);
        String email = (String) body.get("email");
        String password = (String) body.get("password");

        if (email == null || password == null) {
            return Map.of("success", false, "message", "Email and password are required");
        }

        var doctorOpt = doctorRepository.findByEmail(email);
        if (doctorOpt.isEmpty()) {
            return Map.of("success", false, "message", "Invalid credentials");
        }

        Doctor doctor = doctorOpt.get();

        if (!passwordEncoder.matches(password, doctor.getPassword())) {
            return Map.of("success", false, "message", "Invalid credentials");
        }

        if (doctor.getVerified() == null || !doctor.getVerified()) {
            return Map.of("success", false, "message", "Please verify your email first");
        }

        String token = jwtUtil.createToken(doctor.getId(), "doctor");
        return Map.of("success", true, "message", "Login successful",
                "token", token, "data", Map.of("token", token), "name", doctor.getName());
    }

    public Map<String, Object> verifyEmailToken(Map<String, Object> body) {
        String token = (String) body.get("token");
        if (token == null) {
            return Map.of("success", false, "message", "Token is required");
        }

        var doctorOpt = doctorRepository.findByVerifyToken(token);
        if (doctorOpt.isEmpty()) {
            return Map.of("success", false, "message", "Invalid token");
        }

        Doctor doctor = doctorOpt.get();
        doctor.setVerified(true);
        doctorRepository.save(doctor);

        return Map.of("success", true, "message", "Email verified successfully");
    }

    public Map<String, Object> forgotPassword(Map<String, Object> body) {
        String email = (String) body.get("email");
        if (email == null) {
            return Map.of("success", false, "message", "Email is required");
        }

        var doctorOpt = doctorRepository.findByEmail(email);
        if (doctorOpt.isEmpty()) {
            return Map.of("success", false, "message", "Email not found");
        }

        Doctor doctor = doctorOpt.get();
        try {
            emailService.sendPasswordResetEmail(email, doctor.getVerifyToken(), frontendUrl);
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

        var doctorOpt = doctorRepository.findByVerifyToken(token);
        if (doctorOpt.isEmpty()) {
            return Map.of("success", false, "message", "Invalid token");
        }

        Doctor doctor = doctorOpt.get();
        doctor.setPassword(passwordEncoder.encode(newPassword));
        doctor.setVerified(true);
        doctorRepository.save(doctor);

        return Map.of("success", true, "message", "Password reset successful");
    }

    private String generateVerificationToken() {
        byte[] bytes = new byte[32];
        new SecureRandom().nextBytes(bytes);
        return HexFormat.of().formatHex(bytes);
    }
}
