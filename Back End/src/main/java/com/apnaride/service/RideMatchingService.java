package com.apnaride.service;

import com.apnaride.model.Driver;
import com.apnaride.repository.DriverRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class RideMatchingService {

    @Autowired
    private DriverRepository driverRepository;

    /**
     * Find the best driver for a ride based on proximity and availability
     */
    public Optional<Driver> findBestDriver(Double pickupLat, Double pickupLng, String vehicleType) {
        List<Driver> availableDrivers = driverRepository.findByIsOnlineAndIsAvailable(true, true);
        
        // Filter by vehicle type
        List<Driver> matchingDrivers = availableDrivers.stream()
                .filter(driver -> driver.getVehicleType().equalsIgnoreCase(vehicleType))
                .collect(Collectors.toList());
        
        if (matchingDrivers.isEmpty()) {
            return Optional.empty();
        }
        
        // Find nearest driver
        Driver nearestDriver = null;
        double minDistance = Double.MAX_VALUE;
        
        for (Driver driver : matchingDrivers) {
            if (driver.getCurrentLat() != null && driver.getCurrentLng() != null) {
                double distance = calculateDistance(
                    pickupLat, pickupLng,
                    driver.getCurrentLat(), driver.getCurrentLng()
                );
                
                if (distance < minDistance) {
                    minDistance = distance;
                    nearestDriver = driver;
                }
            }
        }
        
        return Optional.ofNullable(nearestDriver);
    }

    /**
     * Calculate distance between two points using Haversine formula
     */
    private double calculateDistance(Double lat1, Double lng1, Double lat2, Double lng2) {
        if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) {
            return Double.MAX_VALUE;
        }
        
        double R = 6371; // Earth's radius in km
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                   Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                   Math.sin(dLng / 2) * Math.sin(dLng / 2);
        
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        
        return R * c;
    }

    /**
     * Get all available drivers within radius
     */
    public List<Driver> getDriversWithinRadius(Double lat, Double lng, Double radiusKm) {
        List<Driver> availableDrivers = driverRepository.findByIsOnlineAndIsAvailable(true, true);
        
        return availableDrivers.stream()
                .filter(driver -> {
                    if (driver.getCurrentLat() == null || driver.getCurrentLng() == null) {
                        return false;
                    }
                    double distance = calculateDistance(lat, lng, driver.getCurrentLat(), driver.getCurrentLng());
                    return distance <= radiusKm;
                })
                .collect(Collectors.toList());
    }
}
