package com.municipality.pothole.config;

import com.municipality.pothole.model.ContractorProfile;
import com.municipality.pothole.model.Role;
import com.municipality.pothole.model.User;
import com.municipality.pothole.repository.ContractorProfileRepository;
import com.municipality.pothole.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Optional;

/**
 * Ensures the three demo accounts always exist with the correct passwords.
 * Runs on every startup — creates accounts if missing, resets their
 * password if they already exist (so the login page credentials always work).
 *
 *   Citizen    — citizen@pothole.com    / Citizen123!
 *   Municipal  — admin@pothole.com      / Admin123!
 *   Contractor — contractor@pothole.com / Contractor123!
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements ApplicationRunner {

    private final UserRepository              userRepository;
    private final ContractorProfileRepository contractorProfileRepository;
    private final PasswordEncoder             passwordEncoder;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        upsertCitizen();
        upsertMunicipal();
        upsertContractor();
        log.info("DataSeeder complete — demo accounts ready.");
    }

    /* ── Citizen ─────────────────────────────────────────────── */
    private void upsertCitizen() {
        Optional<User> existing = userRepository.findByEmail("citizen@pothole.com");
        if (existing.isPresent()) {
            User u = existing.get();
            u.setPassword(passwordEncoder.encode("Citizen123!"));
            u.setRole(Role.CITIZEN);
            userRepository.save(u);
            log.info("Reset password for citizen account: {}", u.getEmail());
        } else {
            User u = User.builder()
                    .email("citizen@pothole.com")
                    .password(passwordEncoder.encode("Citizen123!"))
                    .name("Demo Citizen")
                    .phone("0810001111")
                    .role(Role.CITIZEN)
                    .build();
            userRepository.save(u);
            log.info("Created citizen account: {}", u.getEmail());
        }
    }

    /* ── Municipal Official ───────────────────────────────────── */
    private void upsertMunicipal() {
        Optional<User> existing = userRepository.findByEmail("admin@pothole.com");
        if (existing.isPresent()) {
            User u = existing.get();
            u.setPassword(passwordEncoder.encode("Admin123!"));
            u.setRole(Role.MUNICIPAL_OFFICIAL);
            userRepository.save(u);
            log.info("Reset password for municipal account: {}", u.getEmail());
        } else {
            User u = User.builder()
                    .email("admin@pothole.com")
                    .password(passwordEncoder.encode("Admin123!"))
                    .name("Municipal Admin")
                    .phone("0820002222")
                    .role(Role.MUNICIPAL_OFFICIAL)
                    .build();
            userRepository.save(u);
            log.info("Created municipal account: {}", u.getEmail());
        }
    }

    /* ── Contractor ──────────────────────────────────────────── */
    private void upsertContractor() {
        Optional<User> existing = userRepository.findByEmail("contractor@pothole.com");
        if (existing.isPresent()) {
            User u = existing.get();
            u.setPassword(passwordEncoder.encode("Contractor123!"));
            u.setRole(Role.CONTRACTOR);
            userRepository.save(u);
            // ensure profile exists
            if (contractorProfileRepository.findByUserId(u.getId()).isEmpty()) {
                ContractorProfile profile = ContractorProfile.builder()
                        .user(u)
                        .companyName("Demo Roads (Pty) Ltd")
                        .registrationNumber("2024/001234/07")
                        .rating(BigDecimal.valueOf(4.2))
                        .completedJobs(7)
                        .build();
                contractorProfileRepository.save(profile);
            }
            log.info("Reset password for contractor account: {}", u.getEmail());
        } else {
            User u = User.builder()
                    .email("contractor@pothole.com")
                    .password(passwordEncoder.encode("Contractor123!"))
                    .name("Demo Contractor")
                    .phone("0830003333")
                    .role(Role.CONTRACTOR)
                    .build();
            u = userRepository.save(u);

            ContractorProfile profile = ContractorProfile.builder()
                    .user(u)
                    .companyName("Demo Roads (Pty) Ltd")
                    .registrationNumber("2024/001234/07")
                    .rating(BigDecimal.valueOf(4.2))
                    .completedJobs(7)
                    .build();
            contractorProfileRepository.save(profile);
            log.info("Created contractor account: {}", u.getEmail());
        }
    }
}
