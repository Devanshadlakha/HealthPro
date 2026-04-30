package com.healthpro.doctorappointment.service;

import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendEmail(String to, String subject, String htmlBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);
            helper.setFrom("no-reply@doctorapp.com");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send email", e);
        }
    }

    public void sendVerificationEmail(String to, String token, String frontendUrl) {
        String link = frontendUrl + "/verify-email?token=" + token;
        String html = "<h2>Email Verification</h2>"
                + "<p>Click the link below to verify your email:</p>"
                + "<a href=\"" + link + "\">Verify Email</a>";
        sendEmail(to, "Verify your email", html);
    }

    public void sendDoctorAppointmentReminder(String to, String doctorName, String patientName,
                                              String problem, String slotTime, String frontendUrl) {
        String html = "<h2>Upcoming appointment in ~30 minutes</h2>"
                + "<p>Hi Dr. " + escape(doctorName) + ",</p>"
                + "<p>You have an appointment starting at <b>" + escape(slotTime) + "</b>.</p>"
                + "<ul>"
                + "<li><b>Patient:</b> " + escape(patientName) + "</li>"
                + (problem != null && !problem.isBlank() ? "<li><b>Problem:</b> " + escape(problem) + "</li>" : "")
                + "</ul>"
                + "<p><a href=\"" + frontendUrl + "/doctor\">Open today's queue</a></p>";
        sendEmail(to, "Appointment reminder: " + slotTime, html);
    }

    private static String escape(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }

    public void sendPasswordResetEmail(String to, String token, String frontendUrl, String userType) {
        // Path segment satisfies the dynamic route; query string is what the page actually reads.
        String link = frontendUrl + "/auth/reset-password/" + token + "?type=" + userType + "&token=" + token;
        String html = "<h2>Password Reset</h2>"
                + "<p>This link is valid for 30 minutes and can be used once.</p>"
                + "<p>Click the link below to reset your password:</p>"
                + "<a href=\"" + link + "\">Reset Password</a>"
                + "<p>If you did not request this, ignore this email.</p>";
        sendEmail(to, "Reset your password", html);
    }
}
