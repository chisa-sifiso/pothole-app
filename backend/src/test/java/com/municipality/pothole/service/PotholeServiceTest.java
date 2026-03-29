package com.municipality.pothole.service;

import com.municipality.pothole.client.AIAnalysisResult;
import com.municipality.pothole.client.AIServiceClient;
import com.municipality.pothole.dto.response.PotholeReportResponse;
import com.municipality.pothole.model.*;
import com.municipality.pothole.repository.PotholeReportRepository;
import com.municipality.pothole.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PotholeServiceTest {

    @Mock PotholeReportRepository potholeReportRepository;
    @Mock UserRepository          userRepository;
    @Mock FileStorageService      fileStorageService;
    @Mock AIServiceClient         aiServiceClient;

    @InjectMocks PotholeService potholeService;

    private User citizen;
    private MockMultipartFile image;

    @BeforeEach
    void setUp() {
        citizen = User.builder().id(1L).email("c@test.com").name("Citizen")
                .role(Role.CITIZEN).build();
        image = new MockMultipartFile("image", "pothole.jpg", "image/jpeg", new byte[]{1, 2, 3});
    }

    // ── reportPothole ──────────────────────────────────────────

    @Test
    void reportPothole_aiVerified_setsStatusAndSeverity() {
        AIAnalysisResult ai = new AIAnalysisResult();
        ai.setPothole(true);
        ai.setSeverity("HIGH");
        ai.setConfidence(0.92f);
        ai.setEstimatedDiameterCm(45.0f);
        ai.setEstimatedDepthCm(8.5f);

        when(userRepository.findById(1L)).thenReturn(Optional.of(citizen));
        when(fileStorageService.storeFile(any(), anyString())).thenReturn("/uploads/potholes/test.jpg");
        when(aiServiceClient.analyzeImage(any())).thenReturn(ai);

        PotholeReport pending = PotholeReport.builder().id(10L).citizen(citizen)
                .imageUrl("/uploads/potholes/test.jpg")
                .latitude(BigDecimal.valueOf(-26.2041))
                .longitude(BigDecimal.valueOf(28.0473))
                .status(ReportStatus.PENDING_AI).build();
        PotholeReport verified = PotholeReport.builder().id(10L).citizen(citizen)
                .imageUrl("/uploads/potholes/test.jpg")
                .latitude(BigDecimal.valueOf(-26.2041))
                .longitude(BigDecimal.valueOf(28.0473))
                .status(ReportStatus.AI_VERIFIED)
                .severity(Severity.HIGH)
                .aiConfidence(BigDecimal.valueOf(0.92))
                .estimatedDiameter(BigDecimal.valueOf(45.0))
                .estimatedDepth(BigDecimal.valueOf(8.5))
                .build();

        when(potholeReportRepository.save(any(PotholeReport.class)))
                .thenReturn(pending)   // first save (PENDING_AI)
                .thenReturn(verified); // second save (AI_VERIFIED)

        PotholeReportResponse resp = potholeService.reportPothole(
                image, -26.2041, 28.0473, "Main St",
                null, null, null, null, null, 1L);

        assertThat(resp.getStatus()).isEqualTo("AI_VERIFIED");
        assertThat(resp.getSeverity()).isEqualTo("HIGH");
        verify(potholeReportRepository, times(2)).save(any());
    }

    @Test
    void reportPothole_notPothole_setsRejected() {
        AIAnalysisResult ai = new AIAnalysisResult();
        ai.setPothole(false);
        ai.setConfidence(0.15f);
        ai.setSeverity("LOW");
        ai.setEstimatedDiameterCm(0.0f);
        ai.setEstimatedDepthCm(0.0f);

        when(userRepository.findById(1L)).thenReturn(Optional.of(citizen));
        when(fileStorageService.storeFile(any(), anyString())).thenReturn("/uploads/test.jpg");
        when(aiServiceClient.analyzeImage(any())).thenReturn(ai);

        PotholeReport pending  = PotholeReport.builder().id(1L).citizen(citizen)
                .imageUrl("/uploads/test.jpg").status(ReportStatus.PENDING_AI)
                .latitude(BigDecimal.ZERO).longitude(BigDecimal.ZERO).build();
        PotholeReport rejected = PotholeReport.builder().id(1L).citizen(citizen)
                .imageUrl("/uploads/test.jpg").status(ReportStatus.REJECTED)
                .latitude(BigDecimal.ZERO).longitude(BigDecimal.ZERO)
                .aiConfidence(BigDecimal.valueOf(0.15))
                .estimatedDiameter(BigDecimal.ZERO).estimatedDepth(BigDecimal.ZERO).build();

        when(potholeReportRepository.save(any())).thenReturn(pending).thenReturn(rejected);

        PotholeReportResponse resp = potholeService.reportPothole(
                image, 0, 0, null, null, null, null, null, null, 1L);

        assertThat(resp.getStatus()).isEqualTo("REJECTED");
    }

    @Test
    void reportPothole_withMeasurements_savedCorrectly() {
        AIAnalysisResult ai = new AIAnalysisResult();
        ai.setPothole(true); ai.setSeverity("MEDIUM");
        ai.setConfidence(0.80f); ai.setEstimatedDiameterCm(30.0f); ai.setEstimatedDepthCm(5.0f);

        when(userRepository.findById(1L)).thenReturn(Optional.of(citizen));
        when(fileStorageService.storeFile(any(), anyString())).thenReturn("/uploads/m.jpg");
        when(aiServiceClient.analyzeImage(any())).thenReturn(ai);

        ArgumentCaptor<PotholeReport> captor = ArgumentCaptor.forClass(PotholeReport.class);
        PotholeReport saved = PotholeReport.builder().id(5L).citizen(citizen)
                .imageUrl("/uploads/m.jpg").status(ReportStatus.AI_VERIFIED)
                .severity(Severity.MEDIUM)
                .latitude(BigDecimal.valueOf(-26.0)).longitude(BigDecimal.valueOf(28.0))
                .measuredLengthCm(BigDecimal.valueOf(40)).measuredWidthCm(BigDecimal.valueOf(30))
                .measuredDepthCm(BigDecimal.valueOf(8)).concreteEstimateKg(BigDecimal.valueOf(22))
                .wheelsFit(2)
                .aiConfidence(BigDecimal.valueOf(0.80))
                .estimatedDiameter(BigDecimal.valueOf(30.0)).estimatedDepth(BigDecimal.valueOf(5.0))
                .build();
        when(potholeReportRepository.save(captor.capture())).thenReturn(saved);

        PotholeReportResponse resp = potholeService.reportPothole(
                image, -26.0, 28.0, "Test St",
                40.0, 30.0, 8.0, 22.0, 2, 1L);

        // Verify first save has measurements
        PotholeReport firstSave = captor.getAllValues().get(0);
        assertThat(firstSave.getMeasuredLengthCm()).isEqualByComparingTo("40");
        assertThat(firstSave.getWheelsFit()).isEqualTo(2);
        assertThat(resp.getMeasuredLengthCm()).isEqualByComparingTo("40");
        assertThat(resp.getWheelsFit()).isEqualTo(2);
    }

    @Test
    void reportPothole_userNotFound_throws() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> potholeService.reportPothole(
                image, 0, 0, null, null, null, null, null, null, 99L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("User not found");
    }

    // ── parseSeverity via verifyReport ─────────────────────────

    @Test
    void verifyReport_setsAiVerifiedStatus() {
        PotholeReport report = PotholeReport.builder().id(1L).citizen(citizen)
                .imageUrl("/img.jpg").status(ReportStatus.PENDING_AI)
                .latitude(BigDecimal.ZERO).longitude(BigDecimal.ZERO).build();
        when(potholeReportRepository.findById(1L)).thenReturn(Optional.of(report));
        when(potholeReportRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        PotholeReportResponse resp = potholeService.verifyReport(1L);

        assertThat(resp.getStatus()).isEqualTo("AI_VERIFIED");
    }

    @Test
    void getReportById_notFound_throws() {
        when(potholeReportRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> potholeService.getReportById(999L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Report not found");
    }
}
