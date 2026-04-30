package com.healthpro.doctorappointment.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Per-IP sliding-window rate limiter for failed login attempts.
 * In-memory only: state resets on restart, and the limit is per JVM.
 * For multi-instance deployments, swap for Redis-backed Bucket4j.
 */
@Component
public class LoginRateLimiter {

    private final int maxAttempts;
    private final Duration window;
    private final Map<String, Deque<Instant>> attempts = new ConcurrentHashMap<>();

    public LoginRateLimiter(@Value("${app.auth.rate-limit.max-attempts:5}") int maxAttempts,
                            @Value("${app.auth.rate-limit.window-seconds:60}") long windowSeconds) {
        this.maxAttempts = maxAttempts;
        this.window = Duration.ofSeconds(windowSeconds);
    }

    /** Returns true if the caller has exceeded the limit. */
    public boolean isBlocked(String key) {
        Deque<Instant> ts = attempts.get(key);
        if (ts == null) return false;
        synchronized (ts) {
            evictOldLocked(ts);
            return ts.size() >= maxAttempts;
        }
    }

    /** Record a failed attempt. */
    public void recordFailure(String key) {
        Deque<Instant> ts = attempts.computeIfAbsent(key, k -> new ArrayDeque<>());
        synchronized (ts) {
            ts.addLast(Instant.now());
            evictOldLocked(ts);
        }
    }

    /** Clear after a successful auth so a legit user is not penalised. */
    public void recordSuccess(String key) {
        attempts.remove(key);
    }

    public long secondsUntilUnblocked(String key) {
        Deque<Instant> ts = attempts.get(key);
        if (ts == null) return 0;
        synchronized (ts) {
            evictOldLocked(ts);
            if (ts.size() < maxAttempts) return 0;
            Instant earliest = ts.peekFirst();
            if (earliest == null) return 0;
            long remaining = window.minus(Duration.between(earliest, Instant.now())).getSeconds();
            return Math.max(remaining, 1);
        }
    }

    private void evictOldLocked(Deque<Instant> ts) {
        Instant cutoff = Instant.now().minus(window);
        while (!ts.isEmpty() && ts.peekFirst().isBefore(cutoff)) {
            ts.pollFirst();
        }
    }
}
