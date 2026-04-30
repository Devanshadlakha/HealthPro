package com.healthpro.doctorappointment.scheduler;

import com.healthpro.doctorappointment.model.Appointment;
import com.healthpro.doctorappointment.model.Doctor;
import com.healthpro.doctorappointment.repository.AppointmentRepository;
import com.healthpro.doctorappointment.repository.DoctorRepository;
import com.healthpro.doctorappointment.service.EmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Emails doctors a reminder roughly 30 minutes before each upcoming appointment.
 *
 * Implementation notes:
 *  - In-memory only; for multi-instance deployments use a distributed lock or move
 *    the reminder loop to a dedicated worker.
 *  - Time comparisons use the JVM's default zone. The slotTime is stored as a wall-clock
 *    string ("HH:mm") so we treat it relative to {@link ZoneId#systemDefault()}.
 */
@Component
public class AppointmentReminderScheduler {

    private static final Logger log = LoggerFactory.getLogger(AppointmentReminderScheduler.class);
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm");
    private static final List<String> REMINDABLE_PROGRESS = List.of("ongoing", "approved");

    private final AppointmentRepository appointmentRepository;
    private final DoctorRepository doctorRepository;
    private final EmailService emailService;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Value("${app.reminder.lead-minutes:30}")
    private long leadMinutes;

    public AppointmentReminderScheduler(AppointmentRepository appointmentRepository,
                                        DoctorRepository doctorRepository,
                                        EmailService emailService) {
        this.appointmentRepository = appointmentRepository;
        this.doctorRepository = doctorRepository;
        this.emailService = emailService;
    }

    @Scheduled(fixedRateString = "${app.reminder.poll-rate-ms:300000}") // 5 min default
    public void dispatchReminders() {
        String today = LocalDate.now().format(DATE_FMT);
        LocalTime now = LocalTime.now();
        LocalTime cutoff = now.plusMinutes(leadMinutes);

        List<Appointment> candidates = appointmentRepository
                .findBySlotDateAndReminderSentAtIsNullAndProgressIn(today, REMINDABLE_PROGRESS);

        int sent = 0;
        for (Appointment apt : candidates) {
            String slotTime = apt.getSlotTime();
            if (slotTime == null || slotTime.isBlank()) continue;

            LocalTime slot;
            try {
                slot = LocalTime.parse(slotTime, TIME_FMT);
            } catch (Exception e) {
                continue;
            }
            // Window: slot is between now and (now + leadMinutes). Skip past slots silently.
            if (slot.isBefore(now) || slot.isAfter(cutoff)) continue;
            if (apt.getAppointedDoctorId() == null || apt.getAppointedDoctorId().isEmpty()) continue;

            String doctorId = apt.getAppointedDoctorId().get(0);
            Doctor doctor = doctorRepository.findById(doctorId).orElse(null);
            if (doctor == null || doctor.getEmail() == null) continue;

            try {
                emailService.sendDoctorAppointmentReminder(
                        doctor.getEmail(),
                        doctor.getName(),
                        apt.getPatientname(),
                        apt.getProblem(),
                        slotTime,
                        frontendUrl
                );
                apt.setReminderSentAt(Instant.now());
                appointmentRepository.save(apt);
                sent++;
            } catch (Exception e) {
                log.error("Failed to send reminder for appointment {}", apt.getId(), e);
            }
        }
        if (sent > 0) {
            log.info("Dispatched {} appointment reminder(s)", sent);
        }
    }
}
