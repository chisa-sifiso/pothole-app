package com.municipality.pothole.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileStorageService {

    @Value("${app.upload.dir}")
    private String uploadDir;

    public String storeFile(MultipartFile file, String subfolder) {
        try {
            String extension = getExtension(file.getOriginalFilename());
            String filename = UUID.randomUUID() + extension;

            Path uploadPath = Paths.get(uploadDir).toAbsolutePath().resolve(subfolder);
            Files.createDirectories(uploadPath);

            Path targetPath = uploadPath.resolve(filename);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            return "/uploads/" + subfolder + "/" + filename;
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file: " + e.getMessage(), e);
        }
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return ".jpg";
        return filename.substring(filename.lastIndexOf("."));
    }
}
