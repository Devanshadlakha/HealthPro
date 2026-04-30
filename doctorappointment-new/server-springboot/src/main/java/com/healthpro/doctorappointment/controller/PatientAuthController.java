package com.healthpro.doctorappointment.controller;

import com.healthpro.doctorappointment.dto.ForgotPasswordRequest;
import com.healthpro.doctorappointment.dto.LoginRequest;
import com.healthpro.doctorappointment.dto.PatientSignupRequest;
import com.healthpro.doctorappointment.dto.ResetPasswordRequest;
import com.healthpro.doctorappointment.dto.VerifyTokenRequest;
import com.healthpro.doctorappointment.exception.ApiException;
import com.healthpro.doctorappointment.security.LoginRateLimiter;
import com.healthpro.doctorappointment.service.PatientAuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/patient-auth")
public class PatientAuthController {

    private final PatientAuthService patientAuthService;
    private final LoginRateLimiter rateLimiter;

    public PatientAuthController(PatientAuthService patientAuthService, LoginRateLimiter rateLimiter) {
        this.patientAuthService = patientAuthService;
        this.rateLimiter = rateLimiter;
    }

    @PostMapping("/signup")
    public ResponseEntity<Map<String, Object>> signup(@Valid @RequestBody PatientSignupRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(patientAuthService.signup(req));
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@Valid @RequestBody LoginRequest req,
                                                     HttpServletRequest httpReq) {
        String key = "patient:" + clientIp(httpReq);
        if (rateLimiter.isBlocked(key)) {
            long retryAfter = rateLimiter.secondsUntilUnblocked(key);
            throw ApiException.tooManyRequests("Too many login attempts. Try again in " + retryAfter + "s");
        }
        try {
            Map<String, Object> resp = patientAuthService.login(req);
            rateLimiter.recordSuccess(key);
            return ResponseEntity.ok(resp);
        } catch (ApiException ex) {
            if (ex.getStatus() == HttpStatus.UNAUTHORIZED) {
                rateLimiter.recordFailure(key);
            }
            throw ex;
        }
    }

    @PostMapping("/verify-email-token")
    public ResponseEntity<Map<String, Object>> verifyEmailToken(@Valid @RequestBody VerifyTokenRequest req) {
        return ResponseEntity.ok(patientAuthService.verifyEmailToken(req));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, Object>> resetPassword(@Valid @RequestBody ForgotPasswordRequest req) {
        return ResponseEntity.ok(patientAuthService.forgotPassword(req));
    }

    @PostMapping("/verify-forgot-password-token")
    public ResponseEntity<Map<String, Object>> verifyForgotPasswordToken(@Valid @RequestBody ResetPasswordRequest req) {
        return ResponseEntity.ok(patientAuthService.verifyForgotPasswordToken(req));
    }

    private String clientIp(HttpServletRequest req) {
        String fwd = req.getHeader("X-Forwarded-For");
        if (fwd != null && !fwd.isBlank()) {
            int comma = fwd.indexOf(',');
            return (comma > 0 ? fwd.substring(0, comma) : fwd).trim();
        }
        return req.getRemoteAddr();
    }
}
