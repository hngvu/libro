package soqe.libro.server.dto;

import jakarta.validation.constraints.NotBlank;
import soqe.libro.server.entity.BookCopy;

public record BookCopyUpdateRequest(
        String barcode,
        
        BookCopy.Status status,

        String location
) {}
