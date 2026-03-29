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
public class BidResponse {
    private Long id;
    private Long rfqId;
    private Long contractorId;
    private String contractorName;
    private String companyName;
    private BigDecimal contractorRating;
    private int completedJobs;
    private BigDecimal price;
    private Integer completionDays;
    private String repairMethod;
    private LocalDateTime submittedAt;
    private BigDecimal weightedScore;
    private boolean awarded;
}
