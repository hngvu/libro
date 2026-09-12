package soqe.libro.server.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record LoanCreateRequest(
        @NotNull(message = "User ID cannot be null")
        Long userId,

        Long bookCopyId,

        String barcode,

        LocalDate dueDate
) {}
