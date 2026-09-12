package soqe.libro.server.dto;

import lombok.Builder;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Builder
public record MembershipPlanResponse(
        Long id,
        String name,
        String code,
        String description,
        BigDecimal price,
        String billingCycle,
        String stripePriceId,
        String stripeProductId,
        Integer maxActiveLoans,
        Integer loanDurationDays,
        Integer maxRenewals,
        String status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
