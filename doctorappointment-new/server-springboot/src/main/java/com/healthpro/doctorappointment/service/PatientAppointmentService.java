package com.healthpro.doctorappointment.service;

import com.healthpro.doctorappointment.model.Appointment;
import com.healthpro.doctorappointment.model.Doctor;
import com.healthpro.doctorappointment.model.Patient;
import com.healthpro.doctorappointment.repository.AppointmentRepository;
import com.healthpro.doctorappointment.repository.DoctorRepository;
import com.healthpro.doctorappointment.repository.HospitalRepository;
import com.healthpro.doctorappointment.repository.PatientRepository;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class PatientAppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final HospitalRepository hospitalRepository;
    private final ReviewService reviewService;

    public PatientAppointmentService(AppointmentRepository appointmentRepository,
                                      DoctorRepository doctorRepository,
                                      PatientRepository patientRepository,
                                      HospitalRepository hospitalRepository,
                                      ReviewService reviewService) {
        this.appointmentRepository = appointmentRepository;
        this.doctorRepository = doctorRepository;
        this.patientRepository = patientRepository;
        this.hospitalRepository = hospitalRepository;
        this.reviewService = reviewService;
    }

    public List<Map<String, Object>> getPatientAppointments(String userId) {
        // Find all appointments for this patient (excluding done, rejected, failed)
        List<Appointment> all = appointmentRepository.findByPatientIdContaining(userId);
        List<Appointment> appointments = new ArrayList<>();
        for (Appointment a : all) {
            String p = a.getProgress();
            if (!"done".equals(p) && !"rejected".equals(p) && !"failed".equals(p)) {
                appointments.add(a);
            }
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (Appointment apt : appointments) {
            Map<String, Object> map = appointmentToMap(apt);

            // Populate doctor info
            if (apt.getAppointedDoctorId() != null && !apt.getAppointedDoctorId().isEmpty()) {
                String doctorIdStr = apt.getAppointedDoctorId().get(0);
                var doctorOpt = doctorRepository.findById(doctorIdStr);
                if (doctorOpt.isPresent()) {
                    Doctor doc = doctorOpt.get();
                    map.put("doctorName", doc.getName());
                    map.put("appointedDoctorId", doc.getId());
                    map.put("specialization", doc.getSpecialization());
                    map.put("fees", doc.getFees());
                } else {
                    map.put("doctorName", "No doctor assigned");
                    map.put("appointedDoctorId", null);
                }
            } else {
                map.put("doctorName", "No doctor assigned");
                map.put("appointedDoctorId", null);
            }

            // Populate hospital name
            if (apt.getHospitalId() != null) {
                var hospOpt = hospitalRepository.findById(apt.getHospitalId());
                hospOpt.ifPresent(h -> map.put("hospitalName", h.getName()));
            }

            result.add(map);
        }
        return result;
    }

    public Map<String, Object> reviewDoctor(String userId, Map<String, Object> body) {
        String appointmentId = (String) body.get("appointmentId");
        int rating = Integer.parseInt(body.get("rating").toString());
        String message = (String) body.get("message");
        return reviewService.submitReview(userId, appointmentId, rating, message);
    }

    public List<Appointment> getPastAppointments(String userId) {
        List<Appointment> appointments = appointmentRepository.findByPatientIdContainingAndProgress(userId, "done");
        // Enrich with doctor names
        for (Appointment apt : appointments) {
            if (apt.getAppointedDoctorId() != null && !apt.getAppointedDoctorId().isEmpty()) {
                var doctorOpt = doctorRepository.findById(apt.getAppointedDoctorId().get(0));
                doctorOpt.ifPresent(doctor -> apt.setDoctorname(doctor.getName()));
            }
        }
        return appointments;
    }

    public Map<String, Object> getUserProfile(String patientId) {
        var patientOpt = patientRepository.findById(patientId);
        if (patientOpt.isEmpty()) {
            throw new RuntimeException("Patient not found");
        }
        Patient patient = patientOpt.get();
        Map<String, Object> profile = new HashMap<>();
        profile.put("_id", patient.getId());
        profile.put("name", patient.getName());
        profile.put("email", patient.getEmail());
        profile.put("mobile", patient.getMobile());
        profile.put("age", patient.getAge());
        profile.put("dob", patient.getDob());
        profile.put("gender", patient.getGender());
        return Map.of("user", profile);
    }

    public Map<String, Object> addAttachment(String appointmentId, String userId, String url) {
        var aptOpt = appointmentRepository.findById(appointmentId);
        if (aptOpt.isEmpty()) return Map.of("success", false, "message", "Appointment not found");
        Appointment apt = aptOpt.get();
        if (apt.getPatientId() == null || !apt.getPatientId().contains(userId)) {
            return Map.of("success", false, "message", "Not your appointment");
        }
        if (apt.getAttachments() == null) apt.setAttachments(new ArrayList<>());
        apt.getAttachments().add(url);
        appointmentRepository.save(apt);
        return Map.of("success", true, "url", url, "attachments", apt.getAttachments());
    }

    private Map<String, Object> appointmentToMap(Appointment apt) {
        Map<String, Object> map = new HashMap<>();
        map.put("_id", apt.getId());
        map.put("progress", apt.getProgress());
        map.put("patientId", apt.getPatientId());
        map.put("patientname", apt.getPatientname());
        map.put("doctorname", apt.getDoctorname());
        map.put("problem", apt.getProblem());
        map.put("time", apt.getTime());
        map.put("reviewed", apt.getReviewed());
        map.put("slotDate", apt.getSlotDate());
        map.put("slotTime", apt.getSlotTime());
        map.put("paymentStatus", apt.getPaymentStatus());
        map.put("hospitalId", apt.getHospitalId());
        map.put("prescriptions", apt.getPrescriptions());
        map.put("attachments", apt.getAttachments());
        map.put("pendingChange", apt.getPendingChange());
        map.put("requestedSlotDate", apt.getRequestedSlotDate());
        map.put("requestedSlotTime", apt.getRequestedSlotTime());
        map.put("videoCallApproved", Boolean.TRUE.equals(apt.getVideoCallApproved()));
        map.put("videoCallStarted", Boolean.TRUE.equals(apt.getVideoCallStarted()));
        return map;
    }
}
