package com.municipality.pothole.service;

import com.municipality.pothole.dto.request.LoginRequest;
import com.municipality.pothole.dto.request.RegisterRequest;
import com.municipality.pothole.dto.request.UpdateProfileRequest;
import com.municipality.pothole.dto.response.AuthResponse;
import com.municipality.pothole.model.Role;
import com.municipality.pothole.model.User;
import com.municipality.pothole.repository.ContractorProfileRepository;
import com.municipality.pothole.repository.UserRepository;
import com.municipality.pothole.security.JwtUtil;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock UserRepository               userRepository;
    @Mock ContractorProfileRepository  contractorProfileRepository;
    @Mock PasswordEncoder              passwordEncoder;
    @Mock JwtUtil                      jwtUtil;

    @InjectMocks AuthService authService;

    // ── register ───────────────────────────────────────────────

    @Test
    void register_citizen_success() {
        RegisterRequest req = new RegisterRequest();
        req.setEmail("new@test.com");
        req.setPassword("pass123");
        req.setName("Alice");
        req.setRole("CITIZEN");

        when(userRepository.existsByEmail("new@test.com")).thenReturn(false);
        when(passwordEncoder.encode("pass123")).thenReturn("hashed");
        User saved = User.builder().id(1L).email("new@test.com").name("Alice")
                .role(Role.CITIZEN).password("hashed").build();
        when(userRepository.save(any(User.class))).thenReturn(saved);
        when(jwtUtil.generateToken(saved)).thenReturn("token123");

        AuthResponse resp = authService.register(req);

        assertThat(resp.getToken()).isEqualTo("token123");
        assertThat(resp.getRole()).isEqualTo("CITIZEN");
        assertThat(resp.getName()).isEqualTo("Alice");
        verify(contractorProfileRepository, never()).save(any());
    }

    @Test
    void register_contractor_createsProfile() {
        RegisterRequest req = new RegisterRequest();
        req.setEmail("bob@contractor.com");
        req.setPassword("pass");
        req.setName("Bob");
        req.setRole("CONTRACTOR");
        req.setCompanyName("Bob Repairs");
        req.setRegistrationNumber("REG123");

        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("hashed");
        User saved = User.builder().id(2L).email("bob@contractor.com").name("Bob")
                .role(Role.CONTRACTOR).password("hashed").build();
        when(userRepository.save(any(User.class))).thenReturn(saved);
        when(jwtUtil.generateToken(saved)).thenReturn("tok");

        authService.register(req);

        verify(contractorProfileRepository).save(argThat(p ->
                p.getCompanyName().equals("Bob Repairs") &&
                p.getRegistrationNumber().equals("REG123")));
    }

    @Test
    void register_contractor_usesDefaultCompanyName_whenBlank() {
        RegisterRequest req = new RegisterRequest();
        req.setEmail("x@x.com"); req.setPassword("p"); req.setName("Dave"); req.setRole("CONTRACTOR");

        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("h");
        User saved = User.builder().id(3L).email("x@x.com").name("Dave")
                .role(Role.CONTRACTOR).password("h").build();
        when(userRepository.save(any())).thenReturn(saved);
        when(jwtUtil.generateToken(any())).thenReturn("t");

        authService.register(req);

        verify(contractorProfileRepository).save(argThat(p ->
                p.getCompanyName().equals("Dave Company")));
    }

    @Test
    void register_duplicateEmail_throws() {
        RegisterRequest req = new RegisterRequest();
        req.setEmail("dup@test.com");
        when(userRepository.existsByEmail("dup@test.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("already registered");
    }

    @Test
    void register_invalidRole_throws() {
        RegisterRequest req = new RegisterRequest();
        req.setEmail("x@x.com");
        req.setRole("ADMIN");
        when(userRepository.existsByEmail(anyString())).thenReturn(false);

        assertThatThrownBy(() -> authService.register(req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Invalid role");
    }

    // ── login ──────────────────────────────────────────────────

    @Test
    void login_success() {
        User user = User.builder().id(1L).email("a@b.com").name("A")
                .role(Role.CITIZEN).password("hashed").build();
        LoginRequest req = new LoginRequest();
        req.setEmail("a@b.com"); req.setPassword("pass");

        when(userRepository.findByEmail("a@b.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("pass", "hashed")).thenReturn(true);
        when(jwtUtil.generateToken(user)).thenReturn("jwt");

        AuthResponse resp = authService.login(req);

        assertThat(resp.getToken()).isEqualTo("jwt");
        assertThat(resp.getEmail()).isEqualTo("a@b.com");
    }

    @Test
    void login_wrongPassword_throws() {
        User user = User.builder().id(1L).email("a@b.com").password("hashed")
                .role(Role.CITIZEN).build();
        LoginRequest req = new LoginRequest();
        req.setEmail("a@b.com"); req.setPassword("wrong");

        when(userRepository.findByEmail("a@b.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", "hashed")).thenReturn(false);

        assertThatThrownBy(() -> authService.login(req))
                .isInstanceOf(BadCredentialsException.class);
    }

    @Test
    void login_unknownEmail_throws() {
        LoginRequest req = new LoginRequest();
        req.setEmail("nobody@x.com"); req.setPassword("pass");
        when(userRepository.findByEmail("nobody@x.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(req))
                .isInstanceOf(BadCredentialsException.class);
    }

    // ── updateProfile ──────────────────────────────────────────

    @Test
    void updateProfile_updatesNameAndPhone() {
        User user = User.builder().id(1L).email("a@b.com").name("Old")
                .role(Role.CITIZEN).password("h").build();
        UpdateProfileRequest req = new UpdateProfileRequest();
        req.setName("New Name"); req.setPhone("0821234567");

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));
        when(jwtUtil.generateToken(any())).thenReturn("newToken");

        AuthResponse resp = authService.updateProfile(1L, req);

        assertThat(resp.getName()).isEqualTo("New Name");
        assertThat(resp.getToken()).isEqualTo("newToken");
    }
}
