package com.healthpro.doctorappointment.service;

import com.healthpro.doctorappointment.model.Appointment;
import com.healthpro.doctorappointment.model.Doctor;
import com.healthpro.doctorappointment.model.Hospital;
import com.healthpro.doctorappointment.repository.AppointmentRepository;
import com.healthpro.doctorappointment.repository.DoctorRepository;
import com.healthpro.doctorappointment.repository.HospitalRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

/**
 * AI assistant. Falls back to rule-based replies when CHATBOT_API_KEY is blank.
 *
 * When the API key is set, uses Gemini's tool-calling protocol so the model can fetch:
 *   - get_doctor_profile(name)        — details on a specific doctor
 *   - search_hospitals(city)          — hospitals (optionally filtered by city)
 *   - search_doctors(specialization)  — doctors by specialization
 *   - get_my_past_appointments()      — current user's past visits with prescriptions
 *   - get_my_upcoming_appointments()  — current user's pending/approved/ongoing visits
 *   - recommend_doctor(symptoms)      — symptom → specialty → doctor list (existing flow)
 *
 * Each tool result is folded back into the conversation until the model produces a final text reply.
 */
@Service
public class ChatbotService {

    private static final Logger log = LoggerFactory.getLogger(ChatbotService.class);
    private static final int MAX_TOOL_HOPS = 4;

    private final DoctorRepository doctorRepository;
    private final HospitalRepository hospitalRepository;
    private final AppointmentRepository appointmentRepository;
    private final WebClient webClient;

    @Value("${chatbot.api-key:}")
    private String apiKey;

    @Value("${chatbot.api-url:}")
    private String apiUrl;

    public ChatbotService(DoctorRepository doctorRepository,
                          HospitalRepository hospitalRepository,
                          AppointmentRepository appointmentRepository) {
        this.doctorRepository = doctorRepository;
        this.hospitalRepository = hospitalRepository;
        this.appointmentRepository = appointmentRepository;
        this.webClient = WebClient.builder().build();
    }

    public Map<String, Object> processMessage(String userMessage, String userId) {
        if (apiKey == null || apiKey.isEmpty()) {
            return generateFallbackResponse(userMessage);
        }
        try {
            return runWithTools(userMessage, userId);
        } catch (Exception e) {
            log.error("Chatbot tool-call loop failed", e);
            return generateFallbackResponse(userMessage);
        }
    }

    /* ============================================================
     *  Gemini tool-calling loop
     * ============================================================ */

    @SuppressWarnings({"unchecked", "rawtypes"})
    private Map<String, Object> runWithTools(String userMessage, String userId) {
        List<Map<String, Object>> contents = new ArrayList<>();
        contents.add(Map.of(
                "role", "user",
                "parts", List.of(Map.of("text", systemPrompt() + "\n\nUser: " + userMessage))
        ));

        Map<String, Object> tools = Map.of("functionDeclarations", toolDeclarations());

        List<Map<String, Object>> structuredPayloads = new ArrayList<>();

        for (int hop = 0; hop < MAX_TOOL_HOPS; hop++) {
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("contents", contents);
            requestBody.put("tools", List.of(tools));

            Map response = webClient.post()
                    .uri(apiUrl + "?key=" + apiKey)
                    .header("Content-Type", "application/json")
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (response == null) break;

            List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.get("candidates");
            if (candidates == null || candidates.isEmpty()) break;

            Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
            if (content == null) break;

            List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
            if (parts == null || parts.isEmpty()) break;

            // Echo the model turn back into history.
            contents.add(Map.of("role", "model", "parts", parts));

            // Look for a function call in any of the parts.
            Map<String, Object> functionCall = null;
            StringBuilder textBuf = new StringBuilder();
            for (Map<String, Object> part : parts) {
                if (part.containsKey("functionCall")) functionCall = (Map<String, Object>) part.get("functionCall");
                if (part.containsKey("text")) textBuf.append((String) part.get("text"));
            }

            if (functionCall != null) {
                String name = (String) functionCall.get("name");
                Map<String, Object> args = (Map<String, Object>) functionCall.getOrDefault("args", Map.of());
                Map<String, Object> result = invokeTool(name, args, userId);
                if (result.get("__structured") instanceof List) {
                    structuredPayloads.addAll((List<Map<String, Object>>) result.get("__structured"));
                }
                Map<String, Object> functionResponse = Map.of(
                        "role", "user",
                        "parts", List.of(Map.of(
                                "functionResponse", Map.of(
                                        "name", name,
                                        "response", result
                                )
                        ))
                );
                contents.add(functionResponse);
                continue;
            }

            // No function call — model returned a final answer.
            Map<String, Object> finalResponse = new LinkedHashMap<>();
            finalResponse.put("success", true);
            finalResponse.put("message", textBuf.toString().isBlank()
                    ? "I'm here to help — could you rephrase that?"
                    : textBuf.toString());
            if (!structuredPayloads.isEmpty()) {
                finalResponse.put("recommendations", structuredPayloads);
            }
            return finalResponse;
        }
        return Map.of("success", true,
                "message", "I had trouble looking that up. Mind asking it a different way?");
    }

    private String systemPrompt() {
        return "You are HealthPro's healthcare assistant. You help patients find doctors, "
                + "browse hospitals, recall their past appointments and prescriptions, and prepare for upcoming visits. "
                + "Use tools to fetch real data from the platform — never invent doctor names, hospitals, or appointments. "
                + "When recommending doctors based on symptoms, call recommend_doctor. "
                + "When the user asks about a specific named doctor, call get_doctor_profile. "
                + "When asked about past visits, prescriptions, or upcoming bookings, call the matching get_my_* tool. "
                + "Keep replies short, empathetic, and professional.";
    }

    private List<Map<String, Object>> toolDeclarations() {
        return List.of(
                Map.of(
                        "name", "recommend_doctor",
                        "description", "Recommend doctors for the user's symptoms or specialty.",
                        "parameters", Map.of(
                                "type", "object",
                                "properties", Map.of(
                                        "symptoms_or_specialty", Map.of("type", "string",
                                                "description", "free-form symptoms (e.g. 'chest pain') or a specialty (e.g. 'Cardiology')")
                                ),
                                "required", List.of("symptoms_or_specialty")
                        )
                ),
                Map.of(
                        "name", "get_doctor_profile",
                        "description", "Fetch details for a specific doctor by full or partial name.",
                        "parameters", Map.of(
                                "type", "object",
                                "properties", Map.of(
                                        "doctor_name", Map.of("type", "string")
                                ),
                                "required", List.of("doctor_name")
                        )
                ),
                Map.of(
                        "name", "search_hospitals",
                        "description", "List hospitals on the platform, optionally filtered by city.",
                        "parameters", Map.of(
                                "type", "object",
                                "properties", Map.of(
                                        "city", Map.of("type", "string", "description", "city name; omit to list all")
                                )
                        )
                ),
                Map.of(
                        "name", "search_doctors",
                        "description", "List doctors by specialization across all hospitals.",
                        "parameters", Map.of(
                                "type", "object",
                                "properties", Map.of(
                                        "specialization", Map.of("type", "string",
                                                "description", "e.g. Cardiology, Orthopedics, Dermatology")
                                ),
                                "required", List.of("specialization")
                        )
                ),
                Map.of(
                        "name", "get_my_past_appointments",
                        "description", "List the current user's completed appointments, with prescriptions if any.",
                        "parameters", Map.of("type", "object", "properties", Map.of())
                ),
                Map.of(
                        "name", "get_my_upcoming_appointments",
                        "description", "List the current user's pending, approved, or ongoing appointments.",
                        "parameters", Map.of("type", "object", "properties", Map.of())
                )
        );
    }

    /* ============================================================
     *  Tool implementations
     * ============================================================ */

    private Map<String, Object> invokeTool(String name, Map<String, Object> args, String userId) {
        try {
            switch (name) {
                case "recommend_doctor":
                    return toolRecommendDoctor(arg(args, "symptoms_or_specialty"));
                case "get_doctor_profile":
                    return toolGetDoctorProfile(arg(args, "doctor_name"));
                case "search_hospitals":
                    return toolSearchHospitals(arg(args, "city"));
                case "search_doctors":
                    return toolSearchDoctors(arg(args, "specialization"));
                case "get_my_past_appointments":
                    return toolMyPast(userId);
                case "get_my_upcoming_appointments":
                    return toolMyUpcoming(userId);
                default:
                    return Map.of("error", "unknown tool: " + name);
            }
        } catch (Exception e) {
            log.error("Tool {} failed", name, e);
            return Map.of("error", "tool failed");
        }
    }

    private static String arg(Map<String, Object> args, String key) {
        Object v = args.get(key);
        return v == null ? null : v.toString();
    }

    private Map<String, Object> toolRecommendDoctor(String input) {
        if (input == null || input.isBlank()) return Map.of("doctors", List.of());
        String specialization = inferSpecialization(input);
        List<Doctor> matches = doctorRepository.findAll().stream()
                .filter(d -> d.getHospitalId() != null && d.getSpecialization() != null)
                .filter(d -> specialization == null
                        ? d.getSpecialization().toLowerCase().contains(input.toLowerCase())
                        : d.getSpecialization().toLowerCase().contains(specialization.toLowerCase()))
                .limit(5)
                .collect(Collectors.toList());
        Map<String, String> hospitalNames = hospitalNamesById();
        List<Map<String, Object>> doctors = matches.stream()
                .map(d -> doctorCard(d, hospitalNames))
                .collect(Collectors.toList());
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("specialization", specialization);
        result.put("doctors", doctors);
        result.put("__structured", doctors);
        return result;
    }

    private Map<String, Object> toolGetDoctorProfile(String doctorName) {
        if (doctorName == null || doctorName.isBlank()) return Map.of("error", "doctor_name required");
        String needle = doctorName.toLowerCase().replaceFirst("(?i)^dr\\.?\\s*", "");
        Optional<Doctor> match = doctorRepository.findAll().stream()
                .filter(d -> d.getName() != null
                        && d.getName().toLowerCase().replaceFirst("(?i)^dr\\.?\\s*", "").contains(needle))
                .findFirst();
        if (match.isEmpty()) return Map.of("error", "doctor not found");
        Doctor d = match.get();
        Map<String, Object> card = doctorCard(d, hospitalNamesById());
        if (d.getAbout() != null) card.put("about", d.getAbout());
        if (d.getQualification() != null) card.put("qualification", d.getQualification());
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("doctor", card);
        result.put("__structured", List.of(card));
        return result;
    }

    private Map<String, Object> toolSearchHospitals(String city) {
        List<Hospital> hospitals = hospitalRepository.findByActiveTrue().stream()
                .filter(h -> city == null || city.isBlank() || (h.getCity() != null && h.getCity().toLowerCase().contains(city.toLowerCase())))
                .limit(8)
                .collect(Collectors.toList());
        List<Map<String, Object>> list = hospitals.stream().map(h -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("_type", "hospital");
            m.put("hospitalId", h.getId());
            m.put("name", h.getName());
            m.put("city", h.getCity());
            m.put("specializations", h.getSpecializations());
            return m;
        }).collect(Collectors.toList());
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("hospitals", list);
        result.put("__structured", list);
        return result;
    }

    private Map<String, Object> toolSearchDoctors(String specialization) {
        if (specialization == null || specialization.isBlank()) return Map.of("doctors", List.of());
        Map<String, String> hospitalNames = hospitalNamesById();
        List<Map<String, Object>> doctors = doctorRepository.findAll().stream()
                .filter(d -> d.getSpecialization() != null
                        && d.getSpecialization().toLowerCase().contains(specialization.toLowerCase()))
                .limit(8)
                .map(d -> doctorCard(d, hospitalNames))
                .collect(Collectors.toList());
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("doctors", doctors);
        result.put("__structured", doctors);
        return result;
    }

    private Map<String, Object> toolMyPast(String userId) {
        if (userId == null) return Map.of("appointments", List.of());
        List<Appointment> raw = appointmentRepository.findByPatientIdContainingAndProgress(userId, "done");
        List<Map<String, Object>> list = raw.stream().map(a -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("_type", "past_appointment");
            m.put("appointmentId", a.getId());
            m.put("doctorname", a.getDoctorname());
            m.put("slotDate", a.getSlotDate());
            m.put("slotTime", a.getSlotTime());
            m.put("problem", a.getProblem());
            m.put("consultationNotes", a.getConsultationNotes());
            m.put("prescriptions", a.getPrescriptions());
            m.put("profileRelation", a.getProfileRelation());
            return m;
        }).collect(Collectors.toList());
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("appointments", list);
        result.put("__structured", list);
        return result;
    }

    private Map<String, Object> toolMyUpcoming(String userId) {
        if (userId == null) return Map.of("appointments", List.of());
        Set<String> active = Set.of("pending", "approved", "ongoing");
        String today = LocalDate.now().toString();
        List<Map<String, Object>> list = appointmentRepository.findByPatientIdContaining(userId).stream()
                .filter(a -> active.contains(a.getProgress()))
                .filter(a -> a.getSlotDate() == null || a.getSlotDate().compareTo(today) >= 0)
                .map(a -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("_type", "upcoming_appointment");
                    m.put("appointmentId", a.getId());
                    m.put("doctorname", a.getDoctorname());
                    m.put("slotDate", a.getSlotDate());
                    m.put("slotTime", a.getSlotTime());
                    m.put("progress", a.getProgress());
                    m.put("paymentStatus", a.getPaymentStatus());
                    m.put("profileRelation", a.getProfileRelation());
                    return m;
                })
                .sorted(Comparator.comparing((Map<String, Object> m) -> (String) m.getOrDefault("slotDate", "9999-12-31")))
                .collect(Collectors.toList());
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("appointments", list);
        result.put("__structured", list);
        return result;
    }

    /* ============================================================
     *  Helpers
     * ============================================================ */

    private Map<String, String> hospitalNamesById() {
        Map<String, String> map = new HashMap<>();
        for (Hospital h : hospitalRepository.findByActiveTrue()) {
            map.put(h.getId(), h.getName() + " (" + h.getCity() + ")");
        }
        return map;
    }

    private Map<String, Object> doctorCard(Doctor d, Map<String, String> hospitalNames) {
        Map<String, Object> rec = new LinkedHashMap<>();
        rec.put("_type", "doctor");
        rec.put("doctorId", d.getId());
        rec.put("name", d.getName());
        rec.put("specialization", d.getSpecialization());
        rec.put("designation", d.getDesignation());
        rec.put("experience", d.getExperience());
        rec.put("fees", d.getFees());
        rec.put("hospital", hospitalNames.getOrDefault(d.getHospitalId(), ""));
        return rec;
    }

    private static String inferSpecialization(String message) {
        String msg = message.toLowerCase();
        if (msg.contains("heart") || msg.contains("chest") || msg.contains("cardiac")) return "Cardiology";
        if (msg.contains("bone") || msg.contains("joint") || msg.contains("fracture") || msg.contains("knee")) return "Orthopedics";
        if (msg.contains("skin") || msg.contains("rash") || msg.contains("acne")) return "Dermatology";
        if (msg.contains("brain") || msg.contains("headache") || msg.contains("migraine") || msg.contains("nerve")) return "Neurology";
        if (msg.contains("child") || msg.contains("baby") || msg.contains("kid") || msg.contains("pediatr")) return "Pediatrics";
        if (msg.contains("eye") || msg.contains("vision") || msg.contains("sight")) return "Ophthalmology";
        if (msg.contains("stomach") || msg.contains("digest") || msg.contains("gastro") || msg.contains("abdomen")) return "Gastroenterology";
        if (msg.contains("pregnan") || msg.contains("gynec") || msg.contains("women")) return "Gynecology";
        if (msg.contains("cancer") || msg.contains("tumor")) return "Oncology";
        if (msg.contains("lung") || msg.contains("breath") || msg.contains("cough") || msg.contains("asthma")) return "Pulmonology";
        if (msg.contains("kidney") || msg.contains("urin")) return "Urology";
        if (msg.contains("fever") || msg.contains("cold") || msg.contains("general") || msg.contains("flu")) return "General Medicine";
        return null;
    }

    /* ============================================================
     *  Fallback (no API key)
     * ============================================================ */

    private Map<String, Object> generateFallbackResponse(String userMessage) {
        String specialization = inferSpecialization(userMessage);
        Map<String, Object> result = new LinkedHashMap<>();
        if (specialization == null) {
            result.put("success", true);
            result.put("message", "I'd love to help. Could you describe your symptoms? "
                    + "For example: chest pain, headache, joint pain, breathing issues, etc.");
            result.put("recommendations", List.of());
            return result;
        }
        Map<String, String> hospitalNames = hospitalNamesById();
        List<Map<String, Object>> doctors = doctorRepository.findAll().stream()
                .filter(d -> d.getSpecialization() != null
                        && d.getSpecialization().toLowerCase().contains(specialization.toLowerCase()))
                .limit(3)
                .map(d -> doctorCard(d, hospitalNames))
                .collect(Collectors.toList());

        result.put("success", true);
        result.put("message", doctors.isEmpty()
                ? "I'd recommend a " + specialization + " specialist, but none are listed right now. Please check back later."
                : "Based on what you described, here are some " + specialization + " specialists:");
        result.put("recommendations", doctors);
        return result;
    }
}
