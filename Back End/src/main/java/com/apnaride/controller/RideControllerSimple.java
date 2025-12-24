package com.apnaride.controller;

import com.apnaride.model.Ride;
import com.apnaride.model.Driver;
import com.apnaride.repository.RideRepository;
import com.apnaride.repository.DriverRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/rides-simple")
@CrossOrigin(origins = "*")
public class RideControllerSimple {

    @Autowired
    private RideRepository rideRepository;

    @Autowired
    private DriverRepository driverRepository;

    @PostMapping("/{bookingId}/accept")
    public ResponseEntity<?> acceptRide(@PathVariable String bookingId, @RequestBody Map<String, Object> request) {
        System.out.println("=== SIMPLE ACCEPT RIDE ===");
        System.out.println("Booking ID: " + bookingId);
        System.out.println("Request: " + request);
        
        try {
            // Get driver ID
            Long driverId = ((Number) request.get("driverId")).longValue();
            System.out.println("Driver ID: " + driverId);
            
            // Find ride
            Optional<Ride> rideOpt = rideRepository.findByBookingId(bookingId);
            if (rideOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("error", "Ride not found", "success", false));
            }
            
            Ride ride = rideOpt.get();
            System.out.println("Ride found: " + ride.getBookingId());
            
            // Find or create driver
            Optional<Driver> driverOpt = driverRepository.findByUserId(driverId);
            Driver driver;
            
            if (driverOpt.isEmpty()) {
                System.out.println("Creating new driver");
                driver = new Driver();
                driver.setUserId(driverId);
                driver.setVehicleType("Bike");
                driver.setVehicleNumber("TEMP-" + driverId);
                driver.setLicenseNumber("TEMP-" + driverId);
                driver.setIsAvailable(true);
                driver.setIsOnline(true);
                driver.setRating(5.0);
                driver.setTotalTrips(0);
                driver = driverRepository.save(driver);
                System.out.println("Driver created");
            } else {
                driver = driverOpt.get();
                System.out.println("Driver found");
            }
            
            // Update ride
            ride.setRiderId(driverId);
            ride.setStatus("ACCEPTED");
            ride.setAcceptedAt(LocalDateTime.now());
            ride = rideRepository.save(ride);
            System.out.println("Ride updated");
            
            // Update driver
            driver.setIsAvailable(false);
            driver.setCurrentRideId(bookingId);
            driverRepository.save(driver);
            System.out.println("Driver updated");
            
            System.out.println("=== SUCCESS ===");
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Ride accepted",
                "bookingId", bookingId
            ));
            
        } catch (Exception e) {
            System.err.println("=== ERROR ===");
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "error", e.getMessage(),
                "success", false
            ));
        }
    }
}
