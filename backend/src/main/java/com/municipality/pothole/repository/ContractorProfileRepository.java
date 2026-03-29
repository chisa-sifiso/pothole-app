package com.municipality.pothole.repository;

import com.municipality.pothole.model.ContractorProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ContractorProfileRepository extends JpaRepository<ContractorProfile, Long> {
    Optional<ContractorProfile> findByUserId(Long userId);
}
