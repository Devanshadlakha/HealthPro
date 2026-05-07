package com.healthpro.doctorappointment.service;

import com.healthpro.doctorappointment.model.Appointment;
import com.healthpro.doctorappointment.model.Doctor;
import com.healthpro.doctorappointment.model.TimeSlot;
import com.healthpro.doctorappointment.repository.AppointmentRepository;
import com.healthpro.doctorappointment.repository.DoctorRepository;
import com.healthpro.doctorappointment.repository.TimeSlotRepository;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
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
                                            String doctorId, String doctorName,
                                            String profileId, String profileRelation) {
        Query query = new Query(Criteria.where("id").is(slotId).and("status").is("available"));
        Update update = new Update()
                .set("status", "reserved")
                .set("reservedByPatientId", patientId)
                .set("reservedAt", Instant.now());

        TimeSlot result = mongoTemplate.findAndModify(
                query,
                update,
                FindAndModifyOptions.options().returnNew(true),
                TimeSlot.class
        );

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
        appointment.setProfileId(profileId);
        appointment.setProfileRelation(profileRelation);
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
     * Confirm booking with deferred payment (pay at the clinic on visit).
     * Patient must still be in the "approved" state.
     */
    public Map<String, Object> confirmBookingPayOnVisit(String appointmentId) {
        Optional<Appointment> opt = appointmentRepository.findById(appointmentId);
        if (opt.isEmpty()) {
            return Map.of("success", false, "message", "Appointment not found");
        }
        Appointment appointment = opt.get();
        if (!"approved".equals(appointment.getProgress())) {
            return Map.of("success", false, "message", "Appointment is not approved yet");
        }

        appointment.setProgress("ongoing");
        appointment.setPaymentStatus("pay_on_visit");
        appointmentRepository.save(appointment);

        if (appointment.getSlotId() != null) {
            mongoTemplate.updateFirst(
                    new Query(Criteria.where("id").is(appointment.getSlotId())),
                    new Update().set("status", "booked"),
                    TimeSlot.class
            );
        }
        return Map.of("success", true, "message", "Booking confirmed. Pay on visit.");
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
     * Get pending bookings for a doctor — includes both new bookings (progress="pending") and
     * change requests (pendingChange != null) on already-approved appointments.
     */
    public List<Map<String, Object>> getPendingBookings(String doctorId) {
        List<Map<String, Object>> result = new ArrayList<>();
        List<Appointment> newBookings = appointmentRepository
                .findByAppointedDoctorIdContainingAndProgress(doctorId, "pending");
        for (Appointment a : newBookings) {
            result.add(toPendingMap(a, "new_booking"));
        }
        List<Appointment> changeRequests = appointmentRepository
                .findByAppointedDoctorIdContainingAndPendingChangeNotNull(doctorId);
        for (Appointment a : changeRequests) {
            result.add(toPendingMap(a, a.getPendingChange()));
        }
        return result;
    }

    private Map<String, Object> toPendingMap(Appointment a, String requestType) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", a.getId());
        m.put("patientname", a.getPatientname());
        m.put("problem", a.getProblem());
        m.put("slotDate", a.getSlotDate());
        m.put("slotTime", a.getSlotTime());
        m.put("requestType", requestType);
        if ("reschedule".equals(requestType)) {
            m.put("requestedSlotDate", a.getRequestedSlotDate());
            m.put("requestedSlotTime", a.getRequestedSlotTime());
        }
        return m;
    }

    /**
     * Doctor approves a patient-initiated change (reschedule or video_call).
     */
    public Map<String, Object> approveChange(String appointmentId) {
        Optional<Appointment> opt = appointmentRepository.findById(appointmentId);
        if (opt.isEmpty()) return Map.of("success", false, "message", "Appointment not found");
        Appointment apt = opt.get();
        String change = apt.getPendingChange();
        if (change == null) return Map.of("success", false, "message", "No pending change on this appointment");

        if ("reschedule".equals(change)) {
            String oldSlotId = apt.getSlotId();
            String newSlotId = apt.getRequestedSlotId();
            // Free the old slot
            if (oldSlotId != null) {
                mongoTemplate.updateFirst(
                        new Query(Criteria.where("id").is(oldSlotId)),
                        new Update().set("status", "available")
                                .unset("reservedByPatientId").unset("reservedAt")
                                .unset("appointmentId").unset("patientId"),
                        TimeSlot.class
                );
            }
            // Mark the new slot booked + bind appointment to it
            if (newSlotId != null) {
                mongoTemplate.updateFirst(
                        new Query(Criteria.where("id").is(newSlotId)),
                        new Update().set("status", "booked")
                                .set("appointmentId", apt.getId())
                                .set("patientId", apt.getPatientId() != null && !apt.getPatientId().isEmpty() ? apt.getPatientId().get(0) : null),
                        TimeSlot.class
                );
            }
            apt.setSlotId(newSlotId);
            apt.setSlotDate(apt.getRequestedSlotDate());
            apt.setSlotTime(apt.getRequestedSlotTime());
            apt.setTime(apt.getRequestedSlotDate() + " " + apt.getRequestedSlotTime());
        } else if ("video_call".equals(change)) {
            apt.setVideoCallApproved(true);
        }

        apt.setPendingChange(null);
        apt.setRequestedSlotId(null);
        apt.setRequestedSlotDate(null);
        apt.setRequestedSlotTime(null);
        appointmentRepository.save(apt);
        return Map.of("success", true, "message", "Change approved");
    }

    /**
     * Doctor rejects a patient-initiated change. Original appointment remains untouched.
     * For reschedule: release the requested (newly reserved) slot.
     */
    public Map<String, Object> rejectChange(String appointmentId) {
        Optional<Appointment> opt = appointmentRepository.findById(appointmentId);
        if (opt.isEmpty()) return Map.of("success", false, "message", "Appointment not found");
        Appointment apt = opt.get();
        if (apt.getPendingChange() == null) {
            return Map.of("success", false, "message", "No pending change on this appointment");
        }

        if ("reschedule".equals(apt.getPendingChange()) && apt.getRequestedSlotId() != null) {
            mongoTemplate.updateFirst(
                    new Query(Criteria.where("id").is(apt.getRequestedSlotId())),
                    new Update().set("status", "available")
                            .unset("reservedByPatientId").unset("reservedAt")
                            .unset("appointmentId").unset("patientId"),
                    TimeSlot.class
            );
        }

        apt.setPendingChange(null);
        apt.setRequestedSlotId(null);
        apt.setRequestedSlotDate(null);
        apt.setRequestedSlotTime(null);
        appointmentRepository.save(apt);
        return Map.of("success", true, "message", "Change rejected");
    }

    /**
     * Patient requests a reschedule. Atomically reserves the new slot and stores the request
     * on the appointment. Doctor must approve before it takes effect.
     */
    public Map<String, Object> requestReschedule(String appointmentId, String newSlotId, String patientId) {
        Optional<Appointment> opt = appointmentRepository.findById(appointmentId);
        if (opt.isEmpty()) return Map.of("success", false, "message", "Appointment not found");
        Appointment apt = opt.get();
        if (apt.getPatientId() == null || !apt.getPatientId().contains(patientId)) {
            return Map.of("success", false, "message", "Not your appointment");
        }
        if (apt.getPendingChange() != null) {
            return Map.of("success", false, "message", "You already have a pending request on this appointment");
        }
        if (newSlotId == null || newSlotId.equals(apt.getSlotId())) {
            return Map.of("success", false, "message", "Pick a different slot");
        }

        Query query = new Query(Criteria.where("id").is(newSlotId).and("status").is("available"));
        Update update = new Update()
                .set("status", "reserved")
                .set("reservedByPatientId", patientId)
                .set("reservedAt", Instant.now());
        TimeSlot reserved = mongoTemplate.findAndModify(
                query, update, FindAndModifyOptions.options().returnNew(true), TimeSlot.class);
        if (reserved == null) {
            return Map.of("success", false, "message", "Slot is no longer available");
        }

        apt.setPendingChange("reschedule");
        apt.setRequestedSlotId(newSlotId);
        apt.setRequestedSlotDate(reserved.getDate());
        apt.setRequestedSlotTime(reserved.getStartTime());
        appointmentRepository.save(apt);
        return Map.of("success", true, "message", "Reschedule requested. Awaiting doctor approval.");
    }

    public Map<String, Object> requestVideoCall(String appointmentId, String patientId) {
        Optional<Appointment> opt = appointmentRepository.findById(appointmentId);
        if (opt.isEmpty()) return Map.of("success", false, "message", "Appointment not found");
        Appointment apt = opt.get();
        if (apt.getPatientId() == null || !apt.getPatientId().contains(patientId)) {
            return Map.of("success", false, "message", "Not your appointment");
        }
        if (apt.getPendingChange() != null) {
            return Map.of("success", false, "message", "You already have a pending request on this appointment");
        }
        if (Boolean.TRUE.equals(apt.getVideoCallApproved())) {
            return Map.of("success", false, "message", "Video call is already approved");
        }
        apt.setPendingChange("video_call");
        appointmentRepository.save(apt);
        return Map.of("success", true, "message", "Video call requested. Awaiting doctor approval.");
    }

    /**
     * Patient cancels — frees the slot and clears any pending change.
     */
    public Map<String, Object> cancelAppointment(String appointmentId, String patientId) {
        Optional<Appointment> opt = appointmentRepository.findById(appointmentId);
        if (opt.isEmpty()) return Map.of("success", false, "message", "Appointment not found");
        Appointment apt = opt.get();
        if (apt.getPatientId() == null || !apt.getPatientId().contains(patientId)) {
            return Map.of("success", false, "message", "Not your appointment");
        }
        if ("done".equals(apt.getProgress()) || "cancelled".equals(apt.getProgress())) {
            return Map.of("success", false, "message", "Appointment cannot be cancelled in its current state");
        }
        // Free the booked slot
        if (apt.getSlotId() != null) {
            mongoTemplate.updateFirst(
                    new Query(Criteria.where("id").is(apt.getSlotId())),
                    new Update().set("status", "available")
                            .unset("reservedByPatientId").unset("reservedAt")
                            .unset("appointmentId").unset("patientId"),
                    TimeSlot.class
            );
        }
        // Free a pending reschedule slot too, if any
        if (apt.getRequestedSlotId() != null) {
            mongoTemplate.updateFirst(
                    new Query(Criteria.where("id").is(apt.getRequestedSlotId())),
                    new Update().set("status", "available")
                            .unset("reservedByPatientId").unset("reservedAt")
                            .unset("appointmentId").unset("patientId"),
                    TimeSlot.class
            );
        }
        apt.setProgress("cancelled");
        apt.setPendingChange(null);
        apt.setRequestedSlotId(null);
        apt.setRequestedSlotDate(null);
        apt.setRequestedSlotTime(null);
        appointmentRepository.save(apt);
        return Map.of("success", true, "message", "Appointment cancelled");
    }
}
