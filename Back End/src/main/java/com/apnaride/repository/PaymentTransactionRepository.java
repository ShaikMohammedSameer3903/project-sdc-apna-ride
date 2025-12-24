package com.apnaride.repository;

import com.apnaride.model.PaymentTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, Long> {
    List<PaymentTransaction> findByCustomerId(Long customerId);
    List<PaymentTransaction> findByDriverId(Long driverId);
    List<PaymentTransaction> findByRideId(Long rideId);
    List<PaymentTransaction> findByStatus(String status);
    Optional<PaymentTransaction> findByTransactionId(String transactionId);
}
