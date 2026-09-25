package soqe.libro.server.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "collection_books", uniqueConstraints = {
        @UniqueConstraint(name = "uk_collection_book", columnNames = {"collection_id", "book_id"})
}, indexes = {
        @Index(name = "idx_cb_collection_id", columnList = "collection_id"),
        @Index(name = "idx_cb_book_id", columnList = "book_id"),
        @Index(name = "idx_cb_added_at", columnList = "added_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CollectionBook extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "collection_id", nullable = false)
    private Collection collection;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "book_id", nullable = false)
    private Book book;

    @Column(name = "added_at", nullable = false)
    @Builder.Default
    private LocalDateTime addedAt = LocalDateTime.now();

    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private int sortOrder = 0;
}
