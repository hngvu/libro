package soqe.libro.server.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Builder;
import java.math.BigDecimal;

@Builder
public record MembershipPlanPriceDTO(
        Long id,
        @NotNull(message = "Billing cycle is required")
        String billingCycle,
        @NotNull(message = "Price is required")
        @PositiveOrZero(message = "Price must be positive or zero")
        BigDecimal price,
        String stripePriceId
) {}
