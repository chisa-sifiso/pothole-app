package com.municipality.pothole.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {

    @NotBlank
    @Email
    private String email;

    @NotBlank
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;

    @NotBlank
    private String name;

    private String phone;

    @NotNull
    private String role; // CITIZEN, MUNICIPAL_OFFICIAL, CONTRACTOR

    // Optional — used when role = CONTRACTOR
    private String companyName;
    private String registrationNumber;
}
