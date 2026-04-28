package com.healthpro.doctorappointment.controller;

import com.healthpro.doctorappointment.service.DoctorAppointmentService;
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
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/doctor-appointment")
public class DoctorAppointmentController {

    private static final Logger log = LoggerFactory.getLogger(DoctorAppointmentController.class);
    private static final long MAX_PHOTO_BYTES = 2L * 1024 * 1024;
    private static final Set<String> ALLOWED_TYPES = Set.of("image/jpeg", "image/png", "image/webp", "image/gif");

    private final DoctorAppointmentService service;

    @Value("${app.upload-dir:uploads}")
    private String uploadDir;

    public DoctorAppointmentController(DoctorAppointmentService service) {
        this.service = service;
    }

    @GetMapping("/get-all-appointments")
    public ResponseEntity<?> getAllAppointments() {
        try {
            return ResponseEntity.ok(service.getAllAppointments());
        } catch (Exception e) {
            log.error("getAllAppointments failed", e);
            return ResponseEntity.status(500).body(Map.of("err", "Server error"));
        }
    }

    @GetMapping("/get-my-appointments")
    public ResponseEntity<?> getMyAppointments(HttpServletRequest request) {
        try {
            String userId = (String) request.getAttribute("userId");
            return ResponseEntity.ok(service.getDoctorAppointments(userId));
        } catch (Exception e) {
            log.error("getMyAppointments failed", e);
            return ResponseEntity.status(500).body(Map.of("err", "Server error"));
        }
    }

    @PostMapping("/add-present-doctor")
    public ResponseEntity<?> addPresentDoctor(@RequestBody Map<String, Object> body, HttpServletRequest request) {
        try {
            String userId = (String) request.getAttribute("userId");
            String appointmentId = (String) body.get("appointmentId");
            return ResponseEntity.ok(service.addPresentDoctor(appointmentId, userId));
        } catch (Exception e) {
            log.error("addPresentDoctor failed", e);
            return ResponseEntity.status(500).body(Map.of("err", "Server error"));
        }
    }

    @PostMapping("/update-appointment")
    public ResponseEntity<?> updateAppointment(@RequestBody Map<String, Object> body, HttpServletRequest request) {
        try {
            String userId = (String) request.getAttribute("userId");
            String appointmentId = (String) body.get("appointmentId");
            Boolean done = body.get("done") != null ? Boolean.parseBoolean(body.get("done").toString()) : false;
            String name = (String) body.get("name");
            return ResponseEntity.ok(service.updateAppointmentProgress(appointmentId, done, name, userId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Error updating appointment progress."));
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

    @PostMapping("/upload-photo")
    public ResponseEntity<?> uploadPhoto(@RequestParam("photo") MultipartFile file, HttpServletRequest request) {
        try {
            String userId = (String) request.getAttribute("userId");
            if (file == null || file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "No file uploaded"));
            }
            if (file.getSize() > MAX_PHOTO_BYTES) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Image must be under 2 MB"));
            }
            String contentType = file.getContentType();
            if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Only JPEG, PNG, WEBP, or GIF images are allowed"));
            }
            String ext = switch (contentType) {
                case "image/jpeg" -> ".jpg";
                case "image/png" -> ".png";
                case "image/webp" -> ".webp";
                case "image/gif" -> ".gif";
                default -> "";
            };
            String filename = userId + "-" + UUID.randomUUID() + ext;
            Path dir = Paths.get(uploadDir, "doctors").toAbsolutePath().normalize();
            Files.createDirectories(dir);
            Path dest = dir.resolve(filename);
            file.transferTo(dest.toFile());
            String photoUrl = "/uploads/doctors/" + filename;
            return ResponseEntity.ok(service.updateProfilePhoto(userId, photoUrl));
        } catch (Exception e) {
            log.error("uploadPhoto failed", e);
            return ResponseEntity.status(500).body(Map.of("success", false, "message", "Upload failed"));
        }
    }

    @GetMapping("/get-my-reviews")
    public ResponseEntity<?> getMyReviews(HttpServletRequest request) {
        try {
            String userId = (String) request.getAttribute("userId");
            return ResponseEntity.ok(service.getReviews(userId));
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Server error.");
        }
    }

    // ---- New endpoints for Doctor Dashboard ----

    @GetMapping("/todays-appointments")
    public ResponseEntity<?> getTodaysAppointments(HttpServletRequest request) {
        try {
            String userId = (String) request.getAttribute("userId");
            return ResponseEntity.ok(service.getTodaysAppointments(userId));
        } catch (Exception e) {
            log.error("getTodaysAppointments failed", e);
            return ResponseEntity.status(500).body(Map.of("err", "Server error"));
        }
    }

    @PostMapping("/mark-consulted")
    public ResponseEntity<?> markConsulted(@RequestBody Map<String, Object> body) {
        String appointmentId = (String) body.get("appointmentId");
        return ResponseEntity.ok(service.markConsulted(appointmentId));
    }

    @PostMapping("/save-notes")
    public ResponseEntity<?> saveNotes(@RequestBody Map<String, Object> body) {
        String appointmentId = (String) body.get("appointmentId");
        String notes = (String) body.get("notes");
        return ResponseEntity.ok(service.saveConsultationNotes(appointmentId, notes));
    }

    @GetMapping("/appointment-detail/{appointmentId}")
    public ResponseEntity<?> getAppointmentDetail(@PathVariable String appointmentId) {
        return ResponseEntity.ok(service.getAppointmentDetail(appointmentId));
    }

    @GetMapping("/patient-history/{patientId}")
    public ResponseEntity<?> getPatientHistory(@PathVariable String patientId) {
        return ResponseEntity.ok(service.getPatientHistory(patientId));
    }

    @GetMapping("/search-patients")
    public ResponseEntity<?> searchPatients(@RequestParam String q) {
        return ResponseEntity.ok(service.searchPatients(q));
    }

    @GetMapping("/weekly-schedule")
    public ResponseEntity<?> getWeeklySchedule(HttpServletRequest request) {
        try {
            String userId = (String) request.getAttribute("userId");
            return ResponseEntity.ok(service.getWeeklySchedule(userId));
        } catch (Exception e) {
            log.error("getWeeklySchedule failed", e);
            return ResponseEntity.status(500).body(Map.of("err", "Server error"));
        }
    }

    @PostMapping("/weekly-schedule")
    public ResponseEntity<?> saveWeeklySchedule(@RequestBody Map<String, Object> body, HttpServletRequest request) {
        try {
            String userId = (String) request.getAttribute("userId");
            return ResponseEntity.ok(service.saveWeeklySchedule(userId, body));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(409).body(Map.of("err", e.getMessage()));
        } catch (Exception e) {
            log.error("saveWeeklySchedule failed", e);
            return ResponseEntity.status(500).body(Map.of("err", "Server error"));
        }
    }
}
