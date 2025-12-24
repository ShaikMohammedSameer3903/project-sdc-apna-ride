package com.apnaride.controller;

import com.apnaride.dto.AuthResponse;
import com.apnaride.model.User;
import com.apnaride.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class OtpAuthController {

    @Autowired
    private UserRepository userRepository;

    private final RestTemplate restTemplate = new RestTemplate();

    private static class OtpEntry {
        final String code;
        final LocalDateTime expiresAt;
        final LocalDateTime lastSentAt;
        OtpEntry(String code, LocalDateTime expiresAt, LocalDateTime lastSentAt) {
            this.code = code; this.expiresAt = expiresAt; this.lastSentAt = lastSentAt;
        }
    }

    private static final Map<String, OtpEntry> OTP_STORE = new ConcurrentHashMap<>();

    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOtp(@RequestBody Map<String, String> payload) {
        String phone = payload.getOrDefault("phone", "");
        if (phone == null || phone.trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("success", false, "error", "Phone is required"));
        }
        OtpEntry existing = OTP_STORE.get(phone);
        LocalDateTime now = LocalDateTime.now();
        if (existing != null && existing.lastSentAt != null && now.isBefore(existing.lastSentAt.plusSeconds(60))) {
            long wait = java.time.Duration.between(now, existing.lastSentAt.plusSeconds(60)).getSeconds();
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(Map.of("success", false, "error", "Please wait " + wait + "s before requesting another OTP"));
        }
        String code = String.format("%06d", new Random().nextInt(1_000_000));
        LocalDateTime expires = now.plusMinutes(5);
        OTP_STORE.put(phone, new OtpEntry(code, expires, now));

        boolean otpDebug = Boolean.parseBoolean(System.getenv().getOrDefault("OTP_DEBUG", "false"));
        String waToken = System.getenv().getOrDefault("WHATSAPP_TOKEN", "").trim();
        String waPhoneNumberId = System.getenv().getOrDefault("WHATSAPP_PHONE_NUMBER_ID", "").trim();
        boolean waConfigured = !waToken.isEmpty() && !waPhoneNumberId.isEmpty();

        if (waConfigured) {
            try {
                Map<String, Object> payloadBody = new LinkedHashMap<>();
                payloadBody.put("messaging_product", "whatsapp");
                payloadBody.put("to", phone);
                payloadBody.put("type", "text");
                payloadBody.put("text", Map.of("body", "Your ApnaRide OTP is: " + code + " (valid for 5 minutes)"));

                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                headers.setBearerAuth(waToken);

                String url = "https://graph.facebook.com/v20.0/" + waPhoneNumberId + "/messages";
                restTemplate.postForEntity(url, new HttpEntity<>(payloadBody, headers), String.class);
            } catch (RestClientException ex) {
                return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of(
                        "success", false,
                        "error", "Unable to send OTP via WhatsApp at the moment. Please try again."
                ));
            }
        }

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("success", true);
        resp.put("expiresAt", expires.toString());
        if (otpDebug && !waConfigured) {
            resp.put("debugCode", code);
        }
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> payload) {
        String phone = payload.getOrDefault("phone", "");
        String code = payload.getOrDefault("code", "");
        if (phone == null || phone.trim().isEmpty() || code == null || code.trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("success", false, "error", "Phone and code are required"));
        }
        OtpEntry entry = OTP_STORE.get(phone);
        if (entry == null || LocalDateTime.now().isAfter(entry.expiresAt) || !entry.code.equals(code)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("success", false, "error", "Invalid or expired OTP"));
        }
        // Find user by phone without repository method change
        User matched = null;
        for (User u : userRepository.findAll()) {
            if (u.getPhone() != null && u.getPhone().equals(phone)) { matched = u; break; }
        }
        if (matched == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("success", false, "error", "No account found for this mobile number. Please sign up."));
        }
        return ResponseEntity.ok(new AuthResponse(
                matched.getId(),
                matched.getName(),
                matched.getEmail(),
                matched.getRole(),
                matched.getPhone(),
                matched.getEmergencyPhone()
        ));
    }
}
