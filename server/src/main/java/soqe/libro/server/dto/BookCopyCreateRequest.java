package soqe.libro.server.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record BookCopyCreateRequest(
        @NotBlank(message = "Barcode cannot be empty")
        String barcode,
        
        @NotNull(message = "Book ID is required")
        Long bookId,

        String location
) {}
