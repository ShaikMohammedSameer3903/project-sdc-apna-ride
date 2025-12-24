package com.apnaride.repository;

import com.apnaride.model.Rating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RatingRepository extends JpaRepository<Rating, Long> {
    List<Rating> findByRiderId(Long riderId);
    List<Rating> findByCustomerId(Long customerId);
    List<Rating> findByRideId(Long rideId);
}
