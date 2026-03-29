package com.municipality.pothole.repository;

import com.municipality.pothole.model.RFQ;
import com.municipality.pothole.model.RFQStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RFQRepository extends JpaRepository<RFQ, Long> {
    List<RFQ> findByStatus(RFQStatus status);
    long countByStatus(RFQStatus status);
    Optional<RFQ> findByPotholeReportId(Long potholeReportId);
}
