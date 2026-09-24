package soqe.libro.server.dto;

import lombok.Builder;

import java.time.LocalDateTime;

@Builder
public record ActivityLogResponse(
        Long id,
        String timestamp,
        LocalDateTime createdAt,
        String operator,
        String action,
        String entityType,
        Long entityId,
        String detail,
        String ipAddress
) {}
