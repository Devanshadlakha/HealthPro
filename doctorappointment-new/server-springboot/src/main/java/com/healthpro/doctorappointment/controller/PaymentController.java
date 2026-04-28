package com.healthpro.doctorappointment.controller;

import com.healthpro.doctorappointment.service.PaymentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/payment")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/create-order")
    public ResponseEntity<?> createOrder(@RequestBody Map<String, Object> body) {
        String appointmentId = (String) body.get("appointmentId");
        return ResponseEntity.ok(paymentService.createOrder(appointmentId));
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verifyPayment(@RequestBody Map<String, Object> body) {
        String orderId = (String) body.get("razorpay_order_id");
        String paymentId = (String) body.get("razorpay_payment_id");
        String signature = (String) body.get("razorpay_signature");
        return ResponseEntity.ok(paymentService.verifyPayment(orderId, paymentId, signature));
    }

    @PostMapping("/webhook")
    public ResponseEntity<String> handleWebhook(
            @RequestBody String payload,
            @RequestHeader(value = "X-Razorpay-Signature", required = false) String signature) {
        paymentService.handleWebhook(payload, signature);
        return ResponseEntity.ok("OK");
    }
}
