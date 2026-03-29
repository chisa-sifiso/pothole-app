package com.municipality.pothole.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ContractorProfileRequest {

    @NotBlank
    private String companyName;

    @NotBlank
    private String registrationNumber;
}
