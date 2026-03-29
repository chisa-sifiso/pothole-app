package com.municipality.pothole.client;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class AIAnalysisResult {

    @JsonProperty("is_pothole")
    private boolean isPothole;

    private float confidence;

    private String severity;

    @JsonProperty("estimated_diameter_cm")
    private float estimatedDiameterCm;

    @JsonProperty("estimated_depth_cm")
    private float estimatedDepthCm;
}
