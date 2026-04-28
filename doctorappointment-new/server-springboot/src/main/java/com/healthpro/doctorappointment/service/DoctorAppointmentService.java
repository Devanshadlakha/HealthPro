package com.healthpro.doctorappointment.service;

import com.healthpro.doctorappointment.model.Appointment;
import com.healthpro.doctorappointment.model.Doctor;
import com.healthpro.doctorappointment.model.Patient;
import com.healthpro.doctorappointment.repository.AppointmentRepository;
import com.healthpro.doctorappointment.repository.DoctorRepository;
import com.healthpro.doctorappointment.repository.PatientRepository;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DoctorAppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final SlotService slotService;

    public DoctorAppointmentService(AppointmentRepository appointmentRepository,
                                     DoctorRepository doctorRepository,
                                     PatientRepository patientRepository,
                                     SlotService slotService) {
        this.appointmentRepository = appointmentRepository;
        this.doctorRepository = doctorRepository;
        this.patientRepository = patientRepository;
        this.slotService = slotService;
    }

    public List<Map<String, Object>> getAllAppointments() {
        List<Appointment> appointments = appointmentRepository.findByProgress("toaccept");
        List<Map<String, Object>> result = new ArrayList<>();

        for (Appointment apt : appointments) {
            Map<String, Object> map = appointmentToMap(apt);
            // Populate patient name from patientId (like Node.js populate)
            if (apt.getPatientId() != null && !apt.getPatientId().isEmpty()) {
                String patientIdStr = apt.getPatientId().get(0);
                var patientOpt = patientRepository.findById(patientIdStr);
                if (patientOpt.isPresent()) {
                    Map<String, Object> patientInfo = new HashMap<>();
                    patientInfo.put("_id", patientOpt.get().getId());
                    patientInfo.put("name", patientOpt.get().getName());
                    map.put("patientId", patientInfo);
                } else {
                    map.put("patientId", null);
                }
            } else {
                map.put("patientId", null);
            }
            result.add(map);
        }
        return result;
    }

    public List<Appointment> getDoctorAppointments(String doctorId) {
        return appointmentRepository.findByAppointedDoctorIdContainingAndProgress(doctorId, "ongoing");
    }

    public Appointment addPresentDoctor(String appointmentId, String doctorId) {
        var aptOpt = appointmentRepository.findById(appointmentId);
        if (aptOpt.isEmpty()) {
            throw new RuntimeException("Appointment not found");
        }
        Appointment apt = aptOpt.get();
        if (!apt.getPresentDoctorIds().contains(doctorId)) {
            apt.getPresentDoctorIds().add(doctorId);
        }
        return appointmentRepository.save(apt);
    }

    public Object updateAppointmentProgress(String appointmentId, Boolean done, String name, String doctorId) {
        if (appointmentId == null) {
            throw new IllegalArgumentException("Appointment ID and progress are required.");
        }

        var aptOpt = appointmentRepository.findById(appointmentId);
        if (aptOpt.isEmpty()) {
            throw new RuntimeException("Appointment not found");
        }

        Appointment apt = aptOpt.get();

        if (done != null && done) {
            // Mark as done
            apt.setProgress("done");
            apt.setDoctorname(name);
            appointmentRepository.save(apt);
            return Map.of("message", "Appointment deleted successfully.");
        } else {
            // Mark as ongoing and assign doctor
            apt.setProgress("ongoing");
            if (!apt.getAppointedDoctorId().contains(doctorId)) {
                apt.getAppointedDoctorId().add(doctorId);
            }
            return appointmentRepository.save(apt);
        }
    }

    public Map<String, Object> getUserProfile(String doctorId) {
        var doctorOpt = doctorRepository.findById(doctorId);
        if (doctorOpt.isEmpty()) {
            throw new RuntimeException("Doctor not found");
        }
        Doctor doctor = doctorOpt.get();
        Map<String, Object> profile = new HashMap<>();
        profile.put("_id", doctor.getId());
        profile.put("name", doctor.getName());
        profile.put("email", doctor.getEmail());
        profile.put("mobile", doctor.getMobile());
        profile.put("experience", doctor.getExperience());
        profile.put("specialization", doctor.getSpecialization());
        profile.put("gender", doctor.getGender());
        profile.put("fees", doctor.getFees());
        profile.put("photoUrl", doctor.getPhotoUrl());
        profile.put("rating", doctor.getRating());
        return Map.of("user", profile);
    }

    public Map<String, Object> updateProfilePhoto(String doctorId, String photoUrl) {
        if (photoUrl == null || photoUrl.isEmpty()) {
            return Map.of("success", false, "message", "Photo URL is required");
        }
        var doctorOpt = doctorRepository.findById(doctorId);
        if (doctorOpt.isEmpty()) {
            return Map.of("success", false, "message", "Doctor not found");
        }
        Doctor doctor = doctorOpt.get();
        doctor.setPhotoUrl(photoUrl);
        doctorRepository.save(doctor);
        return Map.of("success", true, "message", "Photo updated", "photoUrl", photoUrl);
    }

    public List<Map<String, Object>> getReviews(String doctorId) {
        var doctorOpt = doctorRepository.findById(doctorId);
        if (doctorOpt.isEmpty()) {
            throw new RuntimeException("Doctor not found");
        }

        Doctor doctor = doctorOpt.get();
        List<String> appointmentIds = doctor.getRating().stream()
                .map(r -> r.getAppointmentId())
                .filter(Objects::nonNull)
                .toList();

        List<Appointment> appointments = appointmentRepository.findAllById(appointmentIds);
        Map<String, String> problemMap = new HashMap<>();
        for (Appointment apt : appointments) {
            problemMap.put(apt.getId(), apt.getProblem());
        }

        List<Map<String, Object>> enrichedRatings = new ArrayList<>();
        for (var rating : doctor.getRating()) {
            Map<String, Object> map = new HashMap<>();
            map.put("appointmentId", rating.getAppointmentId());
            map.put("patientName", rating.getPatientName());
            map.put("rate", rating.getRate());
            map.put("comment", rating.getComment());
            map.put("problem", problemMap.getOrDefault(rating.getAppointmentId(), "No problem description"));
            enrichedRatings.add(map);
        }

        return enrichedRatings;
    }

    // ---- New methods for Doctor Dashboard ----

    public List<Map<String, Object>> getTodaysAppointments(String doctorId) {
        String today = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
        List<Appointment> appointments = appointmentRepository.findByAppointedDoctorIdContainingAndSlotDate(doctorId, today);
        List<Map<String, Object>> result = new ArrayList<>();
        for (Appointment apt : appointments) {
            Map<String, Object> map = appointmentToMap(apt);
            map.put("slotDate", apt.getSlotDate());
            map.put("slotTime", apt.getSlotTime());
            map.put("consultationNotes", apt.getConsultationNotes());
            // Get patient info
            if (apt.getPatientId() != null && !apt.getPatientId().isEmpty()) {
                patientRepository.findById(apt.getPatientId().get(0)).ifPresent(p -> {
                    map.put("patientAge", p.getAge());
                    map.put("patientGender", p.getGender());
                });
            }
            result.add(map);
        }
        // Sort by slotTime
        result.sort((a, b) -> {
            String timeA = (String) a.getOrDefault("slotTime", "");
            String timeB = (String) b.getOrDefault("slotTime", "");
            return timeA.compareTo(timeB);
        });
        return result;
    }

    public Map<String, Object> markConsulted(String appointmentId) {
        var aptOpt = appointmentRepository.findById(appointmentId);
        if (aptOpt.isEmpty()) {
            return Map.of("success", false, "message", "Appointment not found");
        }
        Appointment apt = aptOpt.get();
        apt.setProgress("done");
        appointmentRepository.save(apt);
        return Map.of("success", true, "message", "Appointment marked as consulted");
    }

    public Map<String, Object> saveConsultationNotes(String appointmentId, String notes) {
        var aptOpt = appointmentRepository.findById(appointmentId);
        if (aptOpt.isEmpty()) {
            return Map.of("success", false, "message", "Appointment not found");
        }
        Appointment apt = aptOpt.get();
        apt.setConsultationNotes(notes);
        appointmentRepository.save(apt);
        return Map.of("success", true, "message", "Notes saved successfully");
    }

    public Map<String, Object> getAppointmentDetail(String appointmentId) {
        var aptOpt = appointmentRepository.findById(appointmentId);
        if (aptOpt.isEmpty()) {
            return Map.of("error", "Appointment not found");
        }
        Appointment apt = aptOpt.get();
        Map<String, Object> map = appointmentToMap(apt);
        map.put("slotDate", apt.getSlotDate());
        map.put("slotTime", apt.getSlotTime());
        map.put("consultationNotes", apt.getConsultationNotes());
        map.put("hospitalId", apt.getHospitalId());
        if (apt.getPatientId() != null && !apt.getPatientId().isEmpty()) {
            String pid = apt.getPatientId().get(0);
            map.put("patientIdStr", pid);
            patientRepository.findById(pid).ifPresent(p -> {
                map.put("patientAge", p.getAge());
                map.put("patientGender", p.getGender());
                map.put("patientEmail", p.getEmail());
                map.put("patientMobile", p.getMobile());
            });
        }
        return map;
    }

    public List<Map<String, Object>> getPatientHistory(String patientId) {
        List<Appointment> appointments = appointmentRepository.findByPatientIdContaining(patientId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (Appointment apt : appointments) {
            if (!"done".equals(apt.getProgress()) && !"ongoing".equals(apt.getProgress())) continue;
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("appointmentId", apt.getId());
            map.put("problem", apt.getProblem());
            map.put("doctorname", apt.getDoctorname());
            map.put("slotDate", apt.getSlotDate());
            map.put("slotTime", apt.getSlotTime());
            map.put("time", apt.getTime());
            map.put("progress", apt.getProgress());
            map.put("consultationNotes", apt.getConsultationNotes());
            map.put("hospitalId", apt.getHospitalId());
            result.add(map);
        }
        result.sort((a, b) -> {
            String dA = (String) a.getOrDefault("slotDate", (String) a.getOrDefault("time", ""));
            String dB = (String) b.getOrDefault("slotDate", (String) b.getOrDefault("time", ""));
            return dB.compareTo(dA); // desc
        });
        return result;
    }

    public List<Map<String, Object>> searchPatients(String query) {
        List<Patient> patients = patientRepository.findByNameContainingIgnoreCase(query);
        return patients.stream().limit(10).map(p -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", p.getId());
            map.put("name", p.getName());
            map.put("email", p.getEmail());
            map.put("age", p.getAge());
            map.put("gender", p.getGender());
            map.put("mobile", p.getMobile());
            return map;
        }).collect(Collectors.toList());
    }

    public Map<String, Object> getWeeklySchedule(String doctorId) {
        var doc = doctorRepository.findById(doctorId).orElseThrow(() -> new RuntimeException("Doctor not found"));
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDate currentMonday = LocalDate.now().with(DayOfWeek.MONDAY);
        LocalDate nextMonday = currentMonday.plusDays(7);

        String weekStart = doc.getScheduleWeekStart();
        boolean locked = weekStart != null && !LocalDate.parse(weekStart).isBefore(currentMonday);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("schedule", doc.getWeeklySchedule() != null ? doc.getWeeklySchedule() : new HashMap<>());
        result.put("weekStart", weekStart);
        result.put("currentWeekStart", currentMonday.format(fmt));
        result.put("locked", locked);
        result.put("unlocksOn", nextMonday.format(fmt));
        return result;
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> saveWeeklySchedule(String doctorId, Map<String, Object> schedule) {
        var doc = doctorRepository.findById(doctorId).orElseThrow(() -> new RuntimeException("Doctor not found"));

        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDate today = LocalDate.now();
        LocalDate currentMonday = today.with(DayOfWeek.MONDAY);
        LocalDate nextMonday = currentMonday.plusDays(7);

        // Lock check: if the saved schedule already applies to the current week or later, reject.
        if (doc.getScheduleWeekStart() != null) {
            LocalDate savedWeek = LocalDate.parse(doc.getScheduleWeekStart());
            if (!savedWeek.isBefore(currentMonday)) {
                return Map.of(
                        "success", false,
                        "locked", true,
                        "message", "Schedule for this week is locked. You can set next week's schedule on " + nextMonday.format(fmt) + ".",
                        "unlocksOn", nextMonday.format(fmt)
                );
            }
        }

        doc.setWeeklySchedule(schedule);
        doc.setScheduleWeekStart(currentMonday.format(fmt));
        doctorRepository.save(doc);

        String[] dayNames = {"monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"};
        int totalSlots = 0;

        // Generate slots only for the 7 days of the current week (skip past days).
        for (int d = 0; d < 7; d++) {
            LocalDate date = currentMonday.plusDays(d);
            if (date.isBefore(today)) continue;
            DayOfWeek dow = date.getDayOfWeek();
            int dayIdx = dow.getValue() - 1;
            String dayName = dayNames[dayIdx];

            Object dayObj = schedule.get(dayName);
            if (dayObj instanceof Map) {
                Map<String, Object> daySchedule = (Map<String, Object>) dayObj;
                Object activeObj = daySchedule.get("active");
                boolean active = activeObj instanceof Boolean ? (Boolean) activeObj : "true".equals(String.valueOf(activeObj));
                if (active) {
                    String start = (String) daySchedule.getOrDefault("start", "09:00");
                    String end = (String) daySchedule.getOrDefault("end", "17:00");
                    var slots = slotService.generateSlots(doctorId, doc.getHospitalId(), date.format(fmt), start, end);
                    totalSlots += slots.size();
                }
            }
        }

        return Map.of(
                "success", true,
                "message", "Schedule saved for this week",
                "slotsGenerated", totalSlots,
                "weekStart", currentMonday.format(fmt),
                "unlocksOn", nextMonday.format(fmt),
                "locked", true
        );
    }

    private Map<String, Object> appointmentToMap(Appointment apt) {
        Map<String, Object> map = new HashMap<>();
        map.put("_id", apt.getId());
        map.put("progress", apt.getProgress());
        map.put("presentDoctorIds", apt.getPresentDoctorIds());
        map.put("appointedDoctorId", apt.getAppointedDoctorId());
        map.put("patientname", apt.getPatientname());
        map.put("doctorname", apt.getDoctorname());
        map.put("problem", apt.getProblem());
        map.put("time", apt.getTime());
        map.put("reviewed", apt.getReviewed());
        return map;
    }
}
