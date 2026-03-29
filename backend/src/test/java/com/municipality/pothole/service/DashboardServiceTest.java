package com.municipality.pothole.service;

import com.municipality.pothole.dto.response.DashboardStatsResponse;
import com.municipality.pothole.model.RFQStatus;
import com.municipality.pothole.model.ReportStatus;
import com.municipality.pothole.model.Severity;
import com.municipality.pothole.repository.PotholeReportRepository;
import com.municipality.pothole.repository.RFQRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {

    @Mock PotholeReportRepository potholeReportRepository;
    @Mock RFQRepository           rfqRepository;

    @InjectMocks DashboardService dashboardService;

    @Test
    void getStats_returnsAggregatedCounts() {
        when(potholeReportRepository.count()).thenReturn(100L);
        when(potholeReportRepository.countByStatus(ReportStatus.PENDING_AI)).thenReturn(10L);
        when(potholeReportRepository.countByStatus(ReportStatus.AI_VERIFIED)).thenReturn(30L);
        when(potholeReportRepository.countByStatus(ReportStatus.RFQ_GENERATED)).thenReturn(15L);
        when(potholeReportRepository.countByStatus(ReportStatus.ASSIGNED)).thenReturn(5L);
        when(potholeReportRepository.countByStatus(ReportStatus.IN_PROGRESS)).thenReturn(20L);
        when(potholeReportRepository.countByStatus(ReportStatus.COMPLETED)).thenReturn(18L);
        when(potholeReportRepository.countByStatus(ReportStatus.REJECTED)).thenReturn(2L);
        when(potholeReportRepository.countBySeverity(Severity.LOW)).thenReturn(5L);
        when(potholeReportRepository.countBySeverity(Severity.MEDIUM)).thenReturn(15L);
        when(potholeReportRepository.countBySeverity(Severity.HIGH)).thenReturn(20L);
        when(potholeReportRepository.countBySeverity(Severity.CRITICAL)).thenReturn(8L);
        when(potholeReportRepository.countByDay(any())).thenReturn(List.of());
        when(rfqRepository.countByStatus(RFQStatus.OPEN)).thenReturn(7L);

        DashboardStatsResponse stats = dashboardService.getStats();

        assertThat(stats.getTotalReports()).isEqualTo(100L);
        assertThat(stats.getPendingAi()).isEqualTo(10L);
        assertThat(stats.getAiVerified()).isEqualTo(30L);
        // rfqGenerated = RFQ_GENERATED + ASSIGNED = 15 + 5 = 20
        assertThat(stats.getRfqGenerated()).isEqualTo(20L);
        assertThat(stats.getInProgress()).isEqualTo(20L);
        assertThat(stats.getCompleted()).isEqualTo(18L);
        assertThat(stats.getRejected()).isEqualTo(2L);
        assertThat(stats.getOpenRFQs()).isEqualTo(7L);
    }

    @Test
    void getStats_severityBreakdown_containsAllSeverities() {
        when(potholeReportRepository.count()).thenReturn(0L);
        when(potholeReportRepository.countByStatus(any())).thenReturn(0L);
        when(potholeReportRepository.countBySeverity(Severity.LOW)).thenReturn(3L);
        when(potholeReportRepository.countBySeverity(Severity.MEDIUM)).thenReturn(7L);
        when(potholeReportRepository.countBySeverity(Severity.HIGH)).thenReturn(2L);
        when(potholeReportRepository.countBySeverity(Severity.CRITICAL)).thenReturn(1L);
        when(potholeReportRepository.countByDay(any())).thenReturn(List.of());
        when(rfqRepository.countByStatus(any())).thenReturn(0L);

        DashboardStatsResponse stats = dashboardService.getStats();

        assertThat(stats.getSeverityBreakdown())
                .containsEntry("LOW", 3L)
                .containsEntry("MEDIUM", 7L)
                .containsEntry("HIGH", 2L)
                .containsEntry("CRITICAL", 1L);
    }

    @Test
    void getStats_reportsByDay_mappedCorrectly() {
        when(potholeReportRepository.count()).thenReturn(0L);
        when(potholeReportRepository.countByStatus(any())).thenReturn(0L);
        when(potholeReportRepository.countBySeverity(any())).thenReturn(0L);
        when(rfqRepository.countByStatus(any())).thenReturn(0L);

        Object[] row1 = {"2026-03-01", 5};
        Object[] row2 = {"2026-03-02", 8};
        when(potholeReportRepository.countByDay(any())).thenReturn(List.of(row1, row2));

        DashboardStatsResponse stats = dashboardService.getStats();

        assertThat(stats.getReportsByDay()).hasSize(2);
        assertThat(stats.getReportsByDay().get(0).getDate()).isEqualTo("2026-03-01");
        assertThat(stats.getReportsByDay().get(0).getCount()).isEqualTo(5L);
        assertThat(stats.getReportsByDay().get(1).getDate()).isEqualTo("2026-03-02");
        assertThat(stats.getReportsByDay().get(1).getCount()).isEqualTo(8L);
    }

    @Test
    void getStats_emptyDatabase_returnsZeros() {
        when(potholeReportRepository.count()).thenReturn(0L);
        when(potholeReportRepository.countByStatus(any())).thenReturn(0L);
        when(potholeReportRepository.countBySeverity(any())).thenReturn(0L);
        when(potholeReportRepository.countByDay(any())).thenReturn(List.of());
        when(rfqRepository.countByStatus(any())).thenReturn(0L);

        DashboardStatsResponse stats = dashboardService.getStats();

        assertThat(stats.getTotalReports()).isZero();
        assertThat(stats.getOpenRFQs()).isZero();
        assertThat(stats.getReportsByDay()).isEmpty();
    }
}
