package com.municipality.pothole.controller;

import com.municipality.pothole.dto.response.RepairTaskResponse;
import com.municipality.pothole.model.User;
import com.municipality.pothole.repository.UserRepository;
import com.municipality.pothole.service.RepairTaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/repairs")
@RequiredArgsConstructor
public class RepairController {

    private final RepairTaskService repairTaskService;
    private final UserRepository userRepository;

    @GetMapping
    @PreAuthorize("hasRole('MUNICIPAL_OFFICIAL')")
    public ResponseEntity<List<RepairTaskResponse>> getAllTasks() {
        return ResponseEntity.ok(repairTaskService.getAllTasks());
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('CONTRACTOR')")
    public ResponseEntity<List<RepairTaskResponse>> getMyTasks(Authentication auth) {
        User user = getUser(auth);
        return ResponseEntity.ok(repairTaskService.getTasksByContractor(user.getId()));
    }

    @PatchMapping("/{taskId}/start")
    @PreAuthorize("hasRole('CONTRACTOR')")
    public ResponseEntity<RepairTaskResponse> startRepair(
            @PathVariable Long taskId, Authentication auth) {
        User user = getUser(auth);
        return ResponseEntity.ok(repairTaskService.startRepair(taskId, user.getId()));
    }

    @PostMapping(value = "/{taskId}/complete", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('CONTRACTOR')")
    public ResponseEntity<RepairTaskResponse> completeRepair(
            @PathVariable Long taskId,
            @RequestParam(value = "afterImage", required = false) MultipartFile afterImage,
            Authentication auth) {
        User user = getUser(auth);
        return ResponseEntity.ok(repairTaskService.completeRepair(taskId, afterImage, user.getId()));
    }

    private User getUser(Authentication auth) {
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new IllegalStateException("User not found"));
    }
}
