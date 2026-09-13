package soqe.libro.server.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record MembershipPlanCreateRequest(
        @NotBlank(message = "Plan name is required")
        String name,

        @NotBlank(message = "Plan code is required")
        String code,

        String description,

        String stripeProductId,

        @NotNull(message = "Max active loans is required")
        Integer maxActiveLoans,

        @NotNull(message = "Loan duration days is required")
        Integer loanDurationDays,

        @NotNull(message = "Max renewals is required")
        Integer maxRenewals,

        String status,

        @Valid
        List<MembershipPlanPriceDTO> prices
) {}
