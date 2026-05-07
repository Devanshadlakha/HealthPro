package com.healthpro.doctorappointment.controller;

import com.healthpro.doctorappointment.model.Doctor;
import com.healthpro.doctorappointment.model.Patient;
import com.healthpro.doctorappointment.model.PatientProfile;
import com.healthpro.doctorappointment.model.TimeSlot;
import com.healthpro.doctorappointment.repository.DoctorRepository;
import com.healthpro.doctorappointment.repository.PatientRepository;
import com.healthpro.doctorappointment.service.PatientAppointmentService;
import com.healthpro.doctorappointment.service.SlotService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/slots")
public class SlotController {

    private final SlotService slotService;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final PatientAppointmentService patientAppointmentService;

    public SlotController(SlotService slotService, DoctorRepository doctorRepository,
                          PatientRepository patientRepository,
                          PatientAppointmentService patientAppointmentService) {
        this.slotService = slotService;
        this.doctorRepository = doctorRepository;
        this.patientRepository = patientRepository;
        this.patientAppointmentService = patientAppointmentService;
    }

    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<List<TimeSlot>> getSlots(
            @PathVariable String doctorId,
            @RequestParam String date) {
        return ResponseEntity.ok(slotService.getSlotsForDoctorOnDate(doctorId, date));
    }

    @PostMapping("/generate")
    public ResponseEntity<?> generateSlots(@RequestBody Map<String, Object> body,
                                           HttpServletRequest request) {
        String doctorId = (String) request.getAttribute("userId");
        Doctor doctor = doctorRepository.findById(doctorId).orElse(null);
        if (doctor == null) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Doctor not found"));
        }

        String date = (String) body.get("date");
        String startHour = (String) body.getOrDefault("startHour", "09:00");
        String endHour = (String) body.getOrDefault("endHour", "17:00");

        List<TimeSlot> slots = slotService.generateSlots(
                doctorId, doctor.getHospitalId(), date, startHour, endHour);
        return ResponseEntity.ok(Map.of("success", true, "slotsCreated", slots.size(), "slots", slots));
    }

    @PostMapping("/book")
    public ResponseEntity<?> bookSlot(@RequestBody Map<String, Object> body,
                                      HttpServletRequest request) {
        String patientId = (String) request.getAttribute("userId");
        Patient patient = patientRepository.findById(patientId).orElse(null);
        if (patient == null) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Patient not found"));
        }

        String slotId = (String) body.get("slotId");
        String doctorId = (String) body.get("doctorId");
        String doctorName = (String) body.getOrDefault("doctorName", "");
        String profileId = (String) body.get("profileId");

        Doctor doctor = doctorRepository.findById(doctorId).orElse(null);
        if (doctor != null && doctorName.isEmpty()) {
            doctorName = doctor.getName();
        }

        // Resolve which profile this booking is for. Defaults to "self" when not specified
        // (keeps older clients working).
        String displayName = patient.getName();
        String relation = "self";
        if (profileId != null && !profileId.isBlank()) {
            PatientProfile profile = patientAppointmentService.findProfile(patientId, profileId);
            if (profile == null) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Profile not found"));
            }
            displayName = profile.getName();
            relation = profile.getRelation() != null ? profile.getRelation() : "other";
        } else if (patient.getProfiles() != null) {
            // Default to the self profile if the client didn't specify one.
            PatientProfile self = patient.getProfiles().stream()
                    .filter(x -> "self".equalsIgnoreCase(x.getRelation()))
                    .findFirst().orElse(null);
            if (self != null) {
                profileId = self.getId();
                displayName = self.getName();
            }
        }

        Map<String, Object> result = slotService.reserveSlot(slotId, patientId, displayName,
                doctorId, doctorName, profileId, relation);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/approve")
    public ResponseEntity<?> approveBooking(@RequestBody Map<String, Object> body) {
        String appointmentId = (String) body.get("appointmentId");
        return ResponseEntity.ok(slotService.approveBooking(appointmentId));
    }

    @PostMapping("/reject")
    public ResponseEntity<?> rejectBooking(@RequestBody Map<String, Object> body) {
        String appointmentId = (String) body.get("appointmentId");
        return ResponseEntity.ok(slotService.rejectBooking(appointmentId));
    }

    @PostMapping("/approve-change")
    public ResponseEntity<?> approveChange(@RequestBody Map<String, Object> body) {
        String appointmentId = (String) body.get("appointmentId");
        return ResponseEntity.ok(slotService.approveChange(appointmentId));
    }

    @PostMapping("/reject-change")
    public ResponseEntity<?> rejectChange(@RequestBody Map<String, Object> body) {
        String appointmentId = (String) body.get("appointmentId");
        return ResponseEntity.ok(slotService.rejectChange(appointmentId));
    }

    @GetMapping("/pending-bookings")
    public ResponseEntity<?> getPendingBookings(HttpServletRequest request) {
        String doctorId = (String) request.getAttribute("userId");
        return ResponseEntity.ok(slotService.getPendingBookings(doctorId));
    }
}
