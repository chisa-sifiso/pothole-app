package com.municipality.pothole.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RepairTaskResponse {
    private Long id;
    private Long bidId;
    private Long rfqId;
    private Long potholeReportId;
    private String potholeAddress;
    private String potholeSeverity;
    private String status;
    private String beforeImageUrl;
    private String afterImageUrl;
    private LocalDateTime assignedAt;
    private LocalDateTime completedAt;
}
