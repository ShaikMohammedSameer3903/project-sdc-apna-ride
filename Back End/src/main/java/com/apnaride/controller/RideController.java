package com.apnaride.controller;

import com.apnaride.model.Ride;
import com.apnaride.model.User;
import com.apnaride.model.Driver;
import com.apnaride.repository.RideRepository;
import com.apnaride.repository.UserRepository;
import com.apnaride.repository.DriverRepository;
import com.apnaride.dto.RideRequest;
import com.apnaride.dto.RideResponse;
import com.apnaride.dto.RideUpdate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/rides")
@CrossOrigin(origins = "*")
public class RideController {

    @Autowired
    private RideRepository rideRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DriverRepository driverRepository;

    @Autowired
    private WebSocketController webSocketController;

    @PostMapping("/request")
    public ResponseEntity<?> requestRide(@RequestBody RideRequest rideRequest) {
        Ride ride = new Ride();
        ride.setBookingId("BK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        ride.setCustomerId(rideRequest.getCustomerId());
        ride.setPickupLocation(rideRequest.getPickupLocation());
        ride.setDropLocation(rideRequest.getDropLocation());
        ride.setVehicleType(rideRequest.getVehicleType());
        ride.setPickupLat(rideRequest.getPickupLat());
        ride.setPickupLng(rideRequest.getPickupLng());
        ride.setDropLat(rideRequest.getDropLat());
        ride.setDropLng(rideRequest.getDropLng());
        
        // Calculate fare based on distance (simplified)
        double distance = calculateDistance(
            rideRequest.getPickupLat(), rideRequest.getPickupLng(),
            rideRequest.getDropLat(), rideRequest.getDropLng()
        );
        double baseFare = getBaseFare(rideRequest.getVehicleType());
        ride.setFare(baseFare + (distance * 10)); // ₹10 per km
        
        ride.setStatus("REQUESTED");
        ride.setRequestedAt(LocalDateTime.now());

        Ride savedRide = rideRepository.save(ride);

        RideResponse response = new RideResponse(
            savedRide.getBookingId(),
            savedRide.getPickupLocation(),
            savedRide.getDropLocation(),
            savedRide.getVehicleType(),
            savedRide.getFare(),
            savedRide.getStatus()
        );
        response.setRequestedAt(savedRide.getRequestedAt());

        // Enforce vehicle type matching: notify only online & available drivers with same vehicleType
        try {
            List<Driver> onlineAvail = driverRepository.findByIsOnlineAndIsAvailable(true, true);
            String requestedType = (rideRequest.getVehicleType() != null) ? rideRequest.getVehicleType().trim() : null;

            List<Driver> typeMatches = onlineAvail.stream()
                .filter(d -> {
                    String vt = d.getVehicleType();
                    return requestedType == null || (vt != null && vt.equalsIgnoreCase(requestedType));
                })
                .collect(Collectors.toList());

            // Prefer drivers within 10km of pickup if driver has location
            List<Long> nearbyTypeMatchIds = typeMatches.stream()
                .filter(d -> d.getCurrentLat() != null && d.getCurrentLng() != null)
                .filter(d -> calculateDistance(
                        rideRequest.getPickupLat(), rideRequest.getPickupLng(),
                        d.getCurrentLat(), d.getCurrentLng()) <= 10.0)
                .map(Driver::getUserId)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

            if (!nearbyTypeMatchIds.isEmpty()) {
                nearbyTypeMatchIds.forEach(id -> webSocketController.sendRideRequest(id, response));
            } else {
                // If no location-qualified drivers, send to all online+available of matching type
                List<Long> allTypeMatchIds = typeMatches.stream()
                    .map(Driver::getUserId)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());
                allTypeMatchIds.forEach(id -> webSocketController.sendRideRequest(id, response));
            }
        } catch (Exception e) {
            // As a fail-safe, do not spam all drivers of other types; just log.
            System.err.println("Type-matched dispatch failed: " + e.getMessage());
        }

        return ResponseEntity.ok(response);
    }

    @PostMapping("/{bookingId}/verify-otp")
    public ResponseEntity<?> verifyOtp(@PathVariable String bookingId, @RequestBody Map<String, Object> payload) {
        try {
            Object otpObj = payload.get("otp");
            if (otpObj == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("success", false, "message", "OTP is required"));
            }
            String otp = String.valueOf(otpObj).trim();
            if (!otp.matches("^\\d{4}$")) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("success", false, "message", "Invalid OTP. Enter 4 digits."));
            }

            Optional<Ride> rideOpt = rideRepository.findByBookingId(bookingId);
            if (rideOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("success", false, "message", "Ride not found"));
            }

            Ride ride = rideOpt.get();
            // Verify against generated OTP
            String expected = ride.getOtp();
            if (expected == null || !expected.equals(otp)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("success", false, "message", "Incorrect OTP. Please check and try again."));
            }
            ride.setStatus("IN_PROGRESS");
            Ride savedRide = rideRepository.save(ride);

            RideResponse response = new RideResponse(
                savedRide.getBookingId(),
                savedRide.getPickupLocation(),
                savedRide.getDropLocation(),
                savedRide.getVehicleType(),
                savedRide.getFare(),
                savedRide.getStatus()
            );

            // Notify customer that ride started
            try {
                RideUpdate update = new RideUpdate("RIDE_STARTED", bookingId, "IN_PROGRESS");
                update.setRide(response);
                update.setMessage("Your ride has started!");
                webSocketController.sendRideUpdate(savedRide.getCustomerId(), update);
            } catch (Exception e) {
                System.err.println("WebSocket notification failed: " + e.getMessage());
            }

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "OTP verified. Ride started.",
                "ride", response
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("success", false, "message", "Failed to verify OTP: " + e.getMessage()));
        }
    }

    @PostMapping("/{bookingId}/resend-otp")
    public ResponseEntity<?> resendOtp(@PathVariable String bookingId) {
        // In real implementation, regenerate/send OTP to customer.
        // Here we just acknowledge to unblock UI.
        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "OTP resent"
        ));
    }

    @PostMapping("/book")
    public ResponseEntity<?> bookRide(@RequestBody RideRequest rideRequest) {
        return requestRide(rideRequest);
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<RideResponse>> getCustomerRides(@PathVariable Long customerId) {
        List<Ride> rides = rideRepository.findByCustomerId(customerId);
        List<RideResponse> responses = rides.stream().map(ride -> {
            RideResponse response = new RideResponse(
                ride.getBookingId(),
                ride.getPickupLocation(),
                ride.getDropLocation(),
                ride.getVehicleType(),
                ride.getFare(),
                ride.getStatus()
            );
            response.setRequestedAt(ride.getRequestedAt());
            response.setDriverId(ride.getRiderId());
            return response;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(responses);
    }

    @GetMapping("/rider/{riderId}")
    public ResponseEntity<List<RideResponse>> getRiderRides(@PathVariable Long riderId) {
        List<Ride> rides = rideRepository.findByRiderId(riderId);
        List<RideResponse> responses = rides.stream().map(ride -> {
            RideResponse response = new RideResponse(
                ride.getBookingId(),
                ride.getPickupLocation(),
                ride.getDropLocation(),
                ride.getVehicleType(),
                ride.getFare(),
                ride.getStatus()
            );
            response.setRequestedAt(ride.getRequestedAt());
            response.setDriverId(ride.getRiderId());
            return response;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(responses);
    }

    @PutMapping("/{bookingId}/accept/{riderId}")
    public ResponseEntity<?> acceptRide(@PathVariable String bookingId, @PathVariable Long riderId) {
        try {
            System.out.println("=== ACCEPT RIDE REQUEST ===");
            System.out.println("Booking ID: " + bookingId);
            System.out.println("Rider ID: " + riderId);
            
            Optional<Ride> rideOpt = rideRepository.findByBookingId(bookingId);
            if (rideOpt.isEmpty()) {
                System.out.println("ERROR: Ride not found for booking ID: " + bookingId);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Ride not found", "success", false));
            }

            Ride ride = rideOpt.get();
            System.out.println("Ride found. Status: " + ride.getStatus());
            if (!ride.getStatus().equals("REQUESTED")) {
                // Idempotency: if this same driver already accepted, return current ride as success
                if ("ACCEPTED".equals(ride.getStatus()) && Objects.equals(ride.getRiderId(), riderId)) {
                    System.out.println("Ride already ACCEPTED by the same rider. Returning existing ride as success.");

                    RideResponse response = new RideResponse(
                        ride.getBookingId(),
                        ride.getPickupLocation(),
                        ride.getDropLocation(),
                        ride.getVehicleType(),
                        ride.getFare(),
                        ride.getStatus()
                    );
                    response.setRequestedAt(ride.getRequestedAt());
                    response.setPickupLat(ride.getPickupLat());
                    response.setPickupLng(ride.getPickupLng());
                    response.setDropLat(ride.getDropLat());
                    response.setDropLng(ride.getDropLng());
                    response.setDriverId(ride.getRiderId());

                    // Optionally add driver details if available
                    Optional<User> userOptForAccepted = userRepository.findById(ride.getRiderId());
                    Optional<Driver> driverOptForAccepted = driverRepository.findByUserId(ride.getRiderId());
                    if (userOptForAccepted.isPresent() && driverOptForAccepted.isPresent()) {
                        User user = userOptForAccepted.get();
                        Driver driver = driverOptForAccepted.get();
                        response.setDriverName(user.getName());
                        response.setVehicleNumber(driver.getVehicleNumber());
                        response.setRating(driver.getRating());
                    }

                    return ResponseEntity.ok(Map.of(
                        "success", true,
                        "message", "Ride already accepted by you",
                        "ride", response
                    ));
                }
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Ride already accepted or completed", "success", false, "currentStatus", ride.getStatus()));
            }

            // Verify driver exists and is available
            Optional<Driver> driverOpt = driverRepository.findByUserId(riderId);
            Driver driver;
            
            if (driverOpt.isEmpty()) {
                // Create driver record if it doesn't exist
                System.out.println("Driver not found, creating new driver record for user: " + riderId);
                driver = new Driver();
                driver.setUserId(riderId);
                driver.setVehicleType("Bike"); // Default
                driver.setVehicleNumber("TEMP-" + riderId);
                driver.setLicenseNumber("TEMP-" + riderId);
                driver.setIsAvailable(true);
                driver.setIsOnline(true);
                driver.setRating(5.0);
                driver.setTotalTrips(0);
                driver = driverRepository.save(driver);
                System.out.println("Created new driver with ID: " + driver.getId());
            } else {
                driver = driverOpt.get();
            }
            
            // Safer null checks for driver status
            Boolean isAvailable = driver.getIsAvailable();
            Boolean isOnline = driver.getIsOnline();
            boolean needsSave = false;
            
            if (isAvailable == null) {
                driver.setIsAvailable(true);
                isAvailable = true;
                needsSave = true;
            }
            if (isOnline == null) {
                driver.setIsOnline(true);
                isOnline = true;
                needsSave = true;
            }
            
            // Save driver if we initialized null fields
            if (needsSave) {
                driver = driverRepository.save(driver);
            }
            
            if (!isAvailable || !isOnline) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Driver is not available or offline", "success", false, 
                                 "isAvailable", isAvailable, "isOnline", isOnline));
            }

            // Update ride
            System.out.println("Updating ride status to ACCEPTED");
            ride.setRiderId(riderId);
            ride.setStatus("ACCEPTED");
            ride.setAcceptedAt(LocalDateTime.now());
            // Generate a 4-digit OTP and store it
            String otp = String.format("%04d", new java.util.Random().nextInt(10000));
            ride.setOtp(otp);
            Ride savedRide = rideRepository.save(ride);
            System.out.println("Ride saved successfully");

            // Update driver availability
            System.out.println("Updating driver availability");
            driver.setIsAvailable(false);
            driver.setCurrentRideId(bookingId);
            driverRepository.save(driver);
            System.out.println("Driver updated successfully");

            // Get user details
            System.out.println("Fetching user details");
            Optional<User> userOpt = userRepository.findById(riderId);

            RideResponse response = new RideResponse(
                savedRide.getBookingId(),
                savedRide.getPickupLocation(),
                savedRide.getDropLocation(),
                savedRide.getVehicleType(),
                savedRide.getFare(),
                savedRide.getStatus()
            );
            response.setRequestedAt(savedRide.getRequestedAt());
            response.setPickupLat(savedRide.getPickupLat());
            response.setPickupLng(savedRide.getPickupLng());
            response.setDropLat(savedRide.getDropLat());
            response.setDropLng(savedRide.getDropLng());
            response.setDriverId(savedRide.getRiderId());
            response.setOtp(savedRide.getOtp());

            if (userOpt.isPresent()) {
                User user = userOpt.get();
                response.setDriverName(user.getName());
                response.setVehicleNumber(driver.getVehicleNumber());
                response.setRating(driver.getRating());
            }

            // Send WebSocket notification to customer (includes OTP)
            try {
                RideUpdate update = new RideUpdate("RIDE_ACCEPTED", bookingId, "ACCEPTED");
                update.setRide(response);
                update.setMessage("Driver accepted your ride!");
                webSocketController.sendRideUpdate(savedRide.getCustomerId(), update);
            } catch (Exception e) {
                System.err.println("WebSocket notification failed: " + e.getMessage());
            }

            System.out.println("=== RIDE ACCEPTED SUCCESSFULLY ===");
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Ride accepted successfully",
                "ride", response
            ));
        } catch (Exception e) {
            System.err.println("=== ERROR ACCEPTING RIDE ===");
            e.printStackTrace();
            System.err.println("ERROR accepting ride: " + e.getClass().getName() + " - " + e.getMessage());
            if (e.getCause() != null) {
                System.err.println("Caused by: " + e.getCause().getMessage());
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to accept ride: " + e.getMessage(), "success", false, "errorType", e.getClass().getSimpleName()));
        }
    }

    @PostMapping("/{bookingId}/accept")
    public ResponseEntity<?> acceptRidePost(@PathVariable String bookingId, @RequestBody Map<String, Object> request) {
        System.out.println("=== POST ACCEPT RIDE ===");
        System.out.println("Booking ID: " + bookingId);
        System.out.println("Request body: " + request);
        
        try {
            if (!request.containsKey("driverId")) {
                System.err.println("ERROR: driverId not in request");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Driver ID is required", "success", false));
            }
            
            Object driverIdObj = request.get("driverId");
            System.out.println("Driver ID object: " + driverIdObj + " (type: " + driverIdObj.getClass().getName() + ")");
            
            Long riderId = ((Number) driverIdObj).longValue();
            System.out.println("Parsed rider ID: " + riderId);
            
            // Just call the main acceptRide method which has all the validation
            return acceptRide(bookingId, riderId);
        } catch (Exception e) {
            System.err.println("=== ERROR IN POST ACCEPT ===");
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to accept ride: " + e.getMessage(), 
                           "success", false,
                           "errorType", e.getClass().getSimpleName()));
        }
    }

    @PutMapping("/{bookingId}/complete")
    public ResponseEntity<?> completeRide(@PathVariable String bookingId) {
        try {
            Optional<Ride> rideOpt = rideRepository.findByBookingId(bookingId);
            if (rideOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Ride not found", "success", false));
            }

            Ride ride = rideOpt.get();
            ride.setStatus("COMPLETED");
            ride.setCompletedAt(LocalDateTime.now());
            Ride savedRide = rideRepository.save(ride);

            // Update driver availability
            if (ride.getRiderId() != null) {
                Optional<Driver> driverOpt = driverRepository.findByUserId(ride.getRiderId());
                if (driverOpt.isPresent()) {
                    Driver driver = driverOpt.get();
                    driver.setIsAvailable(true);
                    driver.setCurrentRideId(null);
                    driver.setTotalTrips((driver.getTotalTrips() != null ? driver.getTotalTrips() : 0) + 1);
                    driverRepository.save(driver);
                }
            }

            RideResponse response = new RideResponse(
                savedRide.getBookingId(),
                savedRide.getPickupLocation(),
                savedRide.getDropLocation(),
                savedRide.getVehicleType(),
                savedRide.getFare(),
                savedRide.getStatus()
            );

            // Send WebSocket notification to customer
            try {
                RideUpdate update = new RideUpdate("RIDE_COMPLETED", bookingId, "COMPLETED");
                update.setRide(response);
                update.setMessage("Ride completed successfully!");
                webSocketController.sendRideUpdate(savedRide.getCustomerId(), update);
            } catch (Exception e) {
                System.err.println("WebSocket notification failed: " + e.getMessage());
            }

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Ride completed successfully",
                "ride", response
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to complete ride: " + e.getMessage(), "success", false));
        }
    }

    @PostMapping("/{bookingId}/complete")
    public ResponseEntity<?> completeRidePost(@PathVariable String bookingId) {
        return completeRide(bookingId);
    }

    @PostMapping("/{bookingId}/rate")
    public ResponseEntity<?> rateRide(@PathVariable String bookingId, @RequestBody Map<String, Object> payload) {
        try {
            Optional<Ride> rideOpt = rideRepository.findByBookingId(bookingId);
            if (rideOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Ride not found", "success", false));
            }

            // Extract optional fields
            Object ratingObj = payload.get("rating");
            Object feedbackObj = payload.get("feedback");
            Object customerIdObj = payload.get("customerId");

            Double rating = null;
            if (ratingObj instanceof Number) rating = ((Number) ratingObj).doubleValue();
            String feedback = feedbackObj != null ? String.valueOf(feedbackObj) : null;
            Long customerId = null;
            if (customerIdObj instanceof Number) customerId = ((Number) customerIdObj).longValue();

            System.out.println("Received rating for booking " + bookingId + ": rating=" + rating + ", feedback=" + feedback + ", customerId=" + customerId);

            // TODO: Persist rating against driver/ride if required, update aggregates, etc.

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Thank you for your feedback!"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to submit rating: " + e.getMessage(), "success", false));
        }
    }

    @PostMapping("/{bookingId}/start")
    public ResponseEntity<?> startRide(@PathVariable String bookingId) {
        Optional<Ride> rideOpt = rideRepository.findByBookingId(bookingId);
        if (rideOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Ride not found");
        }

        Ride ride = rideOpt.get();
        if (!"IN_PROGRESS".equals(ride.getStatus())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("success", false, "message", "OTP not verified yet. Ask customer for OTP."));
        }
        Ride savedRide = rideRepository.save(ride);

        RideResponse response = new RideResponse(
            savedRide.getBookingId(),
            savedRide.getPickupLocation(),
            savedRide.getDropLocation(),
            savedRide.getVehicleType(),
            savedRide.getFare(),
            savedRide.getStatus()
        );

        // Send WebSocket notification to customer
        RideUpdate update = new RideUpdate("RIDE_STARTED", bookingId, "IN_PROGRESS");
        update.setRide(response);
        update.setMessage("Your ride has started!");
        webSocketController.sendRideUpdate(savedRide.getCustomerId(), update);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/{bookingId}/cancel")
    public ResponseEntity<?> cancelRide(@PathVariable String bookingId) {
        Optional<Ride> rideOpt = rideRepository.findByBookingId(bookingId);
        if (rideOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Ride not found");
        }

        Ride ride = rideOpt.get();
        ride.setStatus("CANCELLED");
        Ride savedRide = rideRepository.save(ride);

        RideResponse response = new RideResponse(
            savedRide.getBookingId(),
            savedRide.getPickupLocation(),
            savedRide.getDropLocation(),
            savedRide.getVehicleType(),
            savedRide.getFare(),
            savedRide.getStatus()
        );
        response.setDriverId(savedRide.getRiderId());
        response.setOtp(savedRide.getOtp());

        // Notify both customer and driver over WebSocket
        try {
            RideUpdate cancelUpdate = new RideUpdate("RIDE_CANCELLED", bookingId, "CANCELLED");
            cancelUpdate.setRide(response);
            cancelUpdate.setMessage("Ride was cancelled");
            // to customer
            if (savedRide.getCustomerId() != null) {
                webSocketController.sendRideUpdate(savedRide.getCustomerId(), cancelUpdate);
            }
            // to driver (if assigned)
            if (savedRide.getRiderId() != null) {
                webSocketController.sendRideUpdate(savedRide.getRiderId(), cancelUpdate);
            }
        } catch (Exception e) {
            System.err.println("Failed to broadcast RIDE_CANCELLED: " + e.getMessage());
        }

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{bookingId}")
    public ResponseEntity<?> getRideDetails(@PathVariable String bookingId) {
        Optional<Ride> rideOpt = rideRepository.findByBookingId(bookingId);
        if (rideOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Ride not found");
        }

        Ride ride = rideOpt.get();
        RideResponse response = new RideResponse(
            ride.getBookingId(),
            ride.getPickupLocation(),
            ride.getDropLocation(),
            ride.getVehicleType(),
            ride.getFare(),
            ride.getStatus()
        );
        response.setRequestedAt(ride.getRequestedAt());
        response.setDriverId(ride.getRiderId());
        // Include OTP so customer UI can display it beside chat icon
        response.setOtp(ride.getOtp());

        // Add driver details if ride is accepted
        if (ride.getRiderId() != null) {
            Optional<Driver> driverOpt = driverRepository.findByUserId(ride.getRiderId());
            Optional<User> userOpt = userRepository.findById(ride.getRiderId());
            
            if (driverOpt.isPresent() && userOpt.isPresent()) {
                Driver driver = driverOpt.get();
                User user = userOpt.get();
                response.setDriverName(user.getName());
                response.setVehicleNumber(driver.getVehicleNumber());
                response.setRating(driver.getRating());
            }
        }

        return ResponseEntity.ok(response);
    }

    @GetMapping("/available")
    public ResponseEntity<List<RideResponse>> getAvailableRides() {
        List<Ride> rides = rideRepository.findByStatus("REQUESTED");
        List<RideResponse> responses = rides.stream().map(ride -> {
            RideResponse response = new RideResponse(
                ride.getBookingId(),
                ride.getPickupLocation(),
                ride.getDropLocation(),
                ride.getVehicleType(),
                ride.getFare(),
                ride.getStatus()
            );
            response.setRequestedAt(ride.getRequestedAt());
            return response;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(responses);
    }

    @GetMapping("/available/nearby")
    public ResponseEntity<List<Map<String, Object>>> getAvailableNearbyRides(
            @RequestParam Double lat,
            @RequestParam Double lng,
            @RequestParam(defaultValue = "10") Double radiusKm) {
        
        List<Ride> rides = rideRepository.findByStatus("REQUESTED");
        List<Map<String, Object>> nearbyRides = new ArrayList<>();

        for (Ride ride : rides) {
            if (ride.getPickupLat() != null && ride.getPickupLng() != null) {
                double distance = calculateDistance(lat, lng, ride.getPickupLat(), ride.getPickupLng());
                
                if (distance <= radiusKm) {
                    Map<String, Object> rideInfo = new HashMap<>();
                    rideInfo.put("bookingId", ride.getBookingId());
                    rideInfo.put("pickupLocation", ride.getPickupLocation());
                    rideInfo.put("dropLocation", ride.getDropLocation());
                    rideInfo.put("vehicleType", ride.getVehicleType());
                    rideInfo.put("fare", ride.getFare());
                    rideInfo.put("status", ride.getStatus());
                    rideInfo.put("pickupLat", ride.getPickupLat());
                    rideInfo.put("pickupLng", ride.getPickupLng());
                    rideInfo.put("dropLat", ride.getDropLat());
                    rideInfo.put("dropLng", ride.getDropLng());
                    rideInfo.put("distance", Math.round(distance * 10.0) / 10.0); // Round to 1 decimal
                    rideInfo.put("requestedAt", ride.getRequestedAt());
                    nearbyRides.add(rideInfo);
                }
            }
        }

        // Sort by distance (nearest first)
        nearbyRides.sort((a, b) -> Double.compare((Double)a.get("distance"), (Double)b.get("distance")));

        return ResponseEntity.ok(nearbyRides);
    }

    /**
     * Clears/cancels pending ride requests for a customer that are older than a threshold.
     * Default threshold: 5 minutes. This aligns with the frontend call:
     * DELETE /api/rides/customer/{customerId}/clear-pending
     */
    @DeleteMapping("/customer/{customerId}/clear-pending")
    public ResponseEntity<?> clearPendingForCustomer(
            @PathVariable Long customerId,
            @RequestParam(name = "olderThanMinutes", required = false) Integer olderThanMinutes
    ) {
        try {
            int threshold = (olderThanMinutes != null && olderThanMinutes > 0) ? olderThanMinutes : 5;
            LocalDateTime cutoff = LocalDateTime.now().minusMinutes(threshold);

            List<Ride> customerRides = rideRepository.findByCustomerId(customerId);
            int cancelled = 0;
            for (Ride r : customerRides) {
                try {
                    if ("REQUESTED".equalsIgnoreCase(r.getStatus())) {
                        LocalDateTime requestedAt = r.getRequestedAt();
                        if (requestedAt == null || requestedAt.isBefore(cutoff)) {
                            r.setStatus("CANCELLED");
                            rideRepository.save(r);
                            cancelled++;
                        }
                    }
                } catch (Exception ignore) {}
            }

            return ResponseEntity.ok(Map.of(
                "success", true,
                "cancelled", cancelled,
                "olderThanMinutes", threshold
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("success", false, "error", "Failed to clear pending rides: " + e.getMessage()));
        }
    }

    @GetMapping("/nearby")
    public ResponseEntity<List<Map<String, Object>>> getNearbyRides(
            @RequestParam Double latitude,
            @RequestParam Double longitude,
            @RequestParam(defaultValue = "10") Double radius,
            @RequestParam(required = false) Long driverId,
            @RequestParam(required = false) Double minDistance,
            @RequestParam(required = false) Double maxDistance,
            @RequestParam(required = false) Double minFare) {
        
        List<Ride> rides = rideRepository.findByStatus("REQUESTED");
        List<Map<String, Object>> nearbyRides = new ArrayList<>();

        for (Ride ride : rides) {
            if (ride.getPickupLat() != null && ride.getPickupLng() != null) {
                // Calculate distance from driver to pickup
                double pickupDistance = calculateDistance(latitude, longitude, ride.getPickupLat(), ride.getPickupLng());
                
                // Calculate total ride distance
                double rideDistance = calculateDistance(ride.getPickupLat(), ride.getPickupLng(), ride.getDropLat(), ride.getDropLng());
                
                // Apply filters
                if (pickupDistance > radius) continue;
                if (minDistance != null && rideDistance < minDistance) continue;
                if (maxDistance != null && rideDistance > maxDistance) continue;
                if (minFare != null && ride.getFare() < minFare) continue;
                
                Map<String, Object> rideInfo = new HashMap<>();
                rideInfo.put("bookingId", ride.getBookingId());
                rideInfo.put("pickupLocation", ride.getPickupLocation());
                rideInfo.put("dropLocation", ride.getDropLocation());
                rideInfo.put("vehicleType", ride.getVehicleType());
                rideInfo.put("fare", ride.getFare());
                rideInfo.put("status", ride.getStatus());
                rideInfo.put("pickupLat", ride.getPickupLat());
                rideInfo.put("pickupLng", ride.getPickupLng());
                rideInfo.put("dropLat", ride.getDropLat());
                rideInfo.put("dropLng", ride.getDropLng());
                rideInfo.put("pickupDistance", Math.round(pickupDistance * 10.0) / 10.0);
                rideInfo.put("rideDistance", Math.round(rideDistance * 10.0) / 10.0);
                rideInfo.put("requestedAt", ride.getRequestedAt());
                nearbyRides.add(rideInfo);
            }
        }

        // Sort by pickup distance (nearest first)
        nearbyRides.sort((a, b) -> Double.compare((Double)a.get("pickupDistance"), (Double)b.get("pickupDistance")));

        return ResponseEntity.ok(nearbyRides);
    }

    // Helper methods
    private double calculateDistance(Double lat1, Double lng1, Double lat2, Double lng2) {
        if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) {
            return 10.0; // Default 10km
        }
        // Haversine formula for distance calculation
        double R = 6371; // Radius of Earth in km
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                   Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                   Math.sin(dLng / 2) * Math.sin(dLng / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private double getBaseFare(String vehicleType) {
        switch (vehicleType.toLowerCase()) {
            case "share": return 30.0;
            case "bike": return 40.0;
            case "auto": return 50.0;
            case "car": return 80.0;
            default: return 50.0;
        }
    }
}
