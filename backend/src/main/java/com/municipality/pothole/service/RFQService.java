package com.municipality.pothole.service;

import com.municipality.pothole.dto.request.RFQGenerateRequest;
import com.municipality.pothole.dto.response.RFQResponse;
import com.municipality.pothole.model.*;
import com.municipality.pothole.repository.BidRepository;
import com.municipality.pothole.repository.PotholeReportRepository;
import com.municipality.pothole.repository.RFQRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RFQService {

    private final RFQRepository rfqRepository;
    private final PotholeReportRepository potholeReportRepository;
    private final BidRepository bidRepository;
    private final PotholeService potholeService;

    @Transactional
    public RFQResponse generateRFQ(Long potholeId, RFQGenerateRequest request) {
        PotholeReport report = potholeReportRepository.findById(potholeId)
                .orElseThrow(() -> new IllegalArgumentException("Pothole report not found"));

        if (report.getStatus() != ReportStatus.AI_VERIFIED) {
            throw new IllegalStateException("RFQ can only be generated for AI_VERIFIED potholes");
        }

        if (rfqRepository.findByPotholeReportId(potholeId).isPresent()) {
            throw new IllegalStateException("RFQ already exists for this pothole report");
        }

        RFQ rfq = RFQ.builder()
                .potholeReport(report)
                .deadline(request.getDeadline())
                .status(RFQStatus.OPEN)
                .build();

        rfq = rfqRepository.save(rfq);

        report.setStatus(ReportStatus.RFQ_GENERATED);
        potholeReportRepository.save(report);

        return toResponse(rfq);
    }

    @Transactional(readOnly = true)
    public List<RFQResponse> getAllRFQs() {
        return rfqRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<RFQResponse> getOpenRFQs() {
        return rfqRepository.findByStatus(RFQStatus.OPEN).stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public RFQResponse getRFQById(Long rfqId) {
        return rfqRepository.findById(rfqId)
                .map(this::toResponse)
                .orElseThrow(() -> new IllegalArgumentException("RFQ not found"));
    }

    private RFQResponse toResponse(RFQ rfq) {
        int bidCount = bidRepository.findByRfqId(rfq.getId()).size();
        return RFQResponse.builder()
                .id(rfq.getId())
                .potholeReport(potholeService.toResponse(rfq.getPotholeReport()))
                .generatedAt(rfq.getGeneratedAt())
                .deadline(rfq.getDeadline())
                .status(rfq.getStatus().name())
                .bidCount(bidCount)
                .build();
    }
}
