package com.municipality.pothole.controller;

import com.municipality.pothole.dto.request.LoginRequest;
import com.municipality.pothole.dto.request.RegisterRequest;
import com.municipality.pothole.dto.request.UpdateProfileRequest;
import com.municipality.pothole.dto.response.AuthResponse;
import com.municipality.pothole.security.JwtUtil;
import com.municipality.pothole.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final JwtUtil jwtUtil;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PutMapping("/profile")
    public ResponseEntity<AuthResponse> updateProfile(
            @Valid @RequestBody UpdateProfileRequest request,
            @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        Long userId = jwtUtil.extractUserId(token);
        return ResponseEntity.ok(authService.updateProfile(userId, request));
    }
}
