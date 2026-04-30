package com.healthpro.doctorappointment.service;

import com.healthpro.doctorappointment.dto.PageResponse;
import com.healthpro.doctorappointment.exception.ApiException;
import com.healthpro.doctorappointment.model.Appointment;
import com.healthpro.doctorappointment.model.Doctor;
import com.healthpro.doctorappointment.model.Review;
import com.healthpro.doctorappointment.repository.AppointmentRepository;
import com.healthpro.doctorappointment.repository.DoctorRepository;
import com.healthpro.doctorappointment.repository.ReviewRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Owns review writes, reads, and aggregate computation. Doctor.rating (legacy embedded list)
 * is no longer the source of truth — this service queries the {@code reviews} collection.
 */
@Service
public class ReviewService {

    private static final int MAX_PAGE_SIZE = 50;

    private final ReviewRepository reviewRepository;
    private final AppointmentRepository appointmentRepository;
    private final DoctorRepository doctorRepository;

    public ReviewService(ReviewRepository reviewRepository,
                         AppointmentRepository appointmentRepository,
                         DoctorRepository doctorRepository) {
        this.reviewRepository = reviewRepository;
        this.appointmentRepository = appointmentRepository;
        this.doctorRepository = doctorRepository;
    }

    public record AggregateRating(double average, long total) {}

    public AggregateRating aggregateForDoctor(String doctorId) {
        List<Review> reviews = reviewRepository.findByDoctorId(doctorId);
        if (reviews.isEmpty()) return new AggregateRating(0.0, 0);
        double avg = reviews.stream().mapToInt(Review::getRate).average().orElse(0);
        return new AggregateRating(Math.round(avg * 10.0) / 10.0, reviews.size());
    }

    /**
     * Single Mongo round-trip variant for list pages. Returns a map keyed by doctorId so
     * callers can lookup aggregates without firing one query per doctor.
     */
    public java.util.Map<String, AggregateRating> aggregatesForDoctors(java.util.Collection<String> doctorIds) {
        java.util.Map<String, AggregateRating> out = new java.util.HashMap<>();
        if (doctorIds == null || doctorIds.isEmpty()) return out;
        List<Review> reviews = reviewRepository.findByDoctorIdIn(doctorIds);
        java.util.Map<String, java.util.List<Review>> grouped = new java.util.HashMap<>();
        for (Review r : reviews) {
            grouped.computeIfAbsent(r.getDoctorId(), k -> new java.util.ArrayList<>()).add(r);
        }
        for (String id : doctorIds) {
            List<Review> list = grouped.getOrDefault(id, java.util.Collections.emptyList());
            if (list.isEmpty()) {
                out.put(id, new AggregateRating(0.0, 0));
            } else {
                double avg = list.stream().mapToInt(Review::getRate).average().orElse(0);
                out.put(id, new AggregateRating(Math.round(avg * 10.0) / 10.0, list.size()));
            }
        }
        return out;
    }

    /** Patient-facing: submit a review for a completed appointment. */
    public Map<String, Object> submitReview(String patientUserId, String appointmentId, int rating, String comment) {
        if (rating < 1 || rating > 5) {
            throw ApiException.badRequest("Rating must be between 1 and 5");
        }
        Appointment apt = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> ApiException.notFound("Appointment not found"));

        if (apt.getPatientId() == null || !apt.getPatientId().contains(patientUserId)) {
            throw new ApiException(org.springframework.http.HttpStatus.FORBIDDEN,
                    "You are not authorized to review this appointment");
        }
        if (Boolean.TRUE.equals(apt.getReviewed())) {
            throw ApiException.conflict("This appointment has already been reviewed");
        }
        if (apt.getAppointedDoctorId() == null || apt.getAppointedDoctorId().isEmpty()) {
            throw ApiException.badRequest("No doctor assigned to this appointment");
        }

        String doctorId = apt.getAppointedDoctorId().get(0);
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> ApiException.notFound("Doctor not found"));

        Review review = new Review();
        review.setDoctorId(doctorId);
        review.setHospitalId(apt.getHospitalId());
        review.setAppointmentId(appointmentId);
        review.setPatientId(patientUserId);
        review.setPatientName(apt.getPatientname());
        review.setRate(rating);
        review.setComment(comment);
        review.setCreatedAt(Instant.now());
        reviewRepository.save(review);

        apt.setReviewed(true);
        appointmentRepository.save(apt);

        return Map.of(
                "success", true,
                "message", "Review submitted successfully",
                "reviewId", review.getId(),
                "doctorId", doctor.getId()
        );
    }

    /** Doctor-facing: reply to a review on one of their appointments. */
    public Map<String, Object> replyToReview(String doctorUserId, String reviewId, String reply) {
        if (reply == null || reply.isBlank()) {
            throw ApiException.badRequest("Reply cannot be empty");
        }
        if (reply.length() > 1000) {
            throw ApiException.badRequest("Reply cannot exceed 1000 characters");
        }
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> ApiException.notFound("Review not found"));
        if (!doctorUserId.equals(review.getDoctorId())) {
            throw new ApiException(org.springframework.http.HttpStatus.FORBIDDEN,
                    "You are not authorized to reply to this review");
        }
        review.setDoctorReply(reply);
        review.setDoctorRepliedAt(Instant.now());
        reviewRepository.save(review);
        return Map.of(
                "success", true,
                "message", "Reply saved",
                "reviewId", reviewId,
                "doctorReply", reply,
                "doctorRepliedAt", review.getDoctorRepliedAt().toString()
        );
    }

    /** Doctor-facing: list reviews authored about this doctor. */
    public PageResponse<Map<String, Object>> getReviewsForDoctor(String doctorId, int page, int size) {
        size = clampSize(size);
        page = Math.max(page, 0);
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Review> result = reviewRepository.findByDoctorId(doctorId, pageable);
        return PageResponse.from(result, this::reviewToMap);
    }

    private Map<String, Object> reviewToMap(Review r) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", r.getId());
        m.put("doctorId", r.getDoctorId());
        m.put("appointmentId", r.getAppointmentId());
        m.put("patientName", r.getPatientName());
        m.put("rate", r.getRate());
        m.put("comment", r.getComment());
        m.put("doctorReply", r.getDoctorReply());
        m.put("doctorRepliedAt", r.getDoctorRepliedAt() != null ? r.getDoctorRepliedAt().toString() : null);
        m.put("createdAt", r.getCreatedAt() != null ? r.getCreatedAt().toString() : null);
        m.put("editedAt", r.getEditedAt() != null ? r.getEditedAt().toString() : null);
        m.put("helpfulCount", r.getHelpfulCount());
        // Enrich with the appointment problem so the UI can show "what was the visit about"
        Optional<Appointment> apt = appointmentRepository.findById(r.getAppointmentId());
        m.put("problem", apt.map(Appointment::getProblem).orElse(null));
        return m;
    }

    private int clampSize(int size) {
        if (size <= 0) return 10;
        return Math.min(size, MAX_PAGE_SIZE);
    }
}
