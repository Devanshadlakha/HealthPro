package com.healthpro.doctorappointment.controller;

import com.healthpro.doctorappointment.service.PatientAppointmentService;
import com.healthpro.doctorappointment.service.SlotService;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/patient-appointment")
public class PatientAppointmentController {

    private static final Logger log = LoggerFactory.getLogger(PatientAppointmentController.class);
    private static final long MAX_ATTACH_BYTES = 10 * 1024 * 1024; // 10 MB
    private static final Set<String> ALLOWED_ATTACH_TYPES = Set.of(
            "application/pdf", "image/jpeg", "image/png", "image/webp"
    );

    @Value("${app.upload-dir:uploads}")
    private String uploadDir;

    private final PatientAppointmentService service;
    private final SlotService slotService;

    public PatientAppointmentController(PatientAppointmentService service, SlotService slotService) {
        this.service = service;
        this.slotService = slotService;
    }

    @GetMapping("/get-patient-appointments")
    public ResponseEntity<?> getPatientAppointments(HttpServletRequest request) {
        try {
            String userId = (String) request.getAttribute("userId");
            return ResponseEntity.ok(service.getPatientAppointments(userId));
        } catch (Exception e) {
            log.error("getPatientAppointments failed", e);
            return ResponseEntity.status(500).body(Map.of("err", "Server error"));
        }
    }

    @PostMapping("/review-doctor")
    public ResponseEntity<?> reviewDoctor(@RequestBody Map<String, Object> body, HttpServletRequest request) {
        String userId = (String) request.getAttribute("userId");
        return ResponseEntity.ok(service.reviewDoctor(userId, body));
    }

    @GetMapping("/past-appointments")
    public ResponseEntity<?> pastAppointments(HttpServletRequest request) {
        try {
            String userId = (String) request.getAttribute("userId");
            return ResponseEntity.ok(service.getPastAppointments(userId));
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error");
        }
    }

    @PostMapping("/cancel-appointment")
    public ResponseEntity<?> cancelAppointment(@RequestBody Map<String, Object> body, HttpServletRequest request) {
        String userId = (String) request.getAttribute("userId");
        String appointmentId = (String) body.get("appointmentId");
        return ResponseEntity.ok(slotService.cancelAppointment(appointmentId, userId));
    }

    @PostMapping("/request-reschedule")
    public ResponseEntity<?> requestReschedule(@RequestBody Map<String, Object> body, HttpServletRequest request) {
        String userId = (String) request.getAttribute("userId");
        String appointmentId = (String) body.get("appointmentId");
        String slotId = (String) body.get("slotId");
        return ResponseEntity.ok(slotService.requestReschedule(appointmentId, slotId, userId));
    }

    @PostMapping("/request-video-call")
    public ResponseEntity<?> requestVideoCall(@RequestBody Map<String, Object> body, HttpServletRequest request) {
        String userId = (String) request.getAttribute("userId");
        String appointmentId = (String) body.get("appointmentId");
        return ResponseEntity.ok(slotService.requestVideoCall(appointmentId, userId));
    }

    @PostMapping("/upload-attachment")
    public ResponseEntity<?> uploadAttachment(@RequestParam("file") MultipartFile file,
                                              @RequestParam("appointmentId") String appointmentId,
                                              HttpServletRequest request) {
        try {
            String userId = (String) request.getAttribute("userId");
            if (file == null || file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "No file uploaded"));
            }
            if (file.getSize() > MAX_ATTACH_BYTES) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "File must be under 10 MB"));
            }
            String contentType = file.getContentType();
            if (contentType == null || !ALLOWED_ATTACH_TYPES.contains(contentType)) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Only PDF, JPG, PNG, or WEBP allowed"));
            }
            String ext = switch (contentType) {
                case "application/pdf" -> ".pdf";
                case "image/jpeg" -> ".jpg";
                case "image/png" -> ".png";
                case "image/webp" -> ".webp";
                default -> "";
            };
            String filename = appointmentId + "-" + UUID.randomUUID() + ext;
            Path dir = Paths.get(uploadDir, "attachments").toAbsolutePath().normalize();
            Files.createDirectories(dir);
            Path dest = dir.resolve(filename);
            file.transferTo(dest.toFile());
            String url = "/uploads/attachments/" + filename;
            return ResponseEntity.ok(service.addAttachment(appointmentId, userId, url));
        } catch (Exception e) {
            log.error("uploadAttachment failed", e);
            return ResponseEntity.status(500).body(Map.of("success", false, "message", "Upload failed"));
        }
    }

    @GetMapping("/user-profile")
    public ResponseEntity<?> getUserProfile(HttpServletRequest request) {
        try {
            String userId = (String) request.getAttribute("userId");
            return ResponseEntity.ok(service.getUserProfile(userId));
        } catch (Exception e) {
            log.error("getUserProfile failed", e);
            return ResponseEntity.status(500).body(Map.of("err", "Server error"));
        }
    }
}
