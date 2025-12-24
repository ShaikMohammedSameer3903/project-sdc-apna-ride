package com.apnaride.repository;

import com.apnaride.model.DriverPreferences;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DriverPreferencesRepository extends JpaRepository<DriverPreferences, Long> {
    Optional<DriverPreferences> findByDriverId(Long driverId);
}
