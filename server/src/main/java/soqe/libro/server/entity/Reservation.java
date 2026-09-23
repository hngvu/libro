package soqe.libro.server.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "reservations", indexes = {
    @Index(name = "idx_reservations_book_status", columnList = "book_id, status"),
    @Index(name = "idx_reservations_user_status", columnList = "user_id, status"),
    @Index(name = "idx_reservations_status_deadline", columnList = "status, pickup_deadline"),
    @Index(name = "idx_reservations_book_copy_id", columnList = "book_copy_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Reservation extends BaseEntity {

    @Column(name = "reservation_code", unique = true, nullable = false, updatable = false, length = 32)
    private String reservationCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "book_id", nullable = false)
    private Book book;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "book_copy_id")
    private BookCopy bookCopy;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private ReservationStatus status;

    @Column(name = "reserved_at", nullable = false)
    private LocalDateTime reservedAt;

    @Column(name = "pickup_deadline")
    private LocalDate pickupDeadline;

    @Column(name = "fulfilled_at")
    private LocalDateTime fulfilledAt;

    @Column(name = "queue_position")
    private Integer queuePosition;

    @Column(name = "cancellation_reason", length = 500)
    private String cancellationReason;

    public enum ReservationStatus {
        PENDING,
        READY_FOR_PICKUP,
        FULFILLED,
        CANCELLED,
        EXPIRED
    }
}
