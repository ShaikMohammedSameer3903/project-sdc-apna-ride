package com.apnaride.dto;

import java.time.LocalDateTime;

public class RideResponse {
    private String bookingId;
    private String pickupLocation;
    private String dropLocation;
    private String vehicleType;
    private Double fare;
    private String status;
    private LocalDateTime requestedAt;
    private String driverName;
    private String vehicleNumber;
    private Double rating;
    private Double pickupLat;
    private Double pickupLng;
    private Double dropLat;
    private Double dropLng;
    private Long driverId;
    private String otp; // 4-digit OTP for customer display

    public RideResponse() {}

    public RideResponse(String bookingId, String pickupLocation, String dropLocation, 
                       String vehicleType, Double fare, String status) {
        this.bookingId = bookingId;
        this.pickupLocation = pickupLocation;
        this.dropLocation = dropLocation;
        this.vehicleType = vehicleType;
        this.fare = fare;
        this.status = status;
    }

    // Getters and Setters
    public String getBookingId() { return bookingId; }
    public void setBookingId(String bookingId) { this.bookingId = bookingId; }

    public String getPickupLocation() { return pickupLocation; }
    public void setPickupLocation(String pickupLocation) { this.pickupLocation = pickupLocation; }

    public String getDropLocation() { return dropLocation; }
    public void setDropLocation(String dropLocation) { this.dropLocation = dropLocation; }

    public String getVehicleType() { return vehicleType; }
    public void setVehicleType(String vehicleType) { this.vehicleType = vehicleType; }

    public Double getFare() { return fare; }
    public void setFare(Double fare) { this.fare = fare; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getRequestedAt() { return requestedAt; }
    public void setRequestedAt(LocalDateTime requestedAt) { this.requestedAt = requestedAt; }

    public String getDriverName() { return driverName; }
    public void setDriverName(String driverName) { this.driverName = driverName; }

    public String getVehicleNumber() { return vehicleNumber; }
    public void setVehicleNumber(String vehicleNumber) { this.vehicleNumber = vehicleNumber; }

    public Double getRating() { return rating; }
    public void setRating(Double rating) { this.rating = rating; }

    public Double getPickupLat() { return pickupLat; }
    public void setPickupLat(Double pickupLat) { this.pickupLat = pickupLat; }

    public Double getPickupLng() { return pickupLng; }
    public void setPickupLng(Double pickupLng) { this.pickupLng = pickupLng; }

    public Double getDropLat() { return dropLat; }
    public void setDropLat(Double dropLat) { this.dropLat = dropLat; }

    public Double getDropLng() { return dropLng; }
    public void setDropLng(Double dropLng) { this.dropLng = dropLng; }

    public Long getDriverId() { return driverId; }
    public void setDriverId(Long driverId) { this.driverId = driverId; }

    public String getOtp() { return otp; }
    public void setOtp(String otp) { this.otp = otp; }
}
