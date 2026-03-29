package com.municipality.pothole.service;

import com.municipality.pothole.dto.request.ContractorProfileRequest;
import com.municipality.pothole.model.ContractorProfile;
import com.municipality.pothole.model.User;
import com.municipality.pothole.repository.ContractorProfileRepository;
import com.municipality.pothole.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ContractorService {

    private final ContractorProfileRepository contractorProfileRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public Map<String, Object> getProfile(Long userId) {
        ContractorProfile profile = contractorProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Contractor profile not found"));
        return buildProfileResponse(profile);
    }

    @Transactional
    public Map<String, Object> updateProfile(Long userId, ContractorProfileRequest request) {
        ContractorProfile profile = contractorProfileRepository.findByUserId(userId)
                .orElseGet(() -> {
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new IllegalArgumentException("User not found"));
                    return ContractorProfile.builder().user(user).rating(BigDecimal.ZERO).completedJobs(0).build();
                });

        profile.setCompanyName(request.getCompanyName());
        profile.setRegistrationNumber(request.getRegistrationNumber());
        profile = contractorProfileRepository.save(profile);
        return buildProfileResponse(profile);
    }

    private Map<String, Object> buildProfileResponse(ContractorProfile profile) {
        Map<String, Object> response = new HashMap<>();
        response.put("id", profile.getId());
        response.put("userId", profile.getUser().getId());
        response.put("companyName", profile.getCompanyName());
        response.put("registrationNumber", profile.getRegistrationNumber());
        response.put("rating", profile.getRating());
        response.put("completedJobs", profile.getCompletedJobs());
        response.put("name", profile.getUser().getName());
        response.put("email", profile.getUser().getEmail());
        return response;
    }
}
