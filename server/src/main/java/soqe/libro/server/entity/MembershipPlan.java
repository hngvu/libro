package soqe.libro.server.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "membership_plans")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MembershipPlan extends BaseEntity {

    @Column(nullable = false, length = 100)
    private String name;

    @Column(unique = true, nullable = false, length = 50)
    private String code;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Enumerated(EnumType.STRING)
    @Column(name = "billing_cycle", nullable = false, length = 20)
    private BillingCycle billingCycle;

    @Column(name = "stripe_price_id", length = 100)
    private String stripePriceId;

    @Column(name = "stripe_product_id", length = 100)
    private String stripeProductId;

    @Column(name = "max_active_loans", nullable = false)
    @Builder.Default
    private Integer maxActiveLoans = 3;

    @Column(name = "loan_duration_days", nullable = false)
    @Builder.Default
    private Integer loanDurationDays = 14;

    @Column(name = "max_renewals", nullable = false)
    @Builder.Default
    private Integer maxRenewals = 1;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Status status = Status.ACTIVE;

    public enum BillingCycle {
        MONTHLY, YEARLY, LIFETIME
    }

    public enum Status {
        ACTIVE, INACTIVE, ARCHIVED
    }
}
