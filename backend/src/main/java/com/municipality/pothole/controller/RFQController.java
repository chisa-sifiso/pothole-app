package com.municipality.pothole.controller;

import com.municipality.pothole.dto.request.BidRequest;
import com.municipality.pothole.dto.request.RFQGenerateRequest;
import com.municipality.pothole.dto.response.BidResponse;
import com.municipality.pothole.dto.response.RFQResponse;
import com.municipality.pothole.model.User;
import com.municipality.pothole.repository.UserRepository;
import com.municipality.pothole.service.BidService;
import com.municipality.pothole.service.RFQService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rfqs")
@RequiredArgsConstructor
public class RFQController {

    private final RFQService rfqService;
    private final BidService bidService;
    private final UserRepository userRepository;

    @PostMapping("/generate/{potholeId}")
    @PreAuthorize("hasRole('MUNICIPAL_OFFICIAL')")
    public ResponseEntity<RFQResponse> generateRFQ(
            @PathVariable Long potholeId,
            @Valid @RequestBody RFQGenerateRequest request) {
        return ResponseEntity.ok(rfqService.generateRFQ(potholeId, request));
    }

    @GetMapping
    public ResponseEntity<List<RFQResponse>> getRFQs(Authentication auth) {
        User user = getUser(auth);
        if (user.getRole().name().equals("CONTRACTOR")) {
            return ResponseEntity.ok(rfqService.getOpenRFQs());
        }
        return ResponseEntity.ok(rfqService.getAllRFQs());
    }

    @GetMapping("/{id}")
    public ResponseEntity<RFQResponse> getRFQById(@PathVariable Long id) {
        return ResponseEntity.ok(rfqService.getRFQById(id));
    }

    @PostMapping("/{id}/bid")
    @PreAuthorize("hasRole('CONTRACTOR')")
    public ResponseEntity<BidResponse> submitBid(
            @PathVariable Long id,
            @Valid @RequestBody BidRequest request,
            Authentication auth) {
        User user = getUser(auth);
        return ResponseEntity.ok(bidService.submitBid(id, request, user.getId()));
    }

    @GetMapping("/{id}/bids")
    @PreAuthorize("hasRole('MUNICIPAL_OFFICIAL')")
    public ResponseEntity<List<BidResponse>> getBids(@PathVariable Long id) {
        return ResponseEntity.ok(bidService.getBidsForRFQ(id));
    }

    @PostMapping("/{id}/award/{bidId}")
    @PreAuthorize("hasRole('MUNICIPAL_OFFICIAL')")
    public ResponseEntity<BidResponse> awardBid(
            @PathVariable Long id,
            @PathVariable Long bidId) {
        return ResponseEntity.ok(bidService.awardBid(id, bidId));
    }

    private User getUser(Authentication auth) {
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new IllegalStateException("User not found"));
    }
}
