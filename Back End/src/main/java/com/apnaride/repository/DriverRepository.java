package com.apnaride.repository;

import com.apnaride.model.Driver;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DriverRepository extends JpaRepository<Driver, Long> {
    Optional<Driver> findByUserId(Long userId);
    List<Driver> findByIsOnlineAndIsAvailable(Boolean isOnline, Boolean isAvailable);
    List<Driver> findByIsOnline(Boolean isOnline);
}
