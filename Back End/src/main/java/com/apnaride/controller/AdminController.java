package com.apnaride.controller;

import com.apnaride.model.Driver;
import com.apnaride.model.User;
import com.apnaride.model.Ride;
import com.apnaride.repository.DriverRepository;
import com.apnaride.repository.UserRepository;
import com.apnaride.repository.RideRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {

    @Autowired
    private DriverRepository driverRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RideRepository rideRepository;

    // Dashboard Analytics
    @GetMapping("/analytics")
    public ResponseEntity<?> getAnalytics() {
        Map<String, Object> analytics = new HashMap<>();
        
        // Total counts
        analytics.put("totalRides", rideRepository.count());
        analytics.put("totalDrivers", driverRepository.count());
        analytics.put("totalCustomers", userRepository.findAll().stream()
            .filter(u -> "customer".equals(u.getRole())).count());
        
        // Active drivers
        analytics.put("activeDrivers", driverRepository.findByIsOnlineAndIsAvailable(true, true).size());
        
        // Revenue calculation
        List<Ride> completedRides = rideRepository.findByStatus("COMPLETED");
        double totalRevenue = completedRides.stream()
            .mapToDouble(r -> r.getFare() != null ? r.getFare() : 0.0)
            .sum();
        analytics.put("totalRevenue", totalRevenue);
        
        // Today's stats
        LocalDateTime todayStart = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0);
        long todayRides = rideRepository.findAll().stream()
            .filter(r -> r.getRequestedAt() != null && r.getRequestedAt().isAfter(todayStart))
            .count();
        analytics.put("todayRides", todayRides);
        
        double todayRevenue = rideRepository.findAll().stream()
            .filter(r -> r.getRequestedAt() != null && r.getRequestedAt().isAfter(todayStart) 
                && "COMPLETED".equals(r.getStatus()))
            .mapToDouble(r -> r.getFare() != null ? r.getFare() : 0.0)
            .sum();
        analytics.put("todayRevenue", todayRevenue);
        
        // Pending driver approvals
        long pendingApprovals = driverRepository.findAll().stream()
            .filter(d -> "PENDING".equals(d.getVerificationStatus()))
            .count();
        analytics.put("pendingApprovals", pendingApprovals);
        
        // Vehicle type distribution
        Map<String, Long> vehicleDistribution = driverRepository.findAll().stream()
            .collect(Collectors.groupingBy(
                d -> d.getVehicleType() != null ? d.getVehicleType() : "Unknown",
                Collectors.counting()
            ));
        analytics.put("vehicleDistribution", vehicleDistribution);
        
        // Ride status distribution
        Map<String, Long> rideStatusDistribution = rideRepository.findAll().stream()
            .collect(Collectors.groupingBy(
                r -> r.getStatus() != null ? r.getStatus() : "Unknown",
                Collectors.counting()
            ));
        analytics.put("rideStatusDistribution", rideStatusDistribution);
        
        return ResponseEntity.ok(analytics);
    }

    // Driver Management
    @GetMapping("/drivers")
    public ResponseEntity<List<Map<String, Object>>> getAllDrivers() {
        List<Driver> drivers = driverRepository.findAll();
        List<Map<String, Object>> driverDetails = new ArrayList<>();
        
        for (Driver driver : drivers) {
            Map<String, Object> details = new HashMap<>();
            details.put("driver", driver);
            
            // Get user details
            Optional<User> user = userRepository.findById(driver.getUserId());
            user.ifPresent(u -> {
                details.put("name", u.getName());
                details.put("email", u.getEmail());
            });
            
            // Get ride count
            long rideCount = rideRepository.findByRiderId(driver.getUserId()).size();
            details.put("totalRides", rideCount);
            
            driverDetails.add(details);
        }
        
        return ResponseEntity.ok(driverDetails);
    }

    @GetMapping("/drivers/pending")
    public ResponseEntity<List<Map<String, Object>>> getPendingDrivers() {
        List<Driver> pendingDrivers = driverRepository.findAll().stream()
            .filter(d -> "PENDING".equals(d.getVerificationStatus()))
            .collect(Collectors.toList());
        
        List<Map<String, Object>> driverDetails = new ArrayList<>();
        for (Driver driver : pendingDrivers) {
            Map<String, Object> details = new HashMap<>();
            details.put("driver", driver);
            
            Optional<User> user = userRepository.findById(driver.getUserId());
            user.ifPresent(u -> {
                details.put("name", u.getName());
                details.put("email", u.getEmail());
            });
            
            driverDetails.add(details);
        }
        
        return ResponseEntity.ok(driverDetails);
    }

    @PutMapping("/drivers/{driverId}/approve")
    public ResponseEntity<?> approveDriver(@PathVariable Long driverId) {
        Optional<Driver> driverOpt = driverRepository.findById(driverId);
        if (driverOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Driver not found");
        }
        
        Driver driver = driverOpt.get();
        driver.setIsApproved(true);
        driver.setIsVerified(true);
        driver.setVerificationStatus("APPROVED");
        driverRepository.save(driver);
        
        return ResponseEntity.ok("Driver approved successfully");
    }

    @PutMapping("/drivers/{driverId}/reject")
    public ResponseEntity<?> rejectDriver(@PathVariable Long driverId, @RequestBody(required = false) Map<String, String> reason) {
        Optional<Driver> driverOpt = driverRepository.findById(driverId);
        if (driverOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Driver not found");
        }
        
        Driver driver = driverOpt.get();
        driver.setIsApproved(false);
        driver.setIsVerified(false);
        driver.setVerificationStatus("REJECTED");
        driverRepository.save(driver);
        
        return ResponseEntity.ok("Driver rejected");
    }

    @PutMapping("/drivers/{driverId}/suspend")
    public ResponseEntity<?> suspendDriver(@PathVariable Long driverId) {
        Optional<Driver> driverOpt = driverRepository.findById(driverId);
        if (driverOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Driver not found");
        }
        
        Driver driver = driverOpt.get();
        driver.setIsSuspended(true);
        driver.setIsOnline(false);
        driver.setIsAvailable(false);
        driverRepository.save(driver);
        
        return ResponseEntity.ok("Driver suspended successfully");
    }

    @PutMapping("/drivers/{driverId}/activate")
    public ResponseEntity<?> activateDriver(@PathVariable Long driverId) {
        Optional<Driver> driverOpt = driverRepository.findById(driverId);
        if (driverOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Driver not found");
        }
        
        Driver driver = driverOpt.get();
        driver.setIsSuspended(false);
        driver.setIsAvailable(true);
        driverRepository.save(driver);
        
        return ResponseEntity.ok("Driver activated successfully");
    }

    @DeleteMapping("/drivers/{driverId}")
    public ResponseEntity<?> deleteDriver(@PathVariable Long driverId) {
        Optional<Driver> driverOpt = driverRepository.findById(driverId);
        if (driverOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Driver not found");
        }
        
        driverRepository.deleteById(driverId);
        return ResponseEntity.ok("Driver deleted successfully");
    }

    // Customer Management
    @GetMapping("/customers")
    public ResponseEntity<List<Map<String, Object>>> getAllCustomers() {
        List<User> customers = userRepository.findAll().stream()
            .filter(u -> "customer".equals(u.getRole()))
            .collect(Collectors.toList());
        
        List<Map<String, Object>> customerDetails = new ArrayList<>();
        for (User customer : customers) {
            Map<String, Object> details = new HashMap<>();
            details.put("id", customer.getId());
            details.put("name", customer.getName());
            details.put("email", customer.getEmail());
            
            // Get ride count
            long rideCount = rideRepository.findByCustomerId(customer.getId()).size();
            details.put("totalRides", rideCount);
            
            // Calculate total spent
            double totalSpent = rideRepository.findByCustomerId(customer.getId()).stream()
                .filter(r -> "COMPLETED".equals(r.getStatus()))
                .mapToDouble(r -> r.getFare() != null ? r.getFare() : 0.0)
                .sum();
            details.put("totalSpent", totalSpent);
            
            customerDetails.add(details);
        }
        
        return ResponseEntity.ok(customerDetails);
    }

    @DeleteMapping("/customers/{customerId}")
    public ResponseEntity<?> deleteCustomer(@PathVariable Long customerId) {
        Optional<User> userOpt = userRepository.findById(customerId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Customer not found");
        }
        
        userRepository.deleteById(customerId);
        return ResponseEntity.ok("Customer deleted successfully");
    }

    // Ride Management
    @GetMapping("/rides/all")
    public ResponseEntity<List<Map<String, Object>>> getAllRides() {
        List<Ride> rides = rideRepository.findAll();
        List<Map<String, Object>> rideDetails = new ArrayList<>();
        
        for (Ride ride : rides) {
            Map<String, Object> details = new HashMap<>();
            details.put("ride", ride);
            
            // Get customer details
            if (ride.getCustomerId() != null) {
                Optional<User> customer = userRepository.findById(ride.getCustomerId());
                customer.ifPresent(c -> details.put("customerName", c.getName()));
            }
            
            // Get rider details
            if (ride.getRiderId() != null) {
                Optional<User> rider = userRepository.findById(ride.getRiderId());
                rider.ifPresent(r -> details.put("riderName", r.getName()));
            }
            
            rideDetails.add(details);
        }
        
        return ResponseEntity.ok(rideDetails);
    }

    @GetMapping("/rides/stats")
    public ResponseEntity<?> getRideStats() {
        Map<String, Object> stats = new HashMap<>();
        
        List<Ride> allRides = rideRepository.findAll();
        
        // Status-wise count
        Map<String, Long> statusCount = allRides.stream()
            .collect(Collectors.groupingBy(
                r -> r.getStatus() != null ? r.getStatus() : "Unknown",
                Collectors.counting()
            ));
        stats.put("statusCount", statusCount);
        
        // Vehicle type-wise count
        Map<String, Long> vehicleCount = allRides.stream()
            .collect(Collectors.groupingBy(
                r -> r.getVehicleType() != null ? r.getVehicleType() : "Unknown",
                Collectors.counting()
            ));
        stats.put("vehicleCount", vehicleCount);
        
        // Average fare
        double avgFare = allRides.stream()
            .filter(r -> r.getFare() != null)
            .mapToDouble(Ride::getFare)
            .average()
            .orElse(0.0);
        stats.put("averageFare", avgFare);
        
        return ResponseEntity.ok(stats);
    }

    // City-wise statistics
    @GetMapping("/stats/cities")
    public ResponseEntity<?> getCityStats() {
        Map<String, Long> cityStats = driverRepository.findAll().stream()
            .filter(d -> d.getCity() != null)
            .collect(Collectors.groupingBy(Driver::getCity, Collectors.counting()));
        
        return ResponseEntity.ok(cityStats);
    }
}
