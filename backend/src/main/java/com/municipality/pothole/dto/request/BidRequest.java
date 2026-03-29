package com.municipality.pothole.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class BidRequest {

    @NotNull
    @DecimalMin(value = "0.01", message = "Price must be positive")
    private BigDecimal price;

    @NotNull
    @Min(value = 1, message = "Completion days must be at least 1")
    private Integer completionDays;

    @NotBlank
    private String repairMethod;
}
