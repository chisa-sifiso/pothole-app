package com.municipality.pothole.model;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "pothole_reports")
@EntityListeners(AuditingEntityListener.class)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PotholeReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "citizen_id", nullable = false)
    private User citizen;

    @Column(name = "image_url", nullable = false, length = 500)
    private String imageUrl;

    @Column(nullable = false, precision = 10, scale = 7)
    private BigDecimal latitude;

    @Column(nullable = false, precision = 10, scale = 7)
    private BigDecimal longitude;

    @Column(length = 500)
    private String address;

    @Enumerated(EnumType.STRING)
    @Column(length = 10)
    private Severity severity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private ReportStatus status = ReportStatus.PENDING_AI;

    @Column(name = "ai_confidence", precision = 5, scale = 4)
    private BigDecimal aiConfidence;

    @Column(name = "estimated_diameter", precision = 6, scale = 2)
    private BigDecimal estimatedDiameter;

    @Column(name = "estimated_depth", precision = 6, scale = 2)
    private BigDecimal estimatedDepth;

    // Citizen-measured dimensions (from AR / camera measurement tool)
    @Column(name = "measured_length_cm", precision = 7, scale = 2)
    private BigDecimal measuredLengthCm;

    @Column(name = "measured_width_cm", precision = 7, scale = 2)
    private BigDecimal measuredWidthCm;

    @Column(name = "measured_depth_cm", precision = 7, scale = 2)
    private BigDecimal measuredDepthCm;

    @Column(name = "concrete_estimate_kg", precision = 9, scale = 2)
    private BigDecimal concreteEstimateKg;

    // Wheel-size estimation submitted by citizen
    @Column(name = "wheels_fit")
    private Integer wheelsFit;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
