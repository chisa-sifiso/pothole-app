package com.municipality.pothole.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "contractor_profiles")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContractorProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "company_name", nullable = false)
    private String companyName;

    @Column(name = "registration_number", nullable = false, unique = true)
    private String registrationNumber;

    @Column(nullable = false, precision = 3, scale = 2)
    @Builder.Default
    private BigDecimal rating = BigDecimal.ZERO;

    @Column(name = "completed_jobs", nullable = false)
    @Builder.Default
    private Integer completedJobs = 0;
}
