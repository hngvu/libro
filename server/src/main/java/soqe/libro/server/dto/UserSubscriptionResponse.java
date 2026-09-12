package soqe.libro.server.dto;

import lombok.Builder;
import java.time.LocalDateTime;

@Builder
public record UserSubscriptionResponse(
        Long id,
        Long userId,
        String userEmail,
        Long planId,
        String planName,
        String planCode,
        Integer maxActiveLoans,
        Integer loanDurationDays,
        Integer maxRenewals,
        String status,
        String stripeCustomerId,
        String stripeSubscriptionId,
        LocalDateTime currentPeriodStart,
        LocalDateTime currentPeriodEnd,
        Boolean cancelAtPeriodEnd,
        LocalDateTime canceledAt
) {}
