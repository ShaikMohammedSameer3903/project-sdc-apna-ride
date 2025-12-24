package com.apnaride.repository;

import com.apnaride.model.PromoCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface PromoCodeRepository extends JpaRepository<PromoCode, Long> {
    Optional<PromoCode> findByCode(String code);
    List<PromoCode> findByIsActive(Boolean isActive);
    List<PromoCode> findByIsActiveTrue();
}
