package soqe.libro.server.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import java.math.BigDecimal;

public record MembershipPlanCreateRequest(
        @NotBlank(message = "Plan name is required")
        String name,

        @NotBlank(message = "Plan code is required")
        String code,

        String description,

        @NotNull(message = "Price is required")
        @PositiveOrZero(message = "Price must be non-negative")
        BigDecimal price,

        @NotBlank(message = "Billing cycle is required")
        String billingCycle,

        String stripePriceId,
        String stripeProductId,

        @NotNull(message = "Max active loans is required")
        Integer maxActiveLoans,

        @NotNull(message = "Loan duration days is required")
        Integer loanDurationDays,

        @NotNull(message = "Max renewals is required")
        Integer maxRenewals
) {}
