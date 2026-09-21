package soqe.libro.server.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "book_bookmarks", uniqueConstraints = {
        @UniqueConstraint(name = "uk_user_book_bookmark", columnNames = {"user_id", "book_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookBookmark extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "book_id", nullable = false)
    private Book book;
}
