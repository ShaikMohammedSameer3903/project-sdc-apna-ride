package com.apnaride.controller;

import com.apnaride.model.Driver;
import com.apnaride.repository.DriverRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/drivers")
@CrossOrigin(origins = "*")
public class DriverController {

    @Autowired
    private DriverRepository driverRepository;

    @PostMapping("/register")
    public ResponseEntity<?> registerDriver(@RequestBody Driver driver) {
        // Check if driver already exists for this user
        Optional<Driver> existingDriver = driverRepository.findByUserId(driver.getUserId());
        if (existingDriver.isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Driver already registered for this user");
        }

        driver.setRating(5.0);
        driver.setTotalTrips(0);
        driver.setIsOnline(false);
        driver.setIsAvailable(false);
        driver.setIsVerified(true); // Auto-verify for testing
        driver.setIsApproved(true); // Auto-approve for testing
        driver.setIsSuspended(false);
        driver.setVerificationStatus("APPROVED");
        driver.setJoinedDate(java.time.LocalDateTime.now());

        Driver savedDriver = driverRepository.save(driver);
        return ResponseEntity.ok(savedDriver);
    }

    @GetMapping("/{userId}")
    public ResponseEntity<?> getDriverByUserId(@PathVariable Long userId) {
        Optional<Driver> driver = driverRepository.findByUserId(userId);
        if (driver.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Driver not found");
        }
        return ResponseEntity.ok(driver.get());
    }

    @PostMapping("/{userId}/status")
    public ResponseEntity<?> updateDriverStatus(
            @PathVariable Long userId,
            @RequestBody java.util.Map<String, Object> statusUpdate) {
        
        Optional<Driver> driverOpt = driverRepository.findByUserId(userId);
        if (driverOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Driver not found");
        }

        Driver driver = driverOpt.get();
        
        if (statusUpdate.containsKey("isOnline")) {
            Boolean isOnline = (Boolean) statusUpdate.get("isOnline");
            driver.setIsOnline(isOnline);
            // When going online, also set available to true (if approved)
            if (isOnline && driver.getIsApproved() != null && driver.getIsApproved()) {
                driver.setIsAvailable(true);
            } else if (!isOnline) {
                driver.setIsAvailable(false);
            }
        }
        
        if (statusUpdate.containsKey("lat") && statusUpdate.containsKey("lng")) {
            driver.setCurrentLat(((Number) statusUpdate.get("lat")).doubleValue());
            driver.setCurrentLng(((Number) statusUpdate.get("lng")).doubleValue());
        }
        
        driver.setLastActive(java.time.LocalDateTime.now());

        Driver savedDriver = driverRepository.save(driver);
        return ResponseEntity.ok(savedDriver);
    }

    @GetMapping("/available")
    public ResponseEntity<List<Driver>> getAvailableDrivers() {
        List<Driver> drivers = driverRepository.findByIsOnlineAndIsAvailable(true, true);
        return ResponseEntity.ok(drivers);
    }

    @GetMapping("/all")
    public ResponseEntity<List<Driver>> getAllDrivers() {
        List<Driver> drivers = driverRepository.findAll();
        return ResponseEntity.ok(drivers);
    }

    @GetMapping("/nearby")
    public ResponseEntity<List<java.util.Map<String, Object>>> getNearbyDrivers(
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng,
            @RequestParam(required = false) Double latitude,
            @RequestParam(required = false) Double longitude,
            @RequestParam(defaultValue = "10", required = false) Double radiusKm,
            @RequestParam(defaultValue = "10", required = false) Double radius) {
        
        // Support both parameter names
        Double searchLat = (latitude != null) ? latitude : lat;
        Double searchLng = (longitude != null) ? longitude : lng;
        Double searchRadius = (radius != null) ? radius : radiusKm;
        
        if (searchLat == null || searchLng == null) {
            return ResponseEntity.badRequest().body(null);
        }
        
        List<Driver> onlineDrivers = driverRepository.findByIsOnline(true);
        List<java.util.Map<String, Object>> nearbyDrivers = new java.util.ArrayList<>();

        for (Driver driver : onlineDrivers) {
            if (driver.getCurrentLat() != null && driver.getCurrentLng() != null) {
                double distance = calculateDistance(searchLat, searchLng, driver.getCurrentLat(), driver.getCurrentLng());
                
                if (distance <= searchRadius) {
                    java.util.Map<String, Object> driverInfo = new java.util.HashMap<>();
                    driverInfo.put("driverId", driver.getUserId());
                    driverInfo.put("vehicleType", driver.getVehicleType());
                    driverInfo.put("vehicleNumber", driver.getVehicleNumber());
                    driverInfo.put("rating", driver.getRating());
                    driverInfo.put("currentLat", driver.getCurrentLat());
                    driverInfo.put("currentLng", driver.getCurrentLng());
                    driverInfo.put("distance", Math.round(distance * 10.0) / 10.0);
                    driverInfo.put("isAvailable", driver.getIsAvailable());
                    nearbyDrivers.add(driverInfo);
                }
            }
        }

        // Sort by distance (nearest first)
        nearbyDrivers.sort((a, b) -> Double.compare((Double)a.get("distance"), (Double)b.get("distance")));

        return ResponseEntity.ok(nearbyDrivers);
    }

    // Helper method to calculate distance using Haversine formula
    private double calculateDistance(Double lat1, Double lng1, Double lat2, Double lng2) {
        if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) {
            return Double.MAX_VALUE;
        }
        double R = 6371; // Radius of Earth in km
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                   Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                   Math.sin(dLng / 2) * Math.sin(dLng / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}
