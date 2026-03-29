package com.municipality.pothole.controller;

import com.municipality.pothole.dto.request.ContractorProfileRequest;
import com.municipality.pothole.model.User;
import com.municipality.pothole.repository.UserRepository;
import com.municipality.pothole.service.ContractorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/contractors")
@RequiredArgsConstructor
public class ContractorController {

    private final ContractorService contractorService;
    private final UserRepository userRepository;

    @GetMapping("/profile")
    @PreAuthorize("hasRole('CONTRACTOR')")
    public ResponseEntity<Map<String, Object>> getProfile(Authentication auth) {
        User user = getUser(auth);
        return ResponseEntity.ok(contractorService.getProfile(user.getId()));
    }

    @PutMapping("/profile")
    @PreAuthorize("hasRole('CONTRACTOR')")
    public ResponseEntity<Map<String, Object>> updateProfile(
            @Valid @RequestBody ContractorProfileRequest request,
            Authentication auth) {
        User user = getUser(auth);
        return ResponseEntity.ok(contractorService.updateProfile(user.getId(), request));
    }

    private User getUser(Authentication auth) {
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new IllegalStateException("User not found"));
    }
}
