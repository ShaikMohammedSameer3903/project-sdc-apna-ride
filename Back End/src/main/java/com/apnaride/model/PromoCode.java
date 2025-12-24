package com.apnaride.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "promo_codes")
public class PromoCode {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String code;
    private String description;
    private Double discountPercent;
    private Double maxDiscount;
    private Double minFare;
    private LocalDateTime validFrom;
    private LocalDateTime validUntil;
    private Boolean isActive;
    private Integer usageLimit;
    private Integer usedCount;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Double getDiscountPercent() { return discountPercent; }
    public void setDiscountPercent(Double discountPercent) { this.discountPercent = discountPercent; }

    public Double getMaxDiscount() { return maxDiscount; }
    public void setMaxDiscount(Double maxDiscount) { this.maxDiscount = maxDiscount; }

    public Double getMinFare() { return minFare; }
    public void setMinFare(Double minFare) { this.minFare = minFare; }

    public LocalDateTime getValidFrom() { return validFrom; }
    public void setValidFrom(LocalDateTime validFrom) { this.validFrom = validFrom; }

    public LocalDateTime getValidUntil() { return validUntil; }
    public void setValidUntil(LocalDateTime validUntil) { this.validUntil = validUntil; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    public Integer getUsageLimit() { return usageLimit; }
    public void setUsageLimit(Integer usageLimit) { this.usageLimit = usageLimit; }

    public Integer getUsedCount() { return usedCount; }
    public void setUsedCount(Integer usedCount) { this.usedCount = usedCount; }

    // Convenience methods for controller compatibility
    public boolean isActive() { return isActive != null && isActive; }
    public void setActive(boolean active) { this.isActive = active; }
    
    public LocalDateTime getExpiryDate() { return validUntil; }
    public void setExpiryDate(LocalDateTime expiryDate) { this.validUntil = expiryDate; }
    
    public Integer getMaxUsage() { return usageLimit; }
    public void setMaxUsage(Integer maxUsage) { this.usageLimit = maxUsage; }
    
    public Integer getUsageCount() { return usedCount != null ? usedCount : 0; }
    public void setUsageCount(Integer usageCount) { this.usedCount = usageCount; }
    
    public Double getDiscountPercentage() { return discountPercent; }
    public void setDiscountPercentage(Double discountPercentage) { this.discountPercent = discountPercentage; }
    
    public Double getMaxDiscountAmount() { return maxDiscount; }
    public void setMaxDiscountAmount(Double maxDiscountAmount) { this.maxDiscount = maxDiscountAmount; }
    
    public LocalDateTime getCreatedAt() { return validFrom; }
    public void setCreatedAt(LocalDateTime createdAt) { this.validFrom = createdAt; }
}
