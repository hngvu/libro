package soqe.libro.server.service;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import soqe.libro.server.dto.FileUploadResponse;
import soqe.libro.server.dto.PresignedUploadResponse;
import soqe.libro.server.exception.BusinessValidationException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.time.Duration;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@ConditionalOnProperty(name = "aws.s3.enabled", havingValue = "false", matchIfMissing = true)
public class LocalStorageService implements StorageService {

    @Value("${storage.local.upload-dir:uploads}")
    private String uploadDir;

    @Value("${storage.local.base-url:http://localhost:8080/api/storage/files}")
    private String baseUrl;

    private Path rootLocation;

    @PostConstruct
    public void init() {
        this.rootLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.rootLocation);
            log.info("Initialized LocalStorageService at path: {}", this.rootLocation);
        } catch (IOException e) {
            log.error("Could not initialize local storage folder: {}", this.rootLocation, e);
        }
    }

    @Override
    public FileUploadResponse uploadFile(String folder, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessValidationException("Upload failed", Map.of("file", "File is empty or missing"));
        }

        try {
            String originalFilename = file.getOriginalFilename();
            String contentType = file.getContentType();
            if (!StringUtils.hasText(contentType)) {
                contentType = "application/octet-stream";
            }
            return uploadBytes(folder, originalFilename, file.getBytes(), contentType);
        } catch (IOException e) {
            log.error("Failed to read file for local storage", e);
            throw new BusinessValidationException("Upload failed", Map.of("file", "Could not read uploaded file: " + e.getMessage()));
        }
    }

    @Override
    public FileUploadResponse uploadBytes(String folder, String filename, byte[] data, String contentType) {
        if (data == null || data.length == 0) {
            throw new BusinessValidationException("Upload failed", Map.of("data", "Payload is empty"));
        }

        String key = generateLocalKey(folder, filename);
        Path destination = this.rootLocation.resolve(key).normalize();

        try {
            Files.createDirectories(destination.getParent());
            Files.write(destination, data, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
            log.info("Saved file locally to: {}", destination);
        } catch (IOException e) {
            log.error("Could not store file locally to: {}", destination, e);
            throw new BusinessValidationException("Storage error", Map.of("file", "Could not save file locally"));
        }

        String fileUrl = getPublicUrl(key);

        return FileUploadResponse.builder()
                .fileUrl(fileUrl)
                .key(key)
                .originalFilename(filename)
                .contentType(contentType)
                .sizeBytes(data.length)
                .build();
    }

    @Override
    public void deleteFile(String keyOrUrl) {
        if (!StringUtils.hasText(keyOrUrl)) return;
        String key = extractKey(keyOrUrl);
        Path target = this.rootLocation.resolve(key).normalize();
        try {
            Files.deleteIfExists(target);
            log.info("Deleted local file: {}", target);
        } catch (IOException e) {
            log.warn("Could not delete local file: {}", target, e);
        }
    }

    @Override
    public PresignedUploadResponse generatePresignedUploadUrl(String folder, String filename, String contentType, Duration expiration) {
        String key = generateLocalKey(folder, filename);
        String directUploadUrl = baseUrl.replaceAll("/files.*", "") + "/upload?folder=" + folder;

        return PresignedUploadResponse.builder()
                .uploadUrl(directUploadUrl)
                .fileUrl(getPublicUrl(key))
                .key(key)
                .expiresInSeconds(expiration != null ? expiration.toSeconds() : 900)
                .build();
    }

    @Override
    public String getPublicUrl(String key) {
        if (!StringUtils.hasText(key)) return null;
        String cleanBase = baseUrl.replaceAll("/+$", "");
        return cleanBase + "/" + key.replace("\\", "/");
    }

    public Path loadFileAsPath(String key) {
        Path file = this.rootLocation.resolve(key).normalize();
        if (Files.exists(file) && Files.isReadable(file)) {
            return file;
        }
        return null;
    }

    private String generateLocalKey(String folder, String filename) {
        String cleanFolder = StringUtils.hasText(folder) ? folder.trim().replaceAll("^/+|/+$", "") : "uploads";
        String cleanFilename = StringUtils.hasText(filename) ? filename.replaceAll("[^a-zA-Z0-9._-]", "_") : "file";
        String uuid = UUID.randomUUID().toString().substring(0, 8);
        return cleanFolder + "/" + uuid + "-" + cleanFilename;
    }

    private String extractKey(String keyOrUrl) {
        if (keyOrUrl.contains("/storage/files/")) {
            return keyOrUrl.substring(keyOrUrl.indexOf("/storage/files/") + "/storage/files/".length());
        }
        return keyOrUrl;
    }
}
