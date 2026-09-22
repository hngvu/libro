package soqe.libro.server.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;
import soqe.libro.server.config.AwsS3Properties;
import soqe.libro.server.dto.FileUploadResponse;
import soqe.libro.server.dto.PresignedUploadResponse;
import soqe.libro.server.exception.BusinessValidationException;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@ConditionalOnProperty(name = "aws.s3.enabled", havingValue = "true")
@RequiredArgsConstructor
public class S3StorageService implements StorageService {

    private final S3Client s3Client;
    private final S3Presigner s3Presigner;
    private final AwsS3Properties properties;

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
            log.error("Failed to read file bytes for upload", e);
            throw new BusinessValidationException("Upload failed", Map.of("file", "Could not read uploaded file: " + e.getMessage()));
        }
    }

    @Override
    public FileUploadResponse uploadBytes(String folder, String filename, byte[] data, String contentType) {
        if (data == null || data.length == 0) {
            throw new BusinessValidationException("Upload failed", Map.of("data", "Payload is empty"));
        }

        String key = generateS3Key(folder, filename);

        PutObjectRequest putReq = PutObjectRequest.builder()
                .bucket(properties.getBucketName())
                .key(key)
                .contentType(contentType)
                .build();

        s3Client.putObject(putReq, RequestBody.fromBytes(data));
        String publicUrl = getPublicUrl(key);

        log.info("Uploaded object to S3: bucket={}, key={}, size={}", properties.getBucketName(), key, data.length);

        return FileUploadResponse.builder()
                .fileUrl(publicUrl)
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

        try {
            DeleteObjectRequest deleteReq = DeleteObjectRequest.builder()
                    .bucket(properties.getBucketName())
                    .key(key)
                    .build();
            s3Client.deleteObject(deleteReq);
            log.info("Deleted object from S3: bucket={}, key={}", properties.getBucketName(), key);
        } catch (Exception e) {
            log.warn("Failed to delete S3 object: key={}", key, e);
        }
    }

    @Override
    public PresignedUploadResponse generatePresignedUploadUrl(String folder, String filename, String contentType, Duration expiration) {
        String key = generateS3Key(folder, filename);
        if (expiration == null) {
            expiration = Duration.ofMinutes(15);
        }

        PutObjectRequest putReq = PutObjectRequest.builder()
                .bucket(properties.getBucketName())
                .key(key)
                .contentType(contentType)
                .build();

        PutObjectPresignRequest presignReq = PutObjectPresignRequest.builder()
                .signatureDuration(expiration)
                .putObjectRequest(putReq)
                .build();

        PresignedPutObjectRequest presigned = s3Presigner.presignPutObject(presignReq);
        String uploadUrl = presigned.url().toString();
        String fileUrl = getPublicUrl(key);

        return PresignedUploadResponse.builder()
                .uploadUrl(uploadUrl)
                .fileUrl(fileUrl)
                .key(key)
                .expiresInSeconds(expiration.toSeconds())
                .build();
    }

    @Override
    public String getPublicUrl(String key) {
        if (!StringUtils.hasText(key)) return null;

        // Custom CDN / public domain
        if (StringUtils.hasText(properties.getPublicUrlPrefix())) {
            String prefix = properties.getPublicUrlPrefix().replaceAll("/+$", "");
            return prefix + "/" + key;
        }

        // Custom endpoint (MinIO, R2, LocalStack)
        if (StringUtils.hasText(properties.getEndpoint())) {
            String endpoint = properties.getEndpoint().replaceAll("/+$", "");
            return endpoint + "/" + properties.getBucketName() + "/" + key;
        }

        // Standard AWS S3 URL
        return String.format("https://%s.s3.%s.amazonaws.com/%s",
                properties.getBucketName(),
                properties.getRegion(),
                key);
    }

    private String generateS3Key(String folder, String filename) {
        String cleanFolder = StringUtils.hasText(folder) ? folder.trim().replaceAll("^/+|/+$", "") : "uploads";
        String cleanFilename = StringUtils.hasText(filename) ? filename.replaceAll("[^a-zA-Z0-9._-]", "_") : "file";
        String uuid = UUID.randomUUID().toString().substring(0, 8);
        return cleanFolder + "/" + uuid + "-" + cleanFilename;
    }

    private String extractKey(String keyOrUrl) {
        if (!keyOrUrl.startsWith("http://") && !keyOrUrl.startsWith("https://")) {
            return keyOrUrl;
        }
        // Extract key from URL
        try {
            java.net.URI uri = java.net.URI.create(keyOrUrl);
            String path = uri.getPath().replaceAll("^/+", "");
            if (path.startsWith(properties.getBucketName() + "/")) {
                return path.substring(properties.getBucketName().length() + 1);
            }
            return path;
        } catch (Exception e) {
            return keyOrUrl;
        }
    }
}
