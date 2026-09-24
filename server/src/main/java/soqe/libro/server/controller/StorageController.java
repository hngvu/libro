package soqe.libro.server.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import soqe.libro.server.dto.FileUploadResponse;
import soqe.libro.server.dto.PresignedUploadResponse;
import soqe.libro.server.service.StorageService;

import java.time.Duration;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/storage")
@RequiredArgsConstructor
public class StorageController {

    private final StorageService storageService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<FileUploadResponse> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "folder", required = false, defaultValue = "covers") String folder) {
        return ResponseEntity.ok(storageService.uploadFile(folder, file));
    }

    @GetMapping("/presigned-upload")
    public ResponseEntity<PresignedUploadResponse> getPresignedUploadUrl(
            @RequestParam("filename") String filename,
            @RequestParam(value = "contentType", required = false, defaultValue = "application/octet-stream") String contentType,
            @RequestParam(value = "folder", required = false, defaultValue = "covers") String folder) {
        return ResponseEntity.ok(storageService.generatePresignedUploadUrl(folder, filename, contentType, Duration.ofMinutes(15)));
    }

    @DeleteMapping
    public ResponseEntity<Map<String, String>> deleteFile(@RequestParam("fileUrl") String fileUrl) {
        storageService.deleteFile(fileUrl);
        return ResponseEntity.ok(Map.of("message", "File deleted successfully", "fileUrl", fileUrl));
    }
}

