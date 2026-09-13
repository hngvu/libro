package soqe.libro.server.dto;

import lombok.Builder;
import java.time.LocalDateTime;
import java.util.List;

@Builder
public record MembershipPlanResponse(
        Long id,
        String name,
        String code,
        String description,
        String stripeProductId,
        Integer maxActiveLoans,
        Integer loanDurationDays,
        Integer maxRenewals,
        String status,
        List<MembershipPlanPriceDTO> prices,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
