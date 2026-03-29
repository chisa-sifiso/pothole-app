package com.municipality.pothole.service;

import com.municipality.pothole.dto.response.RepairTaskResponse;
import com.municipality.pothole.model.*;
import com.municipality.pothole.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RepairTaskService {

    private final RepairTaskRepository repairTaskRepository;
    private final ContractorProfileRepository contractorProfileRepository;
    private final PotholeReportRepository potholeReportRepository;
    private final FileStorageService fileStorageService;

    @Transactional
    public RepairTaskResponse startRepair(Long taskId, Long contractorId) {
        RepairTask task = findTaskForContractor(taskId, contractorId);
        task.setStatus(TaskStatus.IN_PROGRESS);
        task.getBid().getRfq().getPotholeReport().setStatus(ReportStatus.IN_PROGRESS);
        potholeReportRepository.save(task.getBid().getRfq().getPotholeReport());
        return toResponse(repairTaskRepository.save(task));
    }

    @Transactional
    public RepairTaskResponse completeRepair(Long taskId, MultipartFile afterImage, Long contractorId) {
        RepairTask task = findTaskForContractor(taskId, contractorId);

        if (afterImage != null && !afterImage.isEmpty()) {
            String afterImageUrl = fileStorageService.storeFile(afterImage, "repairs");
            task.setAfterImageUrl(afterImageUrl);
        }

        task.setStatus(TaskStatus.COMPLETED);
        task.setCompletedAt(LocalDateTime.now());

        PotholeReport report = task.getBid().getRfq().getPotholeReport();
        report.setStatus(ReportStatus.COMPLETED);
        potholeReportRepository.save(report);

        // Increment contractor completed jobs
        contractorProfileRepository.findByUserId(contractorId).ifPresent(profile -> {
            profile.setCompletedJobs(profile.getCompletedJobs() + 1);
            contractorProfileRepository.save(profile);
        });

        return toResponse(repairTaskRepository.save(task));
    }

    @Transactional(readOnly = true)
    public List<RepairTaskResponse> getTasksByContractor(Long contractorId) {
        return repairTaskRepository.findByContractorId(contractorId)
                .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<RepairTaskResponse> getAllTasks() {
        return repairTaskRepository.findAll().stream().map(this::toResponse).toList();
    }

    private RepairTask findTaskForContractor(Long taskId, Long contractorId) {
        RepairTask task = repairTaskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Repair task not found"));
        if (!task.getBid().getContractor().getId().equals(contractorId)) {
            throw new IllegalStateException("You are not authorized to update this task");
        }
        return task;
    }

    public RepairTaskResponse toResponse(RepairTask t) {
        PotholeReport report = t.getBid().getRfq().getPotholeReport();
        return RepairTaskResponse.builder()
                .id(t.getId())
                .bidId(t.getBid().getId())
                .rfqId(t.getBid().getRfq().getId())
                .potholeReportId(report.getId())
                .potholeAddress(report.getAddress())
                .potholeSeverity(report.getSeverity() != null ? report.getSeverity().name() : null)
                .status(t.getStatus().name())
                .beforeImageUrl(t.getBeforeImageUrl())
                .afterImageUrl(t.getAfterImageUrl())
                .assignedAt(t.getAssignedAt())
                .completedAt(t.getCompletedAt())
                .build();
    }
}
