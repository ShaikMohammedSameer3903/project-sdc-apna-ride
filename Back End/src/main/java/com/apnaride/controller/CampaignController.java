package com.apnaride.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/campaigns")
@CrossOrigin(origins = "*")
public class CampaignController {

    @GetMapping("/active")
    public ResponseEntity<?> active() {
        Map<String, Object> campaign = new HashMap<>();
        campaign.put("title", "Festive Offer ✨");
        campaign.put("message", "Enjoy 20% off on rides this festival weekend! Use code FEST20.");
        campaign.put("cta", "Book Now");
        campaign.put("validFrom", LocalDate.now().toString());
        campaign.put("validTo", LocalDate.now().plusDays(7).toString());
        return ResponseEntity.ok(campaign);
    }

    @PostMapping("/broadcast")
    public ResponseEntity<?> broadcast(@RequestBody Map<String, Object> payload) {
        return ResponseEntity.ok(Map.of("success", true));
    }
}
