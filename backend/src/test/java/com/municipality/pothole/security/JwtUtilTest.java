package com.municipality.pothole.security;

import com.municipality.pothole.model.Role;
import com.municipality.pothole.model.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.*;

class JwtUtilTest {

    private JwtUtil jwtUtil;

    // 256-bit base64 secret for tests
    private static final String TEST_SECRET =
            "dGVzdFNlY3JldEtleUZvclVuaXRUZXN0aW5nT25seTEyMzQ1Njc4";

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil();
        ReflectionTestUtils.setField(jwtUtil, "jwtSecret", TEST_SECRET);
        ReflectionTestUtils.setField(jwtUtil, "jwtExpirationMs", 86_400_000L);
    }

    private User makeUser(Long id, String email, String name, Role role) {
        return User.builder()
                .id(id)
                .email(email)
                .name(name)
                .role(role)
                .password("hashed")
                .build();
    }

    @Test
    void generateToken_containsExpectedClaims() {
        User user = makeUser(1L, "test@example.com", "Test User", Role.CITIZEN);
        String token = jwtUtil.generateToken(user);

        assertThat(token).isNotBlank();
        assertThat(jwtUtil.extractEmail(token)).isEqualTo("test@example.com");
        assertThat(jwtUtil.extractUserId(token)).isEqualTo(1L);
    }

    @Test
    void extractEmail_returnsCorrectEmail() {
        User user = makeUser(2L, "official@city.gov.za", "Official", Role.MUNICIPAL_OFFICIAL);
        String token = jwtUtil.generateToken(user);

        assertThat(jwtUtil.extractEmail(token)).isEqualTo("official@city.gov.za");
    }

    @Test
    void extractUserId_returnsCorrectId() {
        User user = makeUser(42L, "contractor@example.com", "Contractor", Role.CONTRACTOR);
        String token = jwtUtil.generateToken(user);

        assertThat(jwtUtil.extractUserId(token)).isEqualTo(42L);
    }

    @Test
    void isTokenValid_returnsTrueForMatchingUser() {
        User user = makeUser(3L, "citizen@example.com", "Citizen", Role.CITIZEN);
        String token = jwtUtil.generateToken(user);

        UserDetails userDetails = org.springframework.security.core.userdetails.User
                .withUsername("citizen@example.com")
                .password("x")
                .roles("CITIZEN")
                .build();

        assertThat(jwtUtil.isTokenValid(token, userDetails)).isTrue();
    }

    @Test
    void isTokenValid_returnsFalseForWrongEmail() {
        User user = makeUser(3L, "citizen@example.com", "Citizen", Role.CITIZEN);
        String token = jwtUtil.generateToken(user);

        UserDetails wrongUser = org.springframework.security.core.userdetails.User
                .withUsername("other@example.com")
                .password("x")
                .roles("CITIZEN")
                .build();

        assertThat(jwtUtil.isTokenValid(token, wrongUser)).isFalse();
    }

    @Test
    void expiredToken_throwsException() {
        // Set expiration to 1 ms so it expires instantly
        ReflectionTestUtils.setField(jwtUtil, "jwtExpirationMs", 1L);
        User user = makeUser(1L, "test@example.com", "Test", Role.CITIZEN);
        String token = jwtUtil.generateToken(user);

        // Token should be expired after 1ms
        try { Thread.sleep(10); } catch (InterruptedException ignored) {}

        assertThatThrownBy(() -> jwtUtil.extractEmail(token))
                .isInstanceOf(Exception.class);
    }
}
