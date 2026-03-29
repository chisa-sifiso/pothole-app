package com.municipality.pothole.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RFQResponse {
    private Long id;
    private PotholeReportResponse potholeReport;
    private LocalDateTime generatedAt;
    private LocalDate deadline;
    private String status;
    private int bidCount;
}
