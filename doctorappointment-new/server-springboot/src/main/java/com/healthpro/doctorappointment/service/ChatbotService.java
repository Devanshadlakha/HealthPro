package com.healthpro.doctorappointment.service;

import com.healthpro.doctorappointment.model.Doctor;
import com.healthpro.doctorappointment.model.Hospital;
import com.healthpro.doctorappointment.repository.DoctorRepository;
import com.healthpro.doctorappointment.repository.HospitalRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class ChatbotService {

    private final DoctorRepository doctorRepository;
    private final HospitalRepository hospitalRepository;
    private final WebClient webClient;

    @Value("${chatbot.api-key:}")
    private String apiKey;

    @Value("${chatbot.api-url:}")
    private String apiUrl;

    public ChatbotService(DoctorRepository doctorRepository, HospitalRepository hospitalRepository) {
        this.doctorRepository = doctorRepository;
        this.hospitalRepository = hospitalRepository;
        this.webClient = WebClient.builder().build();
    }

    public Map<String, Object> processMessage(String userMessage) {
        // Build context about available doctors and hospitals
        List<Doctor> doctors = doctorRepository.findAll().stream()
                .filter(d -> d.getHospitalId() != null)
                .collect(Collectors.toList());
        List<Hospital> hospitals = hospitalRepository.findByActiveTrue();

        Map<String, String> hospitalNames = new HashMap<>();
        for (Hospital h : hospitals) {
            hospitalNames.put(h.getId(), h.getName() + " (" + h.getCity() + ")");
        }

        StringBuilder context = new StringBuilder();
        context.append("Available doctors and hospitals:\n");
        for (Doctor d : doctors) {
            String hospName = hospitalNames.getOrDefault(d.getHospitalId(), "Unknown Hospital");
            context.append(String.format("- %s | %s | %s | %d yrs exp | ₹%d | Hospital: %s\n",
                    d.getName(), d.getSpecialization(), d.getDesignation(),
                    d.getExperience(), d.getFees(), hospName));
        }

        String systemPrompt = "You are a healthcare assistant for HealthPro, a hospital booking platform. " +
                "Help patients find the right doctor based on their symptoms. " +
                "Recommend specific doctors from our platform with their details. " +
                "Be empathetic, professional, and concise. " +
                "If they describe symptoms, recommend relevant specialists. " +
                "Always include the doctor's name, specialization, hospital, and fees in recommendations.\n\n" +
                context;

        // If API key is not configured, use a fallback rule-based response
        if (apiKey == null || apiKey.isEmpty()) {
            return generateFallbackResponse(userMessage, doctors, hospitalNames);
        }

        try {
            // Call Gemini API
            Map<String, Object> requestBody = new HashMap<>();
            List<Map<String, Object>> contents = new ArrayList<>();

            Map<String, Object> systemPart = Map.of("role", "user",
                    "parts", List.of(Map.of("text", systemPrompt + "\n\nUser: " + userMessage)));
            contents.add(systemPart);
            requestBody.put("contents", contents);

            String response = webClient.post()
                    .uri(apiUrl + "?key=" + apiKey)
                    .header("Content-Type", "application/json")
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .map(responseMap -> {
                        try {
                            List<Map<String, Object>> candidates = (List<Map<String, Object>>) responseMap.get("candidates");
                            if (candidates != null && !candidates.isEmpty()) {
                                Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
                                List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
                                return (String) parts.get(0).get("text");
                            }
                        } catch (Exception e) {
                            // ignore parsing errors
                        }
                        return "I apologize, I couldn't process your request. Please try again.";
                    })
                    .block();

            return Map.of("message", response, "success", true);
        } catch (Exception e) {
            return generateFallbackResponse(userMessage, doctors, hospitalNames);
        }
    }

    private Map<String, Object> generateFallbackResponse(String userMessage, List<Doctor> doctors,
                                                          Map<String, String> hospitalNames) {
        String msg = userMessage.toLowerCase();
        String specialization = null;

        if (msg.contains("heart") || msg.contains("chest") || msg.contains("cardiac")) {
            specialization = "Cardiology";
        } else if (msg.contains("bone") || msg.contains("joint") || msg.contains("fracture") || msg.contains("knee")) {
            specialization = "Orthopedics";
        } else if (msg.contains("skin") || msg.contains("rash") || msg.contains("acne")) {
            specialization = "Dermatology";
        } else if (msg.contains("brain") || msg.contains("headache") || msg.contains("migraine") || msg.contains("nerve")) {
            specialization = "Neurology";
        } else if (msg.contains("child") || msg.contains("baby") || msg.contains("kid") || msg.contains("pediatr")) {
            specialization = "Pediatrics";
        } else if (msg.contains("eye") || msg.contains("vision") || msg.contains("sight")) {
            specialization = "Ophthalmology";
        } else if (msg.contains("stomach") || msg.contains("digest") || msg.contains("gastro") || msg.contains("abdomen")) {
            specialization = "Gastroenterology";
        } else if (msg.contains("pregnan") || msg.contains("gynec") || msg.contains("women")) {
            specialization = "Gynecology";
        } else if (msg.contains("cancer") || msg.contains("tumor")) {
            specialization = "Oncology";
        } else if (msg.contains("lung") || msg.contains("breath") || msg.contains("cough") || msg.contains("asthma")) {
            specialization = "Pulmonology";
        } else if (msg.contains("kidney") || msg.contains("urin")) {
            specialization = "Urology";
        } else if (msg.contains("fever") || msg.contains("cold") || msg.contains("general") || msg.contains("flu")) {
            specialization = "General Medicine";
        }

        List<Map<String, Object>> recommendations = new ArrayList<>();
        String responseMsg;

        if (specialization != null) {
            String spec = specialization;
            List<Doctor> matching = doctors.stream()
                    .filter(d -> d.getSpecialization().toLowerCase().contains(spec.toLowerCase()))
                    .limit(3)
                    .collect(Collectors.toList());

            if (!matching.isEmpty()) {
                responseMsg = "Based on your symptoms, I recommend consulting a " + spec + " specialist. Here are some options:";
                for (Doctor d : matching) {
                    Map<String, Object> rec = new LinkedHashMap<>();
                    rec.put("doctorId", d.getId());
                    rec.put("name", d.getName());
                    rec.put("specialization", d.getSpecialization());
                    rec.put("hospital", hospitalNames.getOrDefault(d.getHospitalId(), ""));
                    rec.put("fees", d.getFees());
                    rec.put("experience", d.getExperience());
                    recommendations.add(rec);
                }
            } else {
                responseMsg = "I recommend consulting a " + spec + " specialist. Unfortunately, we don't have one available right now. Please check back later.";
            }
        } else {
            responseMsg = "I'd be happy to help you find the right doctor. Could you describe your symptoms in more detail? For example:\n" +
                    "- Heart or chest related issues\n" +
                    "- Bone or joint pain\n" +
                    "- Skin problems\n" +
                    "- Headache or neurological issues\n" +
                    "- Stomach or digestive problems\n" +
                    "- Eye or vision issues\n" +
                    "- Breathing difficulties";
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("message", responseMsg);
        result.put("recommendations", recommendations);
        result.put("success", true);
        return result;
    }
}
