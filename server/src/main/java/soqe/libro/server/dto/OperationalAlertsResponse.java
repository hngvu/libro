package soqe.libro.server.dto;

import lombok.Builder;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Builder
public record OperationalAlertsResponse(
    List<SevereOverdueAlert> severeOverdues,
    List<OutOfStockBookAlert> outOfStockBooks,
    long totalSevereOverdues,
    long totalOutOfStock
) {
    @Builder
    public record SevereOverdueAlert(
        Long loanId,
        String loanCode,
        String bookTitle,
        String bookHandle,
        String borrowerName,
        String borrowerEmail,
        LocalDate dueDate,
        long daysOverdue,
        BigDecimal estimatedFine
    ) {}

    @Builder
    public record OutOfStockBookAlert(
        Long bookId,
        String bookHandle,
        String title,
        int totalCopies
    ) {}
}
