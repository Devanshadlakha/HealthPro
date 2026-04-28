package com.healthpro.doctorappointment.service;

import com.healthpro.doctorappointment.model.Appointment;
import com.healthpro.doctorappointment.model.Doctor;
import com.healthpro.doctorappointment.model.Hospital;
import com.healthpro.doctorappointment.model.Patient;
import com.healthpro.doctorappointment.model.Rating;
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

    public PatientAppointmentService(AppointmentRepository appointmentRepository,
                                      DoctorRepository doctorRepository,
                                      PatientRepository patientRepository,
                                      HospitalRepository hospitalRepository) {
        this.appointmentRepository = appointmentRepository;
        this.doctorRepository = doctorRepository;
        this.patientRepository = patientRepository;
        this.hospitalRepository = hospitalRepository;
    }

    public Appointment createAppointment(String userId, Map<String, Object> body) {
        String problem = (String) body.get("problem");
        String time = (String) body.get("time");
        String patientname = (String) body.get("patientname");

        Appointment apt = new Appointment();
        apt.setPatientId(new ArrayList<>(List.of(userId)));
        apt.setTime(time);
        apt.setProblem(problem);
        apt.setProgress("toaccept");
        apt.setReviewed(false);
        apt.setAppointedDoctorId(new ArrayList<>());
        apt.setPresentDoctorIds(new ArrayList<>());
        apt.setDoctorname("");
        apt.setPatientname(patientname);

        return appointmentRepository.save(apt);
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

    public Appointment acceptDoctor(String doctorId, String appointmentId) {
        var aptOpt = appointmentRepository.findById(appointmentId);
        if (aptOpt.isEmpty()) {
            throw new RuntimeException("Appointment not found");
        }

        Appointment apt = aptOpt.get();
        apt.setAppointedDoctorId(new ArrayList<>(List.of(doctorId)));
        apt.setPresentDoctorIds(new ArrayList<>());
        apt.setProgress("ongoing");
        return appointmentRepository.save(apt);
    }

    public Map<String, Object> reviewDoctor(String userId, Map<String, Object> body) {
        String appointmentId = (String) body.get("appointmentId");
        int rating = Integer.parseInt(body.get("rating").toString());
        String message = (String) body.get("message");

        if (rating < 1 || rating > 5) {
            return Map.of("error", "Rating must be between 1 and 5.");
        }

        var aptOpt = appointmentRepository.findById(appointmentId);
        if (aptOpt.isEmpty()) {
            return Map.of("error", "Appointment not found.");
        }

        Appointment appointment = aptOpt.get();

        // Check if patient owns this appointment
        boolean isOwner = appointment.getPatientId().stream()
                .anyMatch(pid -> pid.equals(userId));
        if (!isOwner) {
            return Map.of("error", "You are not authorized to review this appointment.");
        }

        if (appointment.getReviewed() != null && appointment.getReviewed()) {
            return Map.of("error", "This appointment has already been reviewed.");
        }

        // Find doctor
        if (appointment.getAppointedDoctorId() == null || appointment.getAppointedDoctorId().isEmpty()) {
            return Map.of("error", "Doctor not found.");
        }

        String doctorId = appointment.getAppointedDoctorId().get(0);
        var doctorOpt = doctorRepository.findById(doctorId);
        if (doctorOpt.isEmpty()) {
            return Map.of("error", "Doctor not found.");
        }

        Doctor doctor = doctorOpt.get();
        Rating newReview = new Rating(appointmentId, appointment.getPatientname(), rating, message);
        doctor.getRating().add(newReview);
        doctorRepository.save(doctor);

        appointment.setReviewed(true);
        appointmentRepository.save(appointment);

        return Map.of("message", "Review submitted successfully.", "doctor", doctor);
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

    private Map<String, Object> appointmentToMap(Appointment apt) {
        Map<String, Object> map = new HashMap<>();
        map.put("_id", apt.getId());
        map.put("progress", apt.getProgress());
        map.put("presentDoctorIds", apt.getPresentDoctorIds());
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
        return map;
    }
}
