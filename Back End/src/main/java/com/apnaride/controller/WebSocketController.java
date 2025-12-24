package com.apnaride.controller;

import com.apnaride.dto.ChatMessage;
import com.apnaride.dto.LocationUpdate;
import com.apnaride.dto.RideUpdate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.time.LocalDateTime;

@Controller
public class WebSocketController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    /**
     * Handle driver location updates
     * Client sends to: /app/driver-location
     * Broadcast to: /topic/driver-location/{driverId}
     */
    @MessageMapping("/driver-location")
    public void handleDriverLocation(@Payload LocationUpdate locationUpdate) {
        // Broadcast location to all subscribers (customers tracking this driver)
        messagingTemplate.convertAndSend(
            "/topic/driver-location/" + locationUpdate.getDriverId(),
            locationUpdate
        );
    }

    /**
     * Handle chat messages
     * Client sends to: /app/chat
     * Broadcast to: /topic/chat/{rideId}
     */
    @MessageMapping("/chat")
    public void handleChatMessage(@Payload ChatMessage chatMessage) {
        chatMessage.setTimestamp(LocalDateTime.now().toString());
        
        // Broadcast to all participants in the ride
        messagingTemplate.convertAndSend(
            "/topic/chat/" + chatMessage.getRideId(),
            chatMessage
        );
    }

    /**
     * Send ride update notification to customer
     */
    public void sendRideUpdate(Long customerId, RideUpdate update) {
        messagingTemplate.convertAndSend(
            "/topic/ride-updates/" + customerId,
            update
        );
    }

    /**
     * Send ride request to specific driver
     */
    public void sendRideRequest(Long driverId, Object rideRequest) {
        messagingTemplate.convertAndSend(
            "/queue/ride-requests/" + driverId,
            rideRequest
        );
    }

    /**
     * Broadcast ride request to all online drivers in area
     */
    public void broadcastRideRequest(Object rideRequest) {
        messagingTemplate.convertAndSend(
            "/topic/ride-requests",
            rideRequest
        );
    }

    /**
     * Send notification to user
     */
    public void sendNotification(Long userId, String message, String type) {
        messagingTemplate.convertAndSend(
            "/topic/notifications/" + userId,
            new NotificationMessage(message, type, LocalDateTime.now().toString())
        );
    }

    // Inner class for notification messages
    public static class NotificationMessage {
        private String message;
        private String type;
        private String timestamp;

        public NotificationMessage(String message, String type, String timestamp) {
            this.message = message;
            this.type = type;
            this.timestamp = timestamp;
        }

        // Getters and setters
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
        public String getTimestamp() { return timestamp; }
        public void setTimestamp(String timestamp) { this.timestamp = timestamp; }
    }
}
