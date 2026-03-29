package com.municipality.pothole.service;

import com.municipality.pothole.client.AIAnalysisResult;
import com.municipality.pothole.client.AIServiceClient;
import com.municipality.pothole.dto.response.PotholeReportResponse;
import com.municipality.pothole.model.*;
import com.municipality.pothole.repository.PotholeReportRepository;
import com.municipality.pothole.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PotholeService {

    private final PotholeReportRepository potholeReportRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final AIServiceClient aiServiceClient;

    @Transactional
    public PotholeReportResponse reportPothole(
            MultipartFile image, double latitude, double longitude,
            String address,
            Double measuredLength, Double measuredWidth, Double measuredDepth, Double concreteKg,
            Integer wheelsFit,
            Long citizenId) {

        User citizen = userRepository.findById(citizenId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        String imageUrl = fileStorageService.storeFile(image, "potholes");

        PotholeReport report = PotholeReport.builder()
                .citizen(citizen)
                .imageUrl(imageUrl)
                .latitude(BigDecimal.valueOf(latitude))
                .longitude(BigDecimal.valueOf(longitude))
                .address(address)
                .status(ReportStatus.PENDING_AI)
                .measuredLengthCm(measuredLength != null ? BigDecimal.valueOf(measuredLength) : null)
                .measuredWidthCm(measuredWidth  != null ? BigDecimal.valueOf(measuredWidth)  : null)
                .measuredDepthCm(measuredDepth  != null ? BigDecimal.valueOf(measuredDepth)  : null)
                .concreteEstimateKg(concreteKg  != null ? BigDecimal.valueOf(concreteKg)     : null)
                .wheelsFit(wheelsFit)
                .build();

        report = potholeReportRepository.save(report);

        // Call AI service
        AIAnalysisResult aiResult = aiServiceClient.analyzeImage(image);
        log.info("AI analysis for report {}: isPothole={}, severity={}, confidence={}",
                report.getId(), aiResult.isPothole(), aiResult.getSeverity(), aiResult.getConfidence());

        if (aiResult.isPothole()) {
            report.setStatus(ReportStatus.AI_VERIFIED);
            report.setSeverity(parseSeverity(aiResult.getSeverity()));
        } else {
            report.setStatus(ReportStatus.REJECTED);
        }

        report.setAiConfidence(BigDecimal.valueOf(aiResult.getConfidence()));
        report.setEstimatedDiameter(BigDecimal.valueOf(aiResult.getEstimatedDiameterCm()));
        report.setEstimatedDepth(BigDecimal.valueOf(aiResult.getEstimatedDepthCm()));

        report = potholeReportRepository.save(report);
        return toResponse(report);
    }

    @Transactional(readOnly = true)
    public List<PotholeReportResponse> getAllReports(String severityFilter, String statusFilter) {
        List<PotholeReport> reports;
        if (severityFilter != null && !severityFilter.isBlank()) {
            reports = potholeReportRepository.findBySeverity(Severity.valueOf(severityFilter.toUpperCase()));
        } else if (statusFilter != null && !statusFilter.isBlank()) {
            reports = potholeReportRepository.findByStatus(ReportStatus.valueOf(statusFilter.toUpperCase()));
        } else {
            reports = potholeReportRepository.findAll();
        }
        return reports.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<PotholeReportResponse> getReportsByBoundingBox(
            double minLat, double maxLat, double minLng, double maxLng) {
        return potholeReportRepository
                .findByBoundingBox(minLat, maxLat, minLng, maxLng)
                .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<PotholeReportResponse> getCitizenReports(Long citizenId) {
        return potholeReportRepository.findByCitizenId(citizenId)
                .stream().map(this::toResponse).toList();
    }

    @Transactional
    public PotholeReportResponse verifyReport(Long reportId) {
        PotholeReport report = potholeReportRepository.findById(reportId)
                .orElseThrow(() -> new IllegalArgumentException("Report not found"));
        report.setStatus(ReportStatus.AI_VERIFIED);
        return toResponse(potholeReportRepository.save(report));
    }

    @Transactional(readOnly = true)
    public PotholeReportResponse getReportById(Long reportId) {
        return potholeReportRepository.findById(reportId)
                .map(this::toResponse)
                .orElseThrow(() -> new IllegalArgumentException("Report not found"));
    }

    private Severity parseSeverity(String s) {
        try {
            return Severity.valueOf(s.toUpperCase());
        } catch (Exception e) {
            return Severity.MEDIUM;
        }
    }

    public PotholeReportResponse toResponse(PotholeReport r) {
        return PotholeReportResponse.builder()
                .id(r.getId())
                .citizenId(r.getCitizen().getId())
                .citizenName(r.getCitizen().getName())
                .imageUrl(r.getImageUrl())
                .latitude(r.getLatitude())
                .longitude(r.getLongitude())
                .address(r.getAddress())
                .severity(r.getSeverity() != null ? r.getSeverity().name() : null)
                .status(r.getStatus().name())
                .aiConfidence(r.getAiConfidence())
                .estimatedDiameter(r.getEstimatedDiameter())
                .estimatedDepth(r.getEstimatedDepth())
                .measuredLengthCm(r.getMeasuredLengthCm())
                .measuredWidthCm(r.getMeasuredWidthCm())
                .measuredDepthCm(r.getMeasuredDepthCm())
                .concreteEstimateKg(r.getConcreteEstimateKg())
                .wheelsFit(r.getWheelsFit())
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .build();
    }
}
