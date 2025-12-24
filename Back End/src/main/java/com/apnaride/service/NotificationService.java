package com.apnaride.service;

import com.apnaride.model.Notification;
import com.apnaride.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    /**
     * Create and send notification
     */
    public Notification sendNotification(Long userId, String type, String title, String message, String data) {
        Notification notification = new Notification();
        notification.setUserId(userId);
        notification.setType(type);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setData(data);
        notification.setIsRead(false);
        notification.setIsSent(true);
        notification.setCreatedAt(LocalDateTime.now());
        
        // Here you would integrate with FCM/SMS/Email service
        // For now, just save to database
        
        return notificationRepository.save(notification);
    }

    /**
     * Send ride request notification to driver
     */
    public void notifyDriverAboutRide(Long driverId, String rideId, String pickupLocation) {
        sendNotification(
            driverId,
            "RIDE_REQUEST",
            "New Ride Request",
            "Pickup from " + pickupLocation,
            "{\"rideId\":\"" + rideId + "\"}"
        );
    }

    /**
     * Send ride accepted notification to customer
     */
    public void notifyCustomerRideAccepted(Long customerId, String driverName, String vehicleNumber) {
        sendNotification(
            customerId,
            "RIDE_ACCEPTED",
            "Driver Accepted!",
            driverName + " is on the way. Vehicle: " + vehicleNumber,
            null
        );
    }

    /**
     * Send ride completed notification
     */
    public void notifyRideCompleted(Long userId, Double fare) {
        sendNotification(
            userId,
            "RIDE_COMPLETED",
            "Ride Completed",
            "Your ride has been completed. Fare: ₹" + fare,
            null
        );
    }

    /**
     * Get unread notifications for user
     */
    public List<Notification> getUnreadNotifications(Long userId) {
        return notificationRepository.findByUserIdAndIsRead(userId, false);
    }

    /**
     * Mark notification as read
     */
    public void markAsRead(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        
        notification.setIsRead(true);
        notification.setReadAt(LocalDateTime.now());
        notificationRepository.save(notification);
    }

    /**
     * Get all notifications for user
     */
    public List<Notification> getUserNotifications(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }
}
