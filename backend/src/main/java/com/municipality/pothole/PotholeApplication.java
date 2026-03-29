package com.municipality.pothole;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class PotholeApplication {
    public static void main(String[] args) {
        SpringApplication.run(PotholeApplication.class, args);
    }
}
