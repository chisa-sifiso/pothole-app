package com.municipality.pothole.service;

import com.municipality.pothole.dto.request.BidRequest;
import com.municipality.pothole.dto.response.BidResponse;
import com.municipality.pothole.model.*;
import com.municipality.pothole.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BidService {

    private final BidRepository bidRepository;
    private final RFQRepository rfqRepository;
    private final UserRepository userRepository;
    private final ContractorProfileRepository contractorProfileRepository;
    private final PotholeReportRepository potholeReportRepository;
    private final RepairTaskRepository repairTaskRepository;

    @Transactional
    public BidResponse submitBid(Long rfqId, BidRequest request, Long contractorId) {
        RFQ rfq = rfqRepository.findById(rfqId)
                .orElseThrow(() -> new IllegalArgumentException("RFQ not found"));

        if (rfq.getStatus() != RFQStatus.OPEN) {
            throw new IllegalStateException("RFQ is not open for bids");
        }

        if (bidRepository.findByRfqIdAndContractorId(rfqId, contractorId).isPresent()) {
            throw new IllegalStateException("You have already submitted a bid for this RFQ");
        }

        User contractor = userRepository.findById(contractorId)
                .orElseThrow(() -> new IllegalArgumentException("Contractor not found"));

        Bid bid = Bid.builder()
                .rfq(rfq)
                .contractor(contractor)
                .price(request.getPrice())
                .completionDays(request.getCompletionDays())
                .repairMethod(request.getRepairMethod())
                .build();

        bid = bidRepository.save(bid);
        return toResponse(bid);
    }

    @Transactional
    public List<BidResponse> getBidsForRFQ(Long rfqId) {
        computeWeightedScores(rfqId);
        return bidRepository.findByRfqId(rfqId).stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<BidResponse> getBidsByContractor(Long contractorId) {
        return bidRepository.findByContractorId(contractorId).stream().map(this::toResponse).toList();
    }

    @Transactional
    public BidResponse awardBid(Long rfqId, Long bidId) {
        RFQ rfq = rfqRepository.findById(rfqId)
                .orElseThrow(() -> new IllegalArgumentException("RFQ not found"));

        if (rfq.getStatus() != RFQStatus.OPEN) {
            throw new IllegalStateException("RFQ is already closed or awarded");
        }

        Bid winningBid = bidRepository.findById(bidId)
                .orElseThrow(() -> new IllegalArgumentException("Bid not found"));

        if (!winningBid.getRfq().getId().equals(rfqId)) {
            throw new IllegalArgumentException("Bid does not belong to this RFQ");
        }

        // Compute weighted scores for all bids
        computeWeightedScores(rfqId);

        // Award the selected bid
        rfq.setStatus(RFQStatus.AWARDED);
        rfqRepository.save(rfq);

        // Update pothole status
        PotholeReport report = rfq.getPotholeReport();
        report.setStatus(ReportStatus.ASSIGNED);
        potholeReportRepository.save(report);

        // Create repair task
        RepairTask task = RepairTask.builder()
                .bid(winningBid)
                .status(TaskStatus.ASSIGNED)
                .build();
        repairTaskRepository.save(task);

        return toResponse(winningBid);
    }

    private void computeWeightedScores(Long rfqId) {
        List<Bid> bids = bidRepository.findByRfqId(rfqId);
        if (bids.isEmpty()) return;

        double maxPrice = bids.stream()
                .mapToDouble(b -> b.getPrice().doubleValue()).max().orElse(1.0);
        double maxDays = bids.stream()
                .mapToDouble(b -> (double) b.getCompletionDays()).max().orElse(1.0);

        for (Bid bid : bids) {
            ContractorProfile profile = contractorProfileRepository
                    .findByUserId(bid.getContractor().getId()).orElse(null);

            double rating = (profile != null) ? profile.getRating().doubleValue() : 0.0;

            double normalizedPriceScore = maxPrice > 0
                    ? (maxPrice - bid.getPrice().doubleValue()) / maxPrice : 0.0;
            double ratingScore = rating / 5.0;
            double normalizedDaysScore = maxDays > 0
                    ? (maxDays - bid.getCompletionDays()) / maxDays : 0.0;

            double score = normalizedPriceScore * 0.40
                         + ratingScore * 0.35
                         + normalizedDaysScore * 0.25;

            bid.setWeightedScore(BigDecimal.valueOf(score));
            bidRepository.save(bid);
        }
    }

    private BidResponse toResponse(Bid bid) {
        ContractorProfile profile = contractorProfileRepository
                .findByUserId(bid.getContractor().getId()).orElse(null);
        boolean awarded = repairTaskRepository.findByBidId(bid.getId()).isPresent();

        return BidResponse.builder()
                .id(bid.getId())
                .rfqId(bid.getRfq().getId())
                .contractorId(bid.getContractor().getId())
                .contractorName(bid.getContractor().getName())
                .companyName(profile != null ? profile.getCompanyName() : "N/A")
                .contractorRating(profile != null ? profile.getRating() : BigDecimal.ZERO)
                .completedJobs(profile != null ? profile.getCompletedJobs() : 0)
                .price(bid.getPrice())
                .completionDays(bid.getCompletionDays())
                .repairMethod(bid.getRepairMethod())
                .submittedAt(bid.getSubmittedAt())
                .weightedScore(bid.getWeightedScore())
                .awarded(awarded)
                .build();
    }
}
