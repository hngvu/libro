package soqe.libro.server.dto;

import lombok.Builder;
import java.math.BigDecimal;

@Builder
public record DashboardSummaryResponse(
    long totalBooks,
    long totalCopies,
    long availableCopies,
    long activeLoans,
    long overdueLoans,
    long totalMembers,
    long activeSubscriptions,
    long pendingFinesCount,
    BigDecimal pendingFinesAmount,
    BigDecimal collectedFinesAmount,
    BigDecimal estimatedMonthlyRecurringRevenue
) {}
