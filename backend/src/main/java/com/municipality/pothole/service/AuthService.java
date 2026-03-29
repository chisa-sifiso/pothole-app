package com.municipality.pothole.service;

import com.municipality.pothole.dto.request.LoginRequest;
import com.municipality.pothole.dto.request.RegisterRequest;
import com.municipality.pothole.dto.request.UpdateProfileRequest;
import com.municipality.pothole.dto.response.AuthResponse;
import com.municipality.pothole.model.ContractorProfile;
import com.municipality.pothole.model.Role;
import com.municipality.pothole.model.User;
import com.municipality.pothole.repository.ContractorProfileRepository;
import com.municipality.pothole.repository.UserRepository;
import com.municipality.pothole.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final ContractorProfileRepository contractorProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already registered");
        }

        Role role;
        try {
            role = Role.valueOf(request.getRole().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid role: " + request.getRole());
        }

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .name(request.getName())
                .phone(request.getPhone())
                .role(role)
                .build();

        user = userRepository.save(user);

        // Create contractor profile (use provided details or sensible stubs)
        if (role == Role.CONTRACTOR) {
            String companyName = (request.getCompanyName() != null && !request.getCompanyName().isBlank())
                    ? request.getCompanyName()
                    : request.getName() + " Company";
            String registrationNumber = (request.getRegistrationNumber() != null && !request.getRegistrationNumber().isBlank())
                    ? request.getRegistrationNumber()
                    : "REG-" + user.getId() + "-PENDING";
            ContractorProfile profile = ContractorProfile.builder()
                    .user(user)
                    .companyName(companyName)
                    .registrationNumber(registrationNumber)
                    .build();
            contractorProfileRepository.save(profile);
        }

        String token = jwtUtil.generateToken(user);
        return AuthResponse.builder()
                .token(token)
                .role(user.getRole().name())
                .name(user.getName())
                .userId(user.getId())
                .email(user.getEmail())
                .build();
    }

    @Transactional
    public AuthResponse updateProfile(Long userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setName(request.getName());
        user.setPhone(request.getPhone());
        user = userRepository.save(user);
        String token = jwtUtil.generateToken(user);
        return AuthResponse.builder()
                .token(token)
                .role(user.getRole().name())
                .name(user.getName())
                .userId(user.getId())
                .email(user.getEmail())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BadCredentialsException("Invalid email or password");
        }

        String token = jwtUtil.generateToken(user);
        return AuthResponse.builder()
                .token(token)
                .role(user.getRole().name())
                .name(user.getName())
                .userId(user.getId())
                .email(user.getEmail())
                .build();
    }
}
