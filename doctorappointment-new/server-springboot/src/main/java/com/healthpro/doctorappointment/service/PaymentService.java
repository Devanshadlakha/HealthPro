package com.healthpro.doctorappointment.service;

import com.healthpro.doctorappointment.model.Appointment;
import com.healthpro.doctorappointment.repository.AppointmentRepository;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Utils;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentService.class);

    @Value("${razorpay.key-id}")
    private String razorpayKeyId;

    @Value("${razorpay.key-secret}")
    private String razorpayKeySecret;

    @Value("${razorpay.webhook-secret:}")
    private String razorpayWebhookSecret;

    private final AppointmentRepository appointmentRepository;
    private final SlotService slotService;

    public PaymentService(AppointmentRepository appointmentRepository, SlotService slotService) {
        this.appointmentRepository = appointmentRepository;
        this.slotService = slotService;
    }

    public Map<String, Object> createOrder(String appointmentId) {
        Optional<Appointment> opt = appointmentRepository.findById(appointmentId);
        if (opt.isEmpty()) {
            return Map.of("success", false, "message", "Appointment not found");
        }

        Appointment appointment = opt.get();
        if (!"approved".equals(appointment.getProgress())) {
            return Map.of("success", false, "message", "Appointment is not approved yet");
        }

        Integer fees = appointment.getFees();
        if (fees == null || fees <= 0) {
            return Map.of("success", false, "message", "Consultation fees not set for this appointment");
        }

        try {
            RazorpayClient client = new RazorpayClient(razorpayKeyId, razorpayKeySecret);

            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", fees * 100); // paise
            orderRequest.put("currency", "INR");
            orderRequest.put("receipt", "appt_" + appointmentId);

            Order order = client.orders.create(orderRequest);

            // Save order ID to appointment
            appointment.setRazorpayOrderId(order.get("id"));
            appointmentRepository.save(appointment);

            Map<String, Object> response = new LinkedHashMap<>();
            response.put("success", true);
            response.put("orderId", order.get("id"));
            response.put("amount", order.get("amount"));
            response.put("currency", "INR");
            response.put("keyId", razorpayKeyId);
            return response;
        } catch (RazorpayException e) {
            log.error("createOrder failed", e);
            return Map.of("success", false, "message", "Failed to create payment order");
        }
    }

    public Map<String, Object> verifyPayment(String orderId, String paymentId, String signature) {
        try {
            JSONObject attributes = new JSONObject();
            attributes.put("razorpay_order_id", orderId);
            attributes.put("razorpay_payment_id", paymentId);
            attributes.put("razorpay_signature", signature);

            boolean isValid = Utils.verifyPaymentSignature(attributes, razorpayKeySecret);

            if (isValid) {
                Optional<Appointment> opt = appointmentRepository.findByRazorpayOrderId(orderId);
                if (opt.isPresent()) {
                    slotService.confirmBooking(opt.get().getId(), paymentId);
                    return Map.of("success", true, "message", "Payment verified and booking confirmed");
                }
                return Map.of("success", false, "message", "Appointment not found for this order");
            } else {
                return Map.of("success", false, "message", "Invalid payment signature");
            }
        } catch (RazorpayException e) {
            log.error("verifyPayment failed", e);
            return Map.of("success", false, "message", "Payment verification failed");
        }
    }

    public void handleWebhook(String payload, String webhookSignature) {
        try {
            String secret = razorpayWebhookSecret != null && !razorpayWebhookSecret.isEmpty()
                    ? razorpayWebhookSecret : razorpayKeySecret;
            boolean isValid = Utils.verifyWebhookSignature(payload, webhookSignature, secret);
            if (!isValid) {
                log.warn("Rejected Razorpay webhook with invalid signature");
                return;
            }

            JSONObject event = new JSONObject(payload);
            String eventType = event.getString("event");

            if ("payment.captured".equals(eventType)) {
                JSONObject paymentEntity = event.getJSONObject("payload")
                        .getJSONObject("payment").getJSONObject("entity");
                String orderId = paymentEntity.getString("order_id");
                String paymentId = paymentEntity.getString("id");
                appointmentRepository.findByRazorpayOrderId(orderId)
                        .ifPresent(a -> slotService.confirmBooking(a.getId(), paymentId));

            } else if ("payment.failed".equals(eventType)) {
                JSONObject paymentEntity = event.getJSONObject("payload")
                        .getJSONObject("payment").getJSONObject("entity");
                String orderId = paymentEntity.getString("order_id");
                appointmentRepository.findByRazorpayOrderId(orderId)
                        .ifPresent(a -> slotService.failBooking(a.getId()));
            }
        } catch (Exception e) {
            log.error("Razorpay webhook processing failed", e);
        }
    }
}
