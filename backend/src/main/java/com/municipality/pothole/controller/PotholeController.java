package com.municipality.pothole.controller;

import com.municipality.pothole.dto.response.PotholeReportResponse;
import com.municipality.pothole.model.User;
import com.municipality.pothole.repository.UserRepository;
import com.municipality.pothole.service.PotholeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/potholes")
@RequiredArgsConstructor
public class PotholeController {

    private final PotholeService potholeService;
    private final UserRepository userRepository;

    @PostMapping(value = "/report", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('CITIZEN')")
    public ResponseEntity<PotholeReportResponse> reportPothole(
            @RequestParam("image") MultipartFile image,
            @RequestParam("latitude") double latitude,
            @RequestParam("longitude") double longitude,
            @RequestParam(value = "address", required = false) String address,
            @RequestParam(value = "measuredLength", required = false) Double measuredLength,
            @RequestParam(value = "measuredWidth",  required = false) Double measuredWidth,
            @RequestParam(value = "measuredDepth",  required = false) Double measuredDepth,
            @RequestParam(value = "concreteKg",     required = false) Double concreteKg,
            @RequestParam(value = "wheelsFit",      required = false) Integer wheelsFit,
            Authentication auth) {

        User user = getUser(auth);
        return ResponseEntity.ok(
                potholeService.reportPothole(image, latitude, longitude, address,
                        measuredLength, measuredWidth, measuredDepth, concreteKg, wheelsFit,
                        user.getId())
        );
    }

    @GetMapping
    public ResponseEntity<List<PotholeReportResponse>> getAllReports(
            @RequestParam(required = false) String severity,
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(potholeService.getAllReports(severity, status));
    }

    @GetMapping("/map")
    public ResponseEntity<List<PotholeReportResponse>> getReportsByBoundingBox(
            @RequestParam double minLat,
            @RequestParam double maxLat,
            @RequestParam double minLng,
            @RequestParam double maxLng) {
        return ResponseEntity.ok(potholeService.getReportsByBoundingBox(minLat, maxLat, minLng, maxLng));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('CITIZEN')")
    public ResponseEntity<List<PotholeReportResponse>> getMyReports(Authentication auth) {
        User user = getUser(auth);
        return ResponseEntity.ok(potholeService.getCitizenReports(user.getId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PotholeReportResponse> getReportById(@PathVariable Long id) {
        return ResponseEntity.ok(potholeService.getReportById(id));
    }

    @PatchMapping("/{id}/verify")
    @PreAuthorize("hasRole('MUNICIPAL_OFFICIAL')")
    public ResponseEntity<PotholeReportResponse> verifyReport(@PathVariable Long id) {
        return ResponseEntity.ok(potholeService.verifyReport(id));
    }

    private User getUser(Authentication auth) {
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new IllegalStateException("User not found"));
    }
}
