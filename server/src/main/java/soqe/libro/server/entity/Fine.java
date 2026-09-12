package soqe.libro.server.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "fines")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Fine extends BaseEntity {

    @Column(name = "fine_code", unique = true, nullable = false, updatable = false, length = 32)
    private String fineCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "loan_id")
    private Loan loan;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "book_id")
    private Book book;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private FineReason reason;

    @Column(name = "days_overdue")
    private Integer daysOverdue;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private FineStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", length = 20)
    private PaymentMethod paymentMethod;

    @Column(name = "stripe_session_id")
    private String stripeSessionId;

    @Column(name = "stripe_payment_intent_id")
    private String stripePaymentIntentId;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @Column(name = "waived_at")
    private LocalDateTime waivedAt;

    @Column(name = "waived_reason", length = 500)
    private String waivedReason;

    public enum FineReason {
        OVERDUE, LOST_BOOK, DAMAGED_BOOK, OTHER
    }

    public enum FineStatus {
        PENDING, PAID, WAIVED, CANCELLED
    }

    public enum PaymentMethod {
        CASH, STRIPE, WAIVED
    }
}
