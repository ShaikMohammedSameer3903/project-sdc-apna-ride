package com.apnaride.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/emergency")
@CrossOrigin(origins = "*")
public class EmergencyController {

    @Autowired
    private WebSocketController webSocketController;

    /**
     * Handle SOS emergency alert
     */
    @PostMapping("/sos")
    public ResponseEntity<?> triggerSOS(@RequestBody Map<String, Object> request) {
        Long userId = null;
        try {
            Object uid = request.get("userId");
            if (uid instanceof Number) {
                userId = ((Number) uid).longValue();
            } else if (uid instanceof String) {
                userId = Long.parseLong((String) uid);
            }
        } catch (Exception ignored) {}

        String rideId = request.get("rideId") != null ? String.valueOf(request.get("rideId")) : null;

        Object locationObj = request.get("location");
        Double lat = null, lng = null;
        if (locationObj instanceof Map) {
            Map<?,?> loc = (Map<?,?>) locationObj;
            Object latObj = loc.get("lat");
            if (latObj == null) latObj = loc.get("latitude");
            Object lngObj = loc.get("lng");
            if (lngObj == null) lngObj = loc.get("longitude");
            try { if (latObj instanceof Number) lat = ((Number) latObj).doubleValue(); else if (latObj instanceof String) lat = Double.parseDouble((String) latObj); } catch (Exception ignored) {}
            try { if (lngObj instanceof Number) lng = ((Number) lngObj).doubleValue(); else if (lngObj instanceof String) lng = Double.parseDouble((String) lngObj); } catch (Exception ignored) {}
        } else if (locationObj instanceof List) {
            List<?> list = (List<?>) locationObj;
            if (list.size() >= 2) {
                Object a = list.get(0), b = list.get(1);
                try { if (a instanceof Number) lat = ((Number) a).doubleValue(); } catch (Exception ignored) {}
                try { if (b instanceof Number) lng = ((Number) b).doubleValue(); } catch (Exception ignored) {}
            }
        } else if (locationObj != null && locationObj.getClass().isArray()) {
            Object[] arr = (Object[]) locationObj;
            if (arr.length >= 2) {
                try { if (arr[0] instanceof Number) lat = ((Number) arr[0]).doubleValue(); } catch (Exception ignored) {}
                try { if (arr[1] instanceof Number) lng = ((Number) arr[1]).doubleValue(); } catch (Exception ignored) {}
            }
        }

        // Log emergency alert
        System.out.println("🚨 SOS ALERT TRIGGERED!");
        System.out.println("User ID: " + userId);
        System.out.println("Ride ID: " + rideId);
        if (lat != null && lng != null) {
            System.out.println("Location: " + lat + "," + lng);
        } else {
            System.out.println("Location: " + locationObj);
        }
        System.out.println("Time: " + LocalDateTime.now());

        // In production, this would:
        // 1. Alert emergency services
        // 2. Notify emergency contacts
        // 3. Send location to authorities
        // 4. Record incident in database
        // 5. Trigger safety protocols

        // Send notification to user
        if (userId != null) {
            webSocketController.sendNotification(
                userId,
                "SOS alert activated. Help is on the way!",
                "emergency"
            );
        }

        // TODO: Implement actual emergency service integration
        // - Call emergency services API
        // - Send SMS to emergency contacts
        // - Alert nearby authorities
        // - Record incident details

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Emergency alert sent successfully");
        response.put("alertId", "SOS-" + System.currentTimeMillis());
        response.put("timestamp", LocalDateTime.now().toString());
        response.put("status", "ACTIVE");

        return ResponseEntity.ok(response);
    }

    /**
     * Add emergency contact
     */
    @PostMapping("/contacts/add")
    public ResponseEntity<?> addEmergencyContact(@RequestBody Map<String, Object> request) {
        Long userId = ((Number) request.get("userId")).longValue();
        String contactName = (String) request.get("name");
        String contactPhone = (String) request.get("phone");
        String relationship = (String) request.get("relationship");

        // TODO: Save to database
        // EmergencyContact contact = new EmergencyContact();
        // contact.setUserId(userId);
        // contact.setName(contactName);
        // contact.setPhone(contactPhone);
        // contact.setRelationship(relationship);
        // emergencyContactRepository.save(contact);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Emergency contact added successfully");
        response.put("contact", Map.of(
            "name", contactName,
            "phone", contactPhone,
            "relationship", relationship
        ));

        return ResponseEntity.ok(response);
    }

    /**
     * Get emergency contacts for user
     */
    @GetMapping("/contacts/{userId}")
    public ResponseEntity<?> getEmergencyContacts(@PathVariable Long userId) {
        // TODO: Fetch from database
        // List<EmergencyContact> contacts = emergencyContactRepository.findByUserId(userId);

        // Mock data for now
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("contacts", new Object[]{
            Map.of("id", 1, "name", "John Doe", "phone", "+91-9876543210", "relationship", "Father"),
            Map.of("id", 2, "name", "Jane Doe", "phone", "+91-9876543211", "relationship", "Mother")
        });

        return ResponseEntity.ok(response);
    }

    /**
     * Share trip with emergency contacts
     */
    @PostMapping("/share-trip")
    public ResponseEntity<?> shareTripWithContacts(@RequestBody Map<String, Object> request) {
        Long userId = ((Number) request.get("userId")).longValue();
        String rideId = (String) request.get("rideId");
        String trackingLink = (String) request.get("trackingLink");

        // TODO: Send SMS/notification to emergency contacts
        // List<EmergencyContact> contacts = emergencyContactRepository.findByUserId(userId);
        // for (EmergencyContact contact : contacts) {
        //     smsService.sendTripShareSMS(contact.getPhone(), trackingLink);
        // }

        System.out.println("📍 Trip shared with emergency contacts");
        System.out.println("User ID: " + userId);
        System.out.println("Ride ID: " + rideId);
        System.out.println("Tracking Link: " + trackingLink);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Trip details shared with emergency contacts");
        response.put("sharedWith", 2); // Number of contacts

        return ResponseEntity.ok(response);
    }

    /**
     * Report safety incident
     */
    @PostMapping("/report")
    public ResponseEntity<?> reportIncident(@RequestBody Map<String, Object> request) {
        Long userId = ((Number) request.get("userId")).longValue();
        String rideId = (String) request.get("rideId");
        String incidentType = (String) request.get("type");
        String description = (String) request.get("description");

        // TODO: Save incident report to database
        // SafetyIncident incident = new SafetyIncident();
        // incident.setUserId(userId);
        // incident.setRideId(rideId);
        // incident.setType(incidentType);
        // incident.setDescription(description);
        // incident.setReportedAt(LocalDateTime.now());
        // safetyIncidentRepository.save(incident);

        System.out.println("⚠️ Safety incident reported");
        System.out.println("User ID: " + userId);
        System.out.println("Ride ID: " + rideId);
        System.out.println("Type: " + incidentType);
        System.out.println("Description: " + description);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Incident reported successfully. Our team will review it shortly.");
        response.put("reportId", "INC-" + System.currentTimeMillis());
        response.put("status", "UNDER_REVIEW");

        return ResponseEntity.ok(response);
    }
}
