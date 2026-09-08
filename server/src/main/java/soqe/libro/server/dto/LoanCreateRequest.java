package soqe.libro.server.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record LoanCreateRequest(
        @NotNull(message = "User ID cannot be null")
        Long userId,

        @NotNull(message = "Book copy ID cannot be null")
        Long bookCopyId,

        LocalDate dueDate
) {}
