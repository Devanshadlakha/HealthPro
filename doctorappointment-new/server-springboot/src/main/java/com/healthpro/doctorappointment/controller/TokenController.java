package com.healthpro.doctorappointment.controller;

import com.healthpro.doctorappointment.security.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class TokenController {

    private final JwtUtil jwtUtil;

    public TokenController(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @GetMapping("/get-token-type")
    public ResponseEntity<?> getTokenType(HttpServletRequest request) {
        try {
            String authHeader = request.getHeader("Authorization");
            if (authHeader == null || authHeader.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "No token provided"));
            }
            // Support both raw token and "Bearer <token>" format
            String token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : authHeader;
            String type = jwtUtil.getUserType(token);
            return ResponseEntity.ok(Map.of("type", type));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid token"));
        }
    }
}
