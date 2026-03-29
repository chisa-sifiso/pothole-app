package com.municipality.pothole.client;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Component
@RequiredArgsConstructor
@Slf4j
public class AIServiceClient {

    @Value("${app.ai.service.url}")
    private String aiServiceUrl;

    private final RestTemplate restTemplate;

    public AIAnalysisResult analyzeImage(MultipartFile image) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            ByteArrayResource fileResource = new ByteArrayResource(image.getBytes()) {
                @Override
                public String getFilename() {
                    return image.getOriginalFilename() != null
                            ? image.getOriginalFilename() : "image.jpg";
                }
            };

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", fileResource);

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

            ResponseEntity<AIAnalysisResult> response = restTemplate.exchange(
                    aiServiceUrl + "/analyze",
                    HttpMethod.POST,
                    requestEntity,
                    AIAnalysisResult.class
            );

            return response.getBody();
        } catch (IOException e) {
            log.error("Failed to read image bytes for AI analysis", e);
            return fallbackResult();
        } catch (Exception e) {
            log.warn("AI service unavailable, using fallback result: {}", e.getMessage());
            return fallbackResult();
        }
    }

    private AIAnalysisResult fallbackResult() {
        AIAnalysisResult fallback = new AIAnalysisResult();
        fallback.setPothole(true);
        fallback.setConfidence(0.0f);
        fallback.setSeverity("MEDIUM");
        fallback.setEstimatedDiameterCm(25.0f);
        fallback.setEstimatedDepthCm(5.0f);
        return fallback;
    }
}
