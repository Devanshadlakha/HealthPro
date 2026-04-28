package com.healthpro.doctorappointment.service;

import com.healthpro.doctorappointment.model.Appointment;
import com.healthpro.doctorappointment.model.Doctor;
import com.healthpro.doctorappointment.model.TimeSlot;
import com.healthpro.doctorappointment.repository.AppointmentRepository;
import com.healthpro.doctorappointment.repository.DoctorRepository;
import com.healthpro.doctorappointment.repository.TimeSlotRepository;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class SlotService {

    private final TimeSlotRepository timeSlotRepository;
    private final AppointmentRepository appointmentRepository;
    private final DoctorRepository doctorRepository;
    private final MongoTemplate mongoTemplate;

    public SlotService(TimeSlotRepository timeSlotRepository,
                       AppointmentRepository appointmentRepository,
                       DoctorRepository doctorRepository,
                       MongoTemplate mongoTemplate) {
        this.timeSlotRepository = timeSlotRepository;
        this.appointmentRepository = appointmentRepository;
        this.doctorRepository = doctorRepository;
        this.mongoTemplate = mongoTemplate;
    }

    public List<TimeSlot> getSlotsForDoctorOnDate(String doctorId, String date) {
        return timeSlotRepository.findByDoctorIdAndDate(doctorId, date);
    }

    public List<TimeSlot> generateSlots(String doctorId, String hospitalId, String date,
                                         String startHour, String endHour) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("HH:mm");
        LocalTime start = LocalTime.parse(startHour, formatter);
        LocalTime end = LocalTime.parse(endHour, formatter);

        // Afternoon policy: no slots between 12:00 and 15:00, no slots at/after 18:00.
        LocalTime noon = LocalTime.of(12, 0);
        LocalTime afternoonStart = LocalTime.of(15, 0);
        LocalTime afternoonEnd = LocalTime.of(18, 0);

        List<TimeSlot> created = new ArrayList<>();
        LocalTime current = start;

        while (current.plusMinutes(15).compareTo(end) <= 0) {
            boolean inLunchGap = !current.isBefore(noon) && current.isBefore(afternoonStart);
            boolean afterAfternoon = !current.isBefore(afternoonEnd);
            if (inLunchGap || afterAfternoon) {
                current = current.plusMinutes(15);
                continue;
            }

            String startTime = current.format(formatter);
            String endTime = current.plusMinutes(15).format(formatter);

            if (timeSlotRepository.findByDoctorIdAndDateAndStartTime(doctorId, date, startTime).isEmpty()) {
                TimeSlot slot = new TimeSlot();
                slot.setDoctorId(doctorId);
                slot.setHospitalId(hospitalId);
                slot.setDate(date);
                slot.setStartTime(startTime);
                slot.setEndTime(endTime);
                slot.setStatus("available");
                created.add(timeSlotRepository.save(slot));
            }
            current = current.plusMinutes(15);
        }
        return created;
    }

    /**
     * Atomically reserve a slot for a patient. Uses findAndModify to prevent race conditions.
     */
    public Map<String, Object> reserveSlot(String slotId, String patientId, String patientName,
                                            String doctorId, String doctorName) {
        Query query = new Query(Criteria.where("id").is(slotId).and("status").is("available"));
        Update update = new Update()
                .set("status", "reserved")
                .set("reservedByPatientId", patientId)
                .set("reservedAt", Instant.now());

        TimeSlot result = mongoTemplate.findAndModify(query, update,
                com.mongodb.client.model.ReturnDocument.class.isAssignableFrom(TimeSlot.class)
                        ? TimeSlot.class : TimeSlot.class);

        if (result == null) {
            return Map.of("success", false, "message", "Slot is no longer available");
        }

        // Create a pending appointment
        Appointment appointment = new Appointment();
        appointment.setProgress("pending");
        appointment.setPatientId(new ArrayList<>(List.of(patientId)));
        appointment.setPatientname(patientName);
        appointment.setAppointedDoctorId(new ArrayList<>(List.of(doctorId)));
        appointment.setDoctorname(doctorName);
        appointment.setProblem("Slot booking");
        appointment.setTime(result.getDate() + " " + result.getStartTime());
        appointment.setHospitalId(result.getHospitalId());
        appointment.setSlotId(slotId);
        appointment.setSlotDate(result.getDate());
        appointment.setSlotTime(result.getStartTime());
        appointment.setPaymentStatus("pending");
        appointment.setReviewed(false);
        Integer doctorFees = doctorRepository.findById(doctorId).map(Doctor::getFees).orElse(null);
        appointment.setFees(doctorFees);
        appointmentRepository.save(appointment);

        // Link appointment to slot
        mongoTemplate.updateFirst(
                new Query(Criteria.where("id").is(slotId)),
                new Update().set("appointmentId", appointment.getId()).set("patientId", patientId),
                TimeSlot.class
        );

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", true);
        response.put("message", "Slot reserved. Waiting for doctor approval.");
        response.put("appointmentId", appointment.getId());
        response.put("slotId", slotId);
        return response;
    }

    /**
     * Doctor approves a pending booking.
     */
    public Map<String, Object> approveBooking(String appointmentId) {
        Optional<Appointment> opt = appointmentRepository.findById(appointmentId);
        if (opt.isEmpty()) {
            return Map.of("success", false, "message", "Appointment not found");
        }

        Appointment appointment = opt.get();
        if (!"pending".equals(appointment.getProgress())) {
            return Map.of("success", false, "message", "Appointment is not in pending state");
        }

        appointment.setProgress("approved");
        appointmentRepository.save(appointment);

        return Map.of("success", true, "message", "Booking approved. Patient can now proceed with payment.",
                "appointmentId", appointmentId);
    }

    /**
     * Doctor rejects a pending booking.
     */
    public Map<String, Object> rejectBooking(String appointmentId) {
        Optional<Appointment> opt = appointmentRepository.findById(appointmentId);
        if (opt.isEmpty()) {
            return Map.of("success", false, "message", "Appointment not found");
        }

        Appointment appointment = opt.get();
        // Revert the slot to available
        if (appointment.getSlotId() != null) {
            mongoTemplate.updateFirst(
                    new Query(Criteria.where("id").is(appointment.getSlotId())),
                    new Update().set("status", "available")
                            .unset("reservedByPatientId").unset("reservedAt")
                            .unset("appointmentId").unset("patientId"),
                    TimeSlot.class
            );
        }

        appointment.setProgress("rejected");
        appointmentRepository.save(appointment);

        return Map.of("success", true, "message", "Booking rejected. Slot is now available.");
    }

    /**
     * Confirm booking after successful payment.
     */
    public void confirmBooking(String appointmentId, String razorpayPaymentId) {
        Optional<Appointment> opt = appointmentRepository.findById(appointmentId);
        if (opt.isPresent()) {
            Appointment appointment = opt.get();
            appointment.setProgress("ongoing");
            appointment.setPaymentStatus("paid");
            appointment.setRazorpayPaymentId(razorpayPaymentId);
            appointmentRepository.save(appointment);

            // Mark slot as booked
            if (appointment.getSlotId() != null) {
                mongoTemplate.updateFirst(
                        new Query(Criteria.where("id").is(appointment.getSlotId())),
                        new Update().set("status", "booked"),
                        TimeSlot.class
                );
            }
        }
    }

    /**
     * Revert booking on payment failure.
     */
    public void failBooking(String appointmentId) {
        Optional<Appointment> opt = appointmentRepository.findById(appointmentId);
        if (opt.isPresent()) {
            Appointment appointment = opt.get();
            appointment.setPaymentStatus("failed");
            appointment.setProgress("failed");
            appointmentRepository.save(appointment);

            // Revert slot
            if (appointment.getSlotId() != null) {
                mongoTemplate.updateFirst(
                        new Query(Criteria.where("id").is(appointment.getSlotId())),
                        new Update().set("status", "available")
                                .unset("reservedByPatientId").unset("reservedAt")
                                .unset("appointmentId").unset("patientId"),
                        TimeSlot.class
                );
            }
        }
    }

    /**
     * Get pending bookings for a doctor.
     */
    public List<Appointment> getPendingBookings(String doctorId) {
        return appointmentRepository.findByAppointedDoctorIdContainingAndProgress(doctorId, "pending");
    }
}
