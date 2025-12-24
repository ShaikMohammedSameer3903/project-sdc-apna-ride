package com.apnaride.dto;

public class PaymentIntentRequest {
    private Long rideId;
    private Long customerId;
    private Double amount;
    private String currency;
    private String paymentMethod; // CARD, UPI, WALLET, CASH
    private String returnUrl;
    private String cancelUrl;

    // Constructors
    public PaymentIntentRequest() {}

    public PaymentIntentRequest(Long rideId, Long customerId, Double amount, String paymentMethod) {
        this.rideId = rideId;
        this.customerId = customerId;
        this.amount = amount;
        this.paymentMethod = paymentMethod;
        this.currency = "INR";
    }

    // Getters and Setters
    public Long getRideId() { return rideId; }
    public void setRideId(Long rideId) { this.rideId = rideId; }

    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }

    public Double getAmount() { return amount; }
    public void setAmount(Double amount) { this.amount = amount; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public String getReturnUrl() { return returnUrl; }
    public void setReturnUrl(String returnUrl) { this.returnUrl = returnUrl; }

    public String getCancelUrl() { return cancelUrl; }
    public void setCancelUrl(String cancelUrl) { this.cancelUrl = cancelUrl; }
}
