package com.healthpro.doctorappointment.config;

import com.healthpro.doctorappointment.security.JwtAuthFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final CorsConfigurationSource corsConfigurationSource;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter, CorsConfigurationSource corsConfigurationSource) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.corsConfigurationSource = corsConfigurationSource;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Public endpoints (no JWT required)
                .requestMatchers("/doctor-auth/**").permitAll()
                .requestMatchers("/patient-auth/**").permitAll()
                .requestMatchers("/get-token-type").permitAll()
                // Hospital browsing (public)
                .requestMatchers("/hospitals/**").permitAll()
                .requestMatchers("/uploads/**").permitAll()
                .requestMatchers("/doctors/*/profile").permitAll()
                .requestMatchers("/slots/doctor/**").permitAll()
                .requestMatchers("/seed/**").permitAll()
                // Razorpay webhook (verified by signature, not JWT)
                .requestMatchers("/payment/webhook").permitAll()
                // Protected endpoints
                .requestMatchers("/doctor-appointment/**").hasRole("DOCTOR")
                .requestMatchers("/patient-appointment/**").hasRole("PATIENT")
                .requestMatchers("/slots/generate").hasRole("DOCTOR")
                .requestMatchers("/slots/approve").hasRole("DOCTOR")
                .requestMatchers("/slots/reject").hasRole("DOCTOR")
                .requestMatchers("/slots/pending-bookings").hasRole("DOCTOR")
                .requestMatchers("/slots/book").hasRole("PATIENT")
                .requestMatchers("/payment/create-order").hasRole("PATIENT")
                .requestMatchers("/payment/verify").hasRole("PATIENT")
                .requestMatchers("/chatbot/**").hasRole("PATIENT")
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(10);
    }
}
