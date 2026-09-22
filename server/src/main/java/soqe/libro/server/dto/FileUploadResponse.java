package soqe.libro.server.dto;

import lombok.Builder;

@Builder
public record FileUploadResponse(
        String fileUrl,
        String key,
        String originalFilename,
        String contentType,
        long sizeBytes
) {}
