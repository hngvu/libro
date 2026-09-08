package soqe.libro.server.dto;

import jakarta.validation.constraints.Min;
import java.time.LocalDate;

public record LoanRenewRequest(
        @Min(value = 1, message = "Extension days must be at least 1")
        Integer extensionDays,

        LocalDate newDueDate
) {}
