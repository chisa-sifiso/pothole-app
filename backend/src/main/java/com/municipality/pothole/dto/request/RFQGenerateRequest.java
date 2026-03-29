package com.municipality.pothole.dto.request;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class RFQGenerateRequest {

    @NotNull
    @Future(message = "Deadline must be in the future")
    private LocalDate deadline;
}
