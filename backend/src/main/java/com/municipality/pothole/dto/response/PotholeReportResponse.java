package com.municipality.pothole.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PotholeReportResponse {
    private Long id;
    private Long citizenId;
    private String citizenName;
    private String imageUrl;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private String address;
    private String severity;
    private String status;
    private BigDecimal aiConfidence;
    private BigDecimal estimatedDiameter;
    private BigDecimal estimatedDepth;
    // AR/camera measurements submitted by citizen
    private BigDecimal measuredLengthCm;
    private BigDecimal measuredWidthCm;
    private BigDecimal measuredDepthCm;
    private BigDecimal concreteEstimateKg;
    private Integer wheelsFit;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
