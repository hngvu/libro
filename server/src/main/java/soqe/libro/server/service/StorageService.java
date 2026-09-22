package soqe.libro.server.service;

import org.springframework.web.multipart.MultipartFile;
import soqe.libro.server.dto.FileUploadResponse;
import soqe.libro.server.dto.PresignedUploadResponse;

import java.time.Duration;

public interface StorageService {
    FileUploadResponse uploadFile(String folder, MultipartFile file);
    FileUploadResponse uploadBytes(String folder, String filename, byte[] data, String contentType);
    void deleteFile(String keyOrUrl);
    PresignedUploadResponse generatePresignedUploadUrl(String folder, String filename, String contentType, Duration expiration);
    String getPublicUrl(String key);
}
