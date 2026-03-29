package com.municipality.pothole.service;

import com.municipality.pothole.dto.request.BidRequest;
import com.municipality.pothole.dto.response.BidResponse;
import com.municipality.pothole.model.*;
import com.municipality.pothole.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BidServiceTest {

    @Mock BidRepository               bidRepository;
    @Mock RFQRepository               rfqRepository;
    @Mock UserRepository              userRepository;
    @Mock ContractorProfileRepository contractorProfileRepository;
    @Mock PotholeReportRepository     potholeReportRepository;
    @Mock RepairTaskRepository        repairTaskRepository;

    @InjectMocks BidService bidService;

    private RFQ openRfq;
    private User contractor;
    private ContractorProfile profile;

    @BeforeEach
    void setUp() {
        PotholeReport report = PotholeReport.builder().id(10L).status(ReportStatus.AI_VERIFIED).build();

        openRfq = RFQ.builder()
                .id(1L)
                .potholeReport(report)
                .status(RFQStatus.OPEN)
                .build();

        contractor = User.builder()
                .id(5L)
                .email("c@test.com")
                .name("Bob")
                .role(Role.CONTRACTOR)
                .build();

        profile = ContractorProfile.builder()
                .user(contractor)
                .companyName("Bob Ltd")
                .rating(BigDecimal.valueOf(4.5))
                .completedJobs(10)
                .build();
    }

    // ── submitBid ──────────────────────────────────────────────

    @Test
    void submitBid_success() {
        when(rfqRepository.findById(1L)).thenReturn(Optional.of(openRfq));
        when(bidRepository.findByRfqIdAndContractorId(1L, 5L)).thenReturn(Optional.empty());
        when(userRepository.findById(5L)).thenReturn(Optional.of(contractor));
        Bid saved = Bid.builder().id(99L).rfq(openRfq).contractor(contractor)
                .price(BigDecimal.valueOf(15000)).completionDays(7).build();
        when(bidRepository.save(any(Bid.class))).thenReturn(saved);
        when(contractorProfileRepository.findByUserId(5L)).thenReturn(Optional.of(profile));
        when(repairTaskRepository.findByBidId(99L)).thenReturn(Optional.empty());

        BidRequest req = new BidRequest();
        req.setPrice(BigDecimal.valueOf(15000));
        req.setCompletionDays(7);
        req.setRepairMethod("Cold mix patching");

        BidResponse resp = bidService.submitBid(1L, req, 5L);

        assertThat(resp.getId()).isEqualTo(99L);
        assertThat(resp.getPrice()).isEqualByComparingTo("15000");
        assertThat(resp.isAwarded()).isFalse();
        verify(bidRepository).save(any(Bid.class));
    }

    @Test
    void submitBid_closedRfq_throws() {
        openRfq.setStatus(RFQStatus.AWARDED);
        when(rfqRepository.findById(1L)).thenReturn(Optional.of(openRfq));

        BidRequest req = new BidRequest();
        assertThatThrownBy(() -> bidService.submitBid(1L, req, 5L))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("not open");
    }

    @Test
    void submitBid_duplicate_throws() {
        when(rfqRepository.findById(1L)).thenReturn(Optional.of(openRfq));
        when(bidRepository.findByRfqIdAndContractorId(1L, 5L))
                .thenReturn(Optional.of(Bid.builder().build()));

        BidRequest req = new BidRequest();
        assertThatThrownBy(() -> bidService.submitBid(1L, req, 5L))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("already submitted");
    }

    // ── weighted scoring ───────────────────────────────────────

    @Test
    void weightedScore_highestRatedLowestPriceWins() {
        User c1 = User.builder().id(1L).name("C1").role(Role.CONTRACTOR).build();
        User c2 = User.builder().id(2L).name("C2").role(Role.CONTRACTOR).build();

        Bid bid1 = Bid.builder().id(1L).rfq(openRfq).contractor(c1)
                .price(BigDecimal.valueOf(10_000)).completionDays(5).build();
        Bid bid2 = Bid.builder().id(2L).rfq(openRfq).contractor(c2)
                .price(BigDecimal.valueOf(20_000)).completionDays(10).build();

        ContractorProfile p1 = ContractorProfile.builder().user(c1)
                .rating(BigDecimal.valueOf(5.0)).completedJobs(20).build();
        ContractorProfile p2 = ContractorProfile.builder().user(c2)
                .rating(BigDecimal.valueOf(3.0)).completedJobs(5).build();

        when(bidRepository.findByRfqId(1L)).thenReturn(List.of(bid1, bid2));
        when(contractorProfileRepository.findByUserId(1L)).thenReturn(Optional.of(p1));
        when(contractorProfileRepository.findByUserId(2L)).thenReturn(Optional.of(p2));
        when(bidRepository.save(any(Bid.class))).thenAnswer(i -> i.getArgument(0));
        when(repairTaskRepository.findByBidId(anyLong())).thenReturn(Optional.empty());

        List<BidResponse> responses = bidService.getBidsForRFQ(1L);

        // bid1: cheaper + higher rating → higher score
        BidResponse r1 = responses.stream().filter(r -> r.getId() == 1L).findFirst().orElseThrow();
        BidResponse r2 = responses.stream().filter(r -> r.getId() == 2L).findFirst().orElseThrow();
        assertThat(r1.getWeightedScore()).isGreaterThan(r2.getWeightedScore());
    }

    @Test
    void weightedScore_formula_singleBid_alwaysZero() {
        // With only one bid, max == bid value → normalised scores = 0 for price and days
        // score = 0*0.40 + rating*0.35 + 0*0.25
        User c1 = User.builder().id(1L).name("C1").role(Role.CONTRACTOR).build();
        Bid bid1 = Bid.builder().id(1L).rfq(openRfq).contractor(c1)
                .price(BigDecimal.valueOf(10_000)).completionDays(7).build();
        ContractorProfile p1 = ContractorProfile.builder().user(c1)
                .rating(BigDecimal.valueOf(4.0)).completedJobs(5).build();

        when(bidRepository.findByRfqId(1L)).thenReturn(List.of(bid1));
        when(contractorProfileRepository.findByUserId(1L)).thenReturn(Optional.of(p1));
        when(bidRepository.save(any(Bid.class))).thenAnswer(i -> i.getArgument(0));
        when(repairTaskRepository.findByBidId(1L)).thenReturn(Optional.empty());

        List<BidResponse> responses = bidService.getBidsForRFQ(1L);
        // 0*0.40 + (4/5)*0.35 + 0*0.25 = 0.28
        assertThat(responses.get(0).getWeightedScore().doubleValue())
                .isCloseTo(0.28, org.assertj.core.data.Offset.offset(0.0001));
    }

    // ── awardBid ───────────────────────────────────────────────

    @Test
    void awardBid_createsRepairTask() {
        Bid bid = Bid.builder().id(10L).rfq(openRfq).contractor(contractor)
                .price(BigDecimal.valueOf(12000)).completionDays(5).build();

        when(rfqRepository.findById(1L)).thenReturn(Optional.of(openRfq));
        when(bidRepository.findById(10L)).thenReturn(Optional.of(bid));
        when(bidRepository.findByRfqId(1L)).thenReturn(List.of(bid));
        when(contractorProfileRepository.findByUserId(5L)).thenReturn(Optional.of(profile));
        when(bidRepository.save(any(Bid.class))).thenAnswer(i -> i.getArgument(0));
        when(rfqRepository.save(any(RFQ.class))).thenReturn(openRfq);
        when(potholeReportRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(repairTaskRepository.save(any(RepairTask.class))).thenAnswer(i -> i.getArgument(0));
        when(repairTaskRepository.findByBidId(10L)).thenReturn(Optional.of(RepairTask.builder().build()));

        BidResponse resp = bidService.awardBid(1L, 10L);

        verify(repairTaskRepository).save(any(RepairTask.class));
        assertThat(resp.isAwarded()).isTrue();
        assertThat(openRfq.getStatus()).isEqualTo(RFQStatus.AWARDED);
    }

    @Test
    void awardBid_alreadyClosed_throws() {
        openRfq.setStatus(RFQStatus.AWARDED);
        when(rfqRepository.findById(1L)).thenReturn(Optional.of(openRfq));

        assertThatThrownBy(() -> bidService.awardBid(1L, 10L))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("already closed");
    }

    @Test
    void awardBid_wrongRfq_throws() {
        RFQ otherRfq = RFQ.builder().id(99L).status(RFQStatus.OPEN).build();
        Bid bid = Bid.builder().id(10L).rfq(otherRfq).contractor(contractor).build();

        when(rfqRepository.findById(1L)).thenReturn(Optional.of(openRfq));
        when(bidRepository.findById(10L)).thenReturn(Optional.of(bid));

        assertThatThrownBy(() -> bidService.awardBid(1L, 10L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("does not belong");
    }
}
