package com.apnaride.controller;

import com.apnaride.model.PromoCode;
import com.apnaride.repository.PromoCodeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/promo")
@CrossOrigin(origins = "*")
public class PromoCodeController {

    @Autowired
    private PromoCodeRepository promoCodeRepository;

    /**
     * Validate and get promo code details
     */
    @GetMapping("/validate/{code}")
    public ResponseEntity<?> validatePromoCode(@PathVariable String code) {
        Optional<PromoCode> promoOpt = promoCodeRepository.findByCode(code.toUpperCase());
        
        if (promoOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(createErrorResponse("Invalid promo code"));
        }

        PromoCode promo = promoOpt.get();

        // Check if promo is active
        if (!promo.isActive()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(createErrorResponse("Promo code is no longer active"));
        }

        // Check if promo has expired
        if (promo.getExpiryDate() != null && promo.getExpiryDate().isBefore(LocalDateTime.now())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(createErrorResponse("Promo code has expired"));
        }

        // Check usage limit
        if (promo.getMaxUsage() != null && promo.getUsageCount() >= promo.getMaxUsage()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(createErrorResponse("Promo code usage limit reached"));
        }

        // Return promo details
        Map<String, Object> response = new HashMap<>();
        response.put("code", promo.getCode());
        response.put("discount", promo.getDiscountPercentage());
        response.put("maxDiscount", promo.getMaxDiscountAmount());
        response.put("description", promo.getDescription());
        response.put("valid", true);

        return ResponseEntity.ok(response);
    }

    /**
     * Apply promo code to a ride
     */
    @PostMapping("/apply")
    public ResponseEntity<?> applyPromoCode(@RequestBody Map<String, Object> request) {
        String code = (String) request.get("code");
        Double originalFare = ((Number) request.get("fare")).doubleValue();

        Optional<PromoCode> promoOpt = promoCodeRepository.findByCode(code.toUpperCase());
        
        if (promoOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(createErrorResponse("Invalid promo code"));
        }

        PromoCode promo = promoOpt.get();

        // Validate promo
        if (!promo.isActive() || 
            (promo.getExpiryDate() != null && promo.getExpiryDate().isBefore(LocalDateTime.now())) ||
            (promo.getMaxUsage() != null && promo.getUsageCount() >= promo.getMaxUsage())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(createErrorResponse("Promo code is not valid"));
        }

        // Calculate discount
        double discountAmount = (originalFare * promo.getDiscountPercentage()) / 100.0;
        
        // Apply max discount limit if set
        if (promo.getMaxDiscountAmount() != null && discountAmount > promo.getMaxDiscountAmount()) {
            discountAmount = promo.getMaxDiscountAmount();
        }

        double finalFare = originalFare - discountAmount;

        // Increment usage count
        promo.setUsageCount(promo.getUsageCount() + 1);
        promoCodeRepository.save(promo);

        // Return response
        Map<String, Object> response = new HashMap<>();
        response.put("originalFare", originalFare);
        response.put("discountAmount", Math.round(discountAmount * 100.0) / 100.0);
        response.put("finalFare", Math.round(finalFare * 100.0) / 100.0);
        response.put("promoCode", promo.getCode());
        response.put("success", true);

        return ResponseEntity.ok(response);
    }

    /**
     * Get all active promo codes
     */
    @GetMapping("/active")
    public ResponseEntity<List<PromoCode>> getActivePromoCodes() {
        List<PromoCode> promoCodes = promoCodeRepository.findByIsActiveTrue();
        
        // Filter out expired codes
        promoCodes = promoCodes.stream()
            .filter(promo -> promo.getExpiryDate() == null || promo.getExpiryDate().isAfter(LocalDateTime.now()))
            .filter(promo -> promo.getMaxUsage() == null || promo.getUsageCount() < promo.getMaxUsage())
            .toList();

        return ResponseEntity.ok(promoCodes);
    }

    /**
     * Create new promo code (Admin only)
     */
    @PostMapping("/create")
    public ResponseEntity<?> createPromoCode(@RequestBody PromoCode promoCode) {
        // Check if code already exists
        if (promoCodeRepository.findByCode(promoCode.getCode().toUpperCase()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(createErrorResponse("Promo code already exists"));
        }

        promoCode.setCode(promoCode.getCode().toUpperCase());
        promoCode.setUsageCount(0);
        promoCode.setActive(true);
        promoCode.setCreatedAt(LocalDateTime.now());

        PromoCode savedPromo = promoCodeRepository.save(promoCode);
        return ResponseEntity.ok(savedPromo);
    }

    /**
     * Deactivate promo code (Admin only)
     */
    @PutMapping("/{code}/deactivate")
    public ResponseEntity<?> deactivatePromoCode(@PathVariable String code) {
        Optional<PromoCode> promoOpt = promoCodeRepository.findByCode(code.toUpperCase());
        
        if (promoOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(createErrorResponse("Promo code not found"));
        }

        PromoCode promo = promoOpt.get();
        promo.setActive(false);
        promoCodeRepository.save(promo);

        return ResponseEntity.ok(createSuccessResponse("Promo code deactivated successfully"));
    }

    // Helper methods
    private Map<String, Object> createErrorResponse(String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("error", message);
        response.put("success", false);
        return response;
    }

    private Map<String, Object> createSuccessResponse(String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("message", message);
        response.put("success", true);
        return response;
    }
}
