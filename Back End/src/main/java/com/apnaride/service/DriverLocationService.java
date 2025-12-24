package com.apnaride.service;

import com.apnaride.model.Driver;
import com.apnaride.repository.DriverRepository;
import com.apnaride.dto.DriverLocationUpdate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class DriverLocationService {

    @Autowired
    private DriverRepository driverRepository;

    /**
     * Update driver's real-time location
     */
    public Driver updateLocation(DriverLocationUpdate locationUpdate) {
        Optional<Driver> driverOpt = driverRepository.findByUserId(locationUpdate.getDriverId());
        
        if (driverOpt.isEmpty()) {
            throw new RuntimeException("Driver not found");
        }
        
        Driver driver = driverOpt.get();
        driver.setCurrentLat(locationUpdate.getLatitude());
        driver.setCurrentLng(locationUpdate.getLongitude());
        driver.setLastActive(LocalDateTime.now());
        
        if (locationUpdate.getIsOnline() != null) {
            driver.setIsOnline(locationUpdate.getIsOnline());
        }
        
        if (locationUpdate.getIsAvailable() != null) {
            driver.setIsAvailable(locationUpdate.getIsAvailable());
        }
        
        return driverRepository.save(driver);
    }

    /**
     * Get all online drivers with their locations
     */
    public List<Driver> getAllOnlineDrivers() {
        return driverRepository.findByIsOnline(true);
    }

    /**
     * Get driver's current location
     */
    public DriverLocationUpdate getDriverLocation(Long driverId) {
        Optional<Driver> driverOpt = driverRepository.findByUserId(driverId);
        
        if (driverOpt.isEmpty()) {
            throw new RuntimeException("Driver not found");
        }
        
        Driver driver = driverOpt.get();
        DriverLocationUpdate location = new DriverLocationUpdate();
        location.setDriverId(driverId);
        location.setLatitude(driver.getCurrentLat());
        location.setLongitude(driver.getCurrentLng());
        location.setIsOnline(driver.getIsOnline());
        location.setIsAvailable(driver.getIsAvailable());
        
        return location;
    }

    /**
     * Check if driver is within service area
     */
    public boolean isWithinServiceArea(Double lat, Double lng) {
        // Placeholder - implement geofencing logic
        // For now, allow all locations
        return true;
    }
}
