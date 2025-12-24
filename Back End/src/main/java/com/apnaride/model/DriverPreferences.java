package com.apnaride.model;

import jakarta.persistence.*;

@Entity
@Table(name = "driver_preferences")
public class DriverPreferences {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private Long driverId;
    
    // Distance preferences (in kilometers)
    private Double minDistanceKm;
    private Double maxDistanceKm;
    
    // Fare preferences
    private Double minFare;
    
    // Vehicle type preferences (comma-separated)
    private String preferredVehicleTypes;
    
    // Time preferences
    private Boolean acceptNightRides;
    private Boolean acceptWeekendRides;
    
    // Area preferences
    private String preferredAreas; // comma-separated city/area names
    private String avoidAreas; // comma-separated city/area names
    
    // Auto-accept settings
    private Boolean autoAcceptEnabled;
    private Double autoAcceptMaxDistance;
    private Double autoAcceptMinFare;

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getDriverId() {
        return driverId;
    }

    public void setDriverId(Long driverId) {
        this.driverId = driverId;
    }

    public Double getMinDistanceKm() {
        return minDistanceKm;
    }

    public void setMinDistanceKm(Double minDistanceKm) {
        this.minDistanceKm = minDistanceKm;
    }

    public Double getMaxDistanceKm() {
        return maxDistanceKm;
    }

    public void setMaxDistanceKm(Double maxDistanceKm) {
        this.maxDistanceKm = maxDistanceKm;
    }

    public Double getMinFare() {
        return minFare;
    }

    public void setMinFare(Double minFare) {
        this.minFare = minFare;
    }

    public String getPreferredVehicleTypes() {
        return preferredVehicleTypes;
    }

    public void setPreferredVehicleTypes(String preferredVehicleTypes) {
        this.preferredVehicleTypes = preferredVehicleTypes;
    }

    public Boolean getAcceptNightRides() {
        return acceptNightRides;
    }

    public void setAcceptNightRides(Boolean acceptNightRides) {
        this.acceptNightRides = acceptNightRides;
    }

    public Boolean getAcceptWeekendRides() {
        return acceptWeekendRides;
    }

    public void setAcceptWeekendRides(Boolean acceptWeekendRides) {
        this.acceptWeekendRides = acceptWeekendRides;
    }

    public String getPreferredAreas() {
        return preferredAreas;
    }

    public void setPreferredAreas(String preferredAreas) {
        this.preferredAreas = preferredAreas;
    }

    public String getAvoidAreas() {
        return avoidAreas;
    }

    public void setAvoidAreas(String avoidAreas) {
        this.avoidAreas = avoidAreas;
    }

    public Boolean getAutoAcceptEnabled() {
        return autoAcceptEnabled;
    }

    public void setAutoAcceptEnabled(Boolean autoAcceptEnabled) {
        this.autoAcceptEnabled = autoAcceptEnabled;
    }

    public Double getAutoAcceptMaxDistance() {
        return autoAcceptMaxDistance;
    }

    public void setAutoAcceptMaxDistance(Double autoAcceptMaxDistance) {
        this.autoAcceptMaxDistance = autoAcceptMaxDistance;
    }

    public Double getAutoAcceptMinFare() {
        return autoAcceptMinFare;
    }

    public void setAutoAcceptMinFare(Double autoAcceptMinFare) {
        this.autoAcceptMinFare = autoAcceptMinFare;
    }
}
