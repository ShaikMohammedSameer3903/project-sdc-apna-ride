package com.apnaride.model;

import jakarta.persistence.*;

@Entity
@Table(name = "fare_structures")
public class FareStructure {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String vehicleType;
    private Double baseFare;
    private Double perKmRate;
    private Double perMinuteRate;
    private Double minimumFare;
    private Double cancellationFee;
    private Boolean isActive;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getVehicleType() { return vehicleType; }
    public void setVehicleType(String vehicleType) { this.vehicleType = vehicleType; }

    public Double getBaseFare() { return baseFare; }
    public void setBaseFare(Double baseFare) { this.baseFare = baseFare; }

    public Double getPerKmRate() { return perKmRate; }
    public void setPerKmRate(Double perKmRate) { this.perKmRate = perKmRate; }

    public Double getPerMinuteRate() { return perMinuteRate; }
    public void setPerMinuteRate(Double perMinuteRate) { this.perMinuteRate = perMinuteRate; }

    public Double getMinimumFare() { return minimumFare; }
    public void setMinimumFare(Double minimumFare) { this.minimumFare = minimumFare; }

    public Double getCancellationFee() { return cancellationFee; }
    public void setCancellationFee(Double cancellationFee) { this.cancellationFee = cancellationFee; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
}
