package com.apnaride.dto;

public class RideUpdate {
    private String type; // RIDE_ACCEPTED, DRIVER_LOCATION, RIDE_STARTED, RIDE_COMPLETED
    private String bookingId;
    private String status;
    private Object ride;
    private Double latitude;
    private Double longitude;
    private String message;

    // Constructors
    public RideUpdate() {}

    public RideUpdate(String type, String bookingId, String status) {
        this.type = type;
        this.bookingId = bookingId;
        this.status = status;
    }

    // Getters and Setters
    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getBookingId() {
        return bookingId;
    }

    public void setBookingId(String bookingId) {
        this.bookingId = bookingId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Object getRide() {
        return ride;
    }

    public void setRide(Object ride) {
        this.ride = ride;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
