package com.municipality.pothole.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateProfileRequest {

    @NotBlank
    private String name;

    private String phone;
}
