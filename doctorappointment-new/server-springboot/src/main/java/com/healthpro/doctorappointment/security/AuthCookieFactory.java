package com.healthpro.doctorappointment.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.time.Duration;

/**
 * Builds the auth cookie used to carry the JWT. Centralised so cookie attributes
 * stay consistent between login and logout, and so prod/dev differences (Secure,
 * SameSite=None for cross-origin) live in one place.
 */
@Component
public class AuthCookieFactory {

    @Value("${app.cookie-secure:false}")
    private boolean secure;

    @Value("${jwt.expiration-ms:86400000}")
    private long expirationMs;

    public ResponseCookie issue(String token) {
        return ResponseCookie.from(JwtAuthFilter.AUTH_COOKIE, token)
                .httpOnly(true)
                .secure(secure)
                .sameSite(secure ? "None" : "Lax")
                .path("/")
                .maxAge(Duration.ofMillis(expirationMs))
                .build();
    }

    public ResponseCookie clear() {
        return ResponseCookie.from(JwtAuthFilter.AUTH_COOKIE, "")
                .httpOnly(true)
                .secure(secure)
                .sameSite(secure ? "None" : "Lax")
                .path("/")
                .maxAge(Duration.ZERO)
                .build();
    }
}
