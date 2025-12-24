package com.apnaride.service;

import com.apnaride.model.PaymentTransaction;
import com.apnaride.repository.PaymentTransactionRepository;
import com.apnaride.dto.PaymentIntentRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class PaymentService {

    @Autowired
    private PaymentTransactionRepository paymentTransactionRepository;

    /**
     * Create a payment intent (placeholder for Razorpay/Stripe integration)
     */
    public PaymentTransaction createPaymentIntent(PaymentIntentRequest request) {
        PaymentTransaction transaction = new PaymentTransaction();
        transaction.setRideId(request.getRideId());
        transaction.setCustomerId(request.getCustomerId());
        transaction.setAmount(request.getAmount());
        transaction.setCurrency(request.getCurrency());
        transaction.setPaymentMethod(request.getPaymentMethod());
        transaction.setTransactionId("TXN-" + UUID.randomUUID().toString());
        transaction.setStatus("PENDING");
        transaction.setCreatedAt(LocalDateTime.now());
        
        return paymentTransactionRepository.save(transaction);
    }

    /**
     * Process payment (placeholder - integrate with actual payment gateway)
     */
    public PaymentTransaction processPayment(Long transactionId, String gatewayResponse) {
        PaymentTransaction transaction = paymentTransactionRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));
        
        // Simulate payment processing
        if ("CASH".equals(transaction.getPaymentMethod())) {
            transaction.setStatus("SUCCESS");
        } else {
            // Here you would integrate with Razorpay/Stripe
            transaction.setStatus("SUCCESS");
        }
        
        transaction.setGatewayResponse(gatewayResponse);
        transaction.setCompletedAt(LocalDateTime.now());
        
        return paymentTransactionRepository.save(transaction);
    }

    /**
     * Refund payment
     */
    public PaymentTransaction refundPayment(Long transactionId, String reason) {
        PaymentTransaction transaction = paymentTransactionRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));
        
        if (!"SUCCESS".equals(transaction.getStatus())) {
            throw new RuntimeException("Cannot refund non-successful transaction");
        }
        
        transaction.setStatus("REFUNDED");
        transaction.setGatewayResponse("Refunded: " + reason);
        
        return paymentTransactionRepository.save(transaction);
    }

    /**
     * Get payment by ride ID
     */
    public PaymentTransaction getPaymentByRideId(Long rideId) {
        return paymentTransactionRepository.findByRideId(rideId).stream()
                .findFirst()
                .orElse(null);
    }
}
