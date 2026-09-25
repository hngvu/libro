package soqe.libro.server.dto;

import lombok.Builder;
import java.time.LocalDateTime;
import java.util.List;

@Builder
public record CollectionResponse(
        Long id,
        String name,
        String slug,
        String description,
        String coverImage,
        String type,
        boolean isDefault,
        int bookCount,
        boolean pinned,
        int displayOrder,
        List<BookPublicResponse> previewBooks,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
