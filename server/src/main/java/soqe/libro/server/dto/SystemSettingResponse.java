package soqe.libro.server.dto;

import lombok.Builder;
import java.time.LocalDateTime;

@Builder
public record SystemSettingResponse(
        Long id,
        String settingKey,
        String settingValue,
        String description,
        String category,
        String dataType,
        LocalDateTime updatedAt,
        String updatedBy
) {}
