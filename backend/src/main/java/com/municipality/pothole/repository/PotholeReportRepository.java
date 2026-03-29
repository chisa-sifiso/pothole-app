package com.municipality.pothole.repository;

import com.municipality.pothole.model.PotholeReport;
import com.municipality.pothole.model.ReportStatus;
import com.municipality.pothole.model.Severity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface PotholeReportRepository extends JpaRepository<PotholeReport, Long> {

    List<PotholeReport> findByCitizenId(Long citizenId);

    List<PotholeReport> findByStatus(ReportStatus status);

    List<PotholeReport> findBySeverity(Severity severity);

    @Query("SELECT p FROM PotholeReport p WHERE " +
           "p.latitude BETWEEN :minLat AND :maxLat AND " +
           "p.longitude BETWEEN :minLng AND :maxLng")
    List<PotholeReport> findByBoundingBox(
            @Param("minLat") double minLat,
            @Param("maxLat") double maxLat,
            @Param("minLng") double minLng,
            @Param("maxLng") double maxLng);

    long countByStatus(ReportStatus status);

    long countBySeverity(Severity severity);

    @Query("SELECT CAST(p.createdAt AS date) as day, COUNT(p) as count " +
           "FROM PotholeReport p " +
           "WHERE p.createdAt >= :since " +
           "GROUP BY CAST(p.createdAt AS date) " +
           "ORDER BY CAST(p.createdAt AS date)")
    List<Object[]> countByDay(@Param("since") LocalDateTime since);
}
