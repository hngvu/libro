package soqe.libro.server.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "loans", indexes = {
    @Index(name = "idx_loans_user_status", columnList = "user_id, status"),
    @Index(name = "idx_loans_status_due_date", columnList = "status, due_date"),
    @Index(name = "idx_loans_book_copy_id", columnList = "book_copy_id"),
    @Index(name = "idx_loans_borrow_date", columnList = "borrow_date"),
    @Index(name = "idx_loans_return_date", columnList = "return_date")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Loan extends BaseEntity {

    @Column(name = "loan_code", unique = true, nullable = false, updatable = false, length = 32)
    private String loanCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "book_copy_id", nullable = false)
    private BookCopy bookCopy;

    @Column(name = "borrow_date", nullable = false)
    private LocalDate borrowDate;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Column(name = "return_date")
    private LocalDate returnDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private LoanStatus status;

    @Column(name = "renewal_count", nullable = false)
    @Builder.Default
    private Integer renewalCount = 0;

    public enum LoanStatus {
        ONGOING, RETURNED, OVERDUE, CANCELLED
    }
}
