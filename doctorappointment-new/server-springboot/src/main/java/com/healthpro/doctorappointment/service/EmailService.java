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

    public void sendPasswordResetEmail(String to, String token, String frontendUrl) {
        String link = frontendUrl + "/reset-password?token=" + token;
        String html = "<h2>Password Reset</h2>"
                + "<p>Click the link below to reset your password:</p>"
                + "<a href=\"" + link + "\">Reset Password</a>";
        sendEmail(to, "Reset your password", html);
    }
}
