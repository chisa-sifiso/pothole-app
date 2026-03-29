package com.municipality.pothole.service;

import com.municipality.pothole.dto.response.DashboardStatsResponse;
import com.municipality.pothole.model.RFQStatus;
import com.municipality.pothole.model.ReportStatus;
import com.municipality.pothole.model.Severity;
import com.municipality.pothole.repository.PotholeReportRepository;
import com.municipality.pothole.repository.RFQRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final PotholeReportRepository potholeReportRepository;
    private final RFQRepository rfqRepository;

    @Transactional(readOnly = true)
    public DashboardStatsResponse getStats() {
        long total       = potholeReportRepository.count();
        long pendingAi   = potholeReportRepository.countByStatus(ReportStatus.PENDING_AI);
        long aiVerified  = potholeReportRepository.countByStatus(ReportStatus.AI_VERIFIED);
        long rfqGen      = potholeReportRepository.countByStatus(ReportStatus.RFQ_GENERATED);
        long assigned    = potholeReportRepository.countByStatus(ReportStatus.ASSIGNED);
        long inProgress  = potholeReportRepository.countByStatus(ReportStatus.IN_PROGRESS);
        long completed   = potholeReportRepository.countByStatus(ReportStatus.COMPLETED);
        long rejected    = potholeReportRepository.countByStatus(ReportStatus.REJECTED);

        Map<String, Long> severityBreakdown = new HashMap<>();
        for (Severity s : Severity.values()) {
            severityBreakdown.put(s.name(), potholeReportRepository.countBySeverity(s));
        }

        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        List<Object[]> rawCounts = potholeReportRepository.countByDay(thirtyDaysAgo);
        List<DashboardStatsResponse.DailyCount> reportsByDay = rawCounts.stream()
                .map(row -> new DashboardStatsResponse.DailyCount(
                        row[0].toString(),
                        ((Number) row[1]).longValue()
                ))
                .toList();

        long openRFQs = rfqRepository.countByStatus(RFQStatus.OPEN);

        return DashboardStatsResponse.builder()
                .totalReports(total)
                .pendingAi(pendingAi)
                .aiVerified(aiVerified)
                .rfqGenerated(rfqGen + assigned)
                .openRFQs(openRFQs)
                .inProgress(inProgress)
                .completed(completed)
                .rejected(rejected)
                .severityBreakdown(severityBreakdown)
                .reportsByDay(reportsByDay)
                .build();
    }
}
