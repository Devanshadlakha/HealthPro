package com.healthpro.doctorappointment.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    public static final String AUTH_COOKIE = "hp_token";

    private final JwtUtil jwtUtil;

    public JwtAuthFilter(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String token = extractToken(request);

        if (token != null && !token.isEmpty()) {
            try {
                if (jwtUtil.isValid(token)) {
                    String userId = jwtUtil.getUserId(token);
                    String userType = jwtUtil.getUserType(token);

                    request.setAttribute("userId", userId);
                    request.setAttribute("userType", userType);

                    var authorities = List.of(new SimpleGrantedAuthority("ROLE_" + userType.toUpperCase()));
                    var authentication = new UsernamePasswordAuthenticationToken(userId, null, authorities);
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            } catch (Exception e) {
                // Invalid token - continue without authentication
            }
        }

        filterChain.doFilter(request, response);
    }

    private String extractToken(HttpServletRequest request) {
        // 1) httpOnly cookie (preferred — not readable by JS)
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie c : cookies) {
                if (AUTH_COOKIE.equals(c.getName()) && c.getValue() != null && !c.getValue().isEmpty()) {
                    return c.getValue();
                }
            }
        }
        // 2) Legacy Authorization header — accepted as fallback for non-browser clients
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && !authHeader.isEmpty()) {
            return authHeader.startsWith("Bearer ") ? authHeader.substring(7) : authHeader;
        }
        return null;
    }
}
