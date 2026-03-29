package com.municipality.pothole.model;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "repair_tasks")
@EntityListeners(AuditingEntityListener.class)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RepairTask {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bid_id", nullable = false, unique = true)
    private Bid bid;

    @CreatedDate
    @Column(name = "assigned_at", nullable = false, updatable = false)
    private LocalDateTime assignedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private TaskStatus status = TaskStatus.ASSIGNED;

    @Column(name = "before_image_url", length = 500)
    private String beforeImageUrl;

    @Column(name = "after_image_url", length = 500)
    private String afterImageUrl;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;
}
