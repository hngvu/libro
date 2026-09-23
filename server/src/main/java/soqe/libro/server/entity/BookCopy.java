package soqe.libro.server.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.List;

@Entity
@Table(name = "book_copies", indexes = {
    @Index(name = "idx_book_copies_book_status", columnList = "book_id, status"),
    @Index(name = "idx_book_copies_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookCopy extends BaseEntity {
    @Column(nullable = false, unique = true)
    private String barcode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status;

    @Column(length = 100)
    private String location;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "book_id", nullable = false)
    private Book book;

    @OneToMany(mappedBy = "bookCopy")
    private List<Loan> loans;

    public enum Status {
        AVAILABLE, LOANED, RESERVED, LOST, DAMAGED, ARCHIVED
    }
}
