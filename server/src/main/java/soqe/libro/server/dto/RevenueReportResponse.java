package soqe.libro.server.dto;

import lombok.Builder;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Builder
public record RevenueReportResponse(
    SubscriptionRevenueSummary subscriptionRevenue,
    FinesRevenueSummary finesRevenue
) {
    @Builder
    public record SubscriptionRevenueSummary(
        BigDecimal totalMRR,
        long activeSubscribers,
        List<PlanRevenueBreakdown> planBreakdown
    ) {}

    @Builder
    public record PlanRevenueBreakdown(
        String planCode,
        String planName,
        long subscribersCount,
        BigDecimal price,
        BigDecimal revenue
    ) {}

    @Builder
    public record FinesRevenueSummary(
        BigDecimal totalCollected,
        BigDecimal totalPending,
        BigDecimal totalWaived,
        Map<String, BigDecimal> methodBreakdown,
        Map<String, BigDecimal> reasonBreakdown
    ) {}
}
