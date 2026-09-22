package soqe.libro.server.controller;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.HandlerMapping;
import soqe.libro.server.dto.FileUploadResponse;
import soqe.libro.server.dto.PresignedUploadResponse;
import soqe.libro.server.exception.ResourceNotFoundException;
import soqe.libro.server.service.LocalStorageService;
import soqe.libro.server.service.StorageService;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
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

    /**
     * Serves locally saved files when using LocalStorageService
     */
    @GetMapping("/files/**")
    public ResponseEntity<Resource> serveLocalFile(HttpServletRequest request) {
        String pathWithinHandlerMapping = (String) request.getAttribute(HandlerMapping.PATH_WITHIN_HANDLER_MAPPING_ATTRIBUTE);
        String bestMatchingPattern = (String) request.getAttribute(HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE);
        String key = new AntPathMatcher().extractPathWithinPattern(bestMatchingPattern, pathWithinHandlerMapping);

        if (storageService instanceof LocalStorageService localService) {
            Path filePath = localService.loadFileAsPath(key);
            if (filePath != null) {
                try {
                    Resource resource = new UrlResource(filePath.toUri());
                    if (resource.exists() || resource.isReadable()) {
                        String contentType = Files.probeContentType(filePath);
                        if (contentType == null) {
                            contentType = "application/octet-stream";
                        }
                        return ResponseEntity.ok()
                                .contentType(MediaType.parseMediaType(contentType))
                                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                                .body(resource);
                    }
                } catch (MalformedURLException e) {
                    log.error("Could not read file: {}", key, e);
                } catch (IOException e) {
                    log.warn("Could not determine content type for file: {}", key);
                }
            }
        }

        throw new ResourceNotFoundException("File not found: " + key);
    }
}
