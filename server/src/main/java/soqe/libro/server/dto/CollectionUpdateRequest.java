package soqe.libro.server.dto;

import jakarta.validation.constraints.Size;

public record CollectionUpdateRequest(
        @Size(max = 150, message = "Name must not exceed 150 characters")
        String name,

        @Size(max = 500, message = "Description must not exceed 500 characters")
        String description,

        String coverImage,
        Boolean pinned,
        Integer displayOrder
) {}
