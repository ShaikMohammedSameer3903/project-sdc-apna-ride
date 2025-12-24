package com.apnaride.controller;

import com.apnaride.model.DriverPreferences;
import com.apnaride.repository.DriverPreferencesRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/driver-preferences")
@CrossOrigin(origins = "*")
public class DriverPreferencesController {

    @Autowired
    private DriverPreferencesRepository preferencesRepository;

    @GetMapping("/{driverId}")
    public ResponseEntity<?> getPreferences(@PathVariable Long driverId) {
        Optional<DriverPreferences> preferences = preferencesRepository.findByDriverId(driverId);
        
        if (preferences.isEmpty()) {
            // Return default preferences
            DriverPreferences defaultPrefs = new DriverPreferences();
            defaultPrefs.setDriverId(driverId);
            defaultPrefs.setMinDistanceKm(0.0);
            defaultPrefs.setMaxDistanceKm(50.0);
            defaultPrefs.setMinFare(0.0);
            defaultPrefs.setAcceptNightRides(true);
            defaultPrefs.setAcceptWeekendRides(true);
            defaultPrefs.setAutoAcceptEnabled(false);
            return ResponseEntity.ok(defaultPrefs);
        }
        
        return ResponseEntity.ok(preferences.get());
    }

    @PostMapping("/{driverId}")
    public ResponseEntity<?> savePreferences(
            @PathVariable Long driverId,
            @RequestBody DriverPreferences preferences) {
        
        Optional<DriverPreferences> existing = preferencesRepository.findByDriverId(driverId);
        
        if (existing.isPresent()) {
            DriverPreferences existingPrefs = existing.get();
            existingPrefs.setMinDistanceKm(preferences.getMinDistanceKm());
            existingPrefs.setMaxDistanceKm(preferences.getMaxDistanceKm());
            existingPrefs.setMinFare(preferences.getMinFare());
            existingPrefs.setPreferredVehicleTypes(preferences.getPreferredVehicleTypes());
            existingPrefs.setAcceptNightRides(preferences.getAcceptNightRides());
            existingPrefs.setAcceptWeekendRides(preferences.getAcceptWeekendRides());
            existingPrefs.setPreferredAreas(preferences.getPreferredAreas());
            existingPrefs.setAvoidAreas(preferences.getAvoidAreas());
            existingPrefs.setAutoAcceptEnabled(preferences.getAutoAcceptEnabled());
            existingPrefs.setAutoAcceptMaxDistance(preferences.getAutoAcceptMaxDistance());
            existingPrefs.setAutoAcceptMinFare(preferences.getAutoAcceptMinFare());
            
            DriverPreferences saved = preferencesRepository.save(existingPrefs);
            return ResponseEntity.ok(saved);
        } else {
            preferences.setDriverId(driverId);
            DriverPreferences saved = preferencesRepository.save(preferences);
            return ResponseEntity.ok(saved);
        }
    }

    @PutMapping("/{driverId}")
    public ResponseEntity<?> updatePreferences(
            @PathVariable Long driverId,
            @RequestBody DriverPreferences preferences) {
        return savePreferences(driverId, preferences);
    }

    @DeleteMapping("/{driverId}")
    public ResponseEntity<?> deletePreferences(@PathVariable Long driverId) {
        Optional<DriverPreferences> preferences = preferencesRepository.findByDriverId(driverId);
        
        if (preferences.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Preferences not found");
        }
        
        preferencesRepository.delete(preferences.get());
        return ResponseEntity.ok("Preferences deleted successfully");
    }
}
