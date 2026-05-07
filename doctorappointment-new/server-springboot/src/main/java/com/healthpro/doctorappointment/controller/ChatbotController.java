package com.healthpro.doctorappointment.controller;

import com.healthpro.doctorappointment.service.ChatbotService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/chatbot")
public class ChatbotController {

    private final ChatbotService chatbotService;

    public ChatbotController(ChatbotService chatbotService) {
        this.chatbotService = chatbotService;
    }

    @PostMapping("/message")
    public ResponseEntity<Map<String, Object>> chat(@RequestBody Map<String, String> body,
                                                    HttpServletRequest request) {
        String message = body.get("message");
        if (message == null || message.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Message cannot be empty", "success", false));
        }
        String userId = (String) request.getAttribute("userId");
        return ResponseEntity.ok(chatbotService.processMessage(message.trim(), userId));
    }
}
