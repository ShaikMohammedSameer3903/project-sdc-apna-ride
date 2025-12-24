package com.apnaride.dto;

public class ChatMessage {
    private String rideId;
    private Long senderId;
    private String senderType; // "customer" or "driver"
    private String message;
    private String timestamp;

    // Constructors
    public ChatMessage() {}

    public ChatMessage(String rideId, Long senderId, String message) {
        this.rideId = rideId;
        this.senderId = senderId;
        this.message = message;
    }

    // Getters and Setters
    public String getRideId() {
        return rideId;
    }

    public void setRideId(String rideId) {
        this.rideId = rideId;
    }

    public Long getSenderId() {
        return senderId;
    }

    public void setSenderId(Long senderId) {
        this.senderId = senderId;
    }

    public String getSenderType() {
        return senderType;
    }

    public void setSenderType(String senderType) {
        this.senderType = senderType;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }
}
