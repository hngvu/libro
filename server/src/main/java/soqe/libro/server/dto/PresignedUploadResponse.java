package soqe.libro.server.dto;

import lombok.Builder;

@Builder
public record PresignedUploadResponse(
        String uploadUrl,
        String fileUrl,
        String key,
        long expiresInSeconds
) {}
