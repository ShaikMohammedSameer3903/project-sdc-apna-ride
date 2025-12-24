package com.apnaride.dto;

public class DriverLocationUpdate {
    private Long driverId;
    private Double latitude;
    private Double longitude;
    private Boolean isOnline;
    private Boolean isAvailable;
    private String heading; // Direction in degrees
    private Double speed; // km/h

    // Constructors
    public DriverLocationUpdate() {}

    public DriverLocationUpdate(Long driverId, Double latitude, Double longitude) {
        this.driverId = driverId;
        this.latitude = latitude;
        this.longitude = longitude;
    }

    // Getters and Setters
    public Long getDriverId() { return driverId; }
    public void setDriverId(Long driverId) { this.driverId = driverId; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public Boolean getIsOnline() { return isOnline; }
    public void setIsOnline(Boolean isOnline) { this.isOnline = isOnline; }

    public Boolean getIsAvailable() { return isAvailable; }
    public void setIsAvailable(Boolean isAvailable) { this.isAvailable = isAvailable; }

    public String getHeading() { return heading; }
    public void setHeading(String heading) { this.heading = heading; }

    public Double getSpeed() { return speed; }
    public void setSpeed(Double speed) { this.speed = speed; }
}
