package soqe.libro.server.dto;

import jakarta.validation.constraints.NotBlank;
import soqe.libro.server.entity.BookCopy;

public record BookCopyUpdateRequest(
        @NotBlank(message = "Barcode cannot be empty")
        String barcode,
        
        BookCopy.Status status
) {}
