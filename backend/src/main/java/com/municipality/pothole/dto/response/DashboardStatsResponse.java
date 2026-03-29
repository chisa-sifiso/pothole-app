package com.municipality.pothole.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsResponse {
    private long totalReports;
    private long pendingAi;
    private long aiVerified;
    private long rfqGenerated;
    private long openRFQs;
    private long inProgress;
    private long completed;
    private long rejected;
    private Map<String, Long> severityBreakdown;
    private List<DailyCount> reportsByDay;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class DailyCount {
        private String date;
        private long count;
    }
}
