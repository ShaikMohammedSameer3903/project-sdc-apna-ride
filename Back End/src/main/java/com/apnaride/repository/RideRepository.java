package com.apnaride.repository;

import com.apnaride.model.Ride;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RideRepository extends JpaRepository<Ride, Long> {
    Optional<Ride> findByBookingId(String bookingId);
    List<Ride> findByCustomerId(Long customerId);
    List<Ride> findByRiderId(Long riderId);
    List<Ride> findByStatus(String status);
}
