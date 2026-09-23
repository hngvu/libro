package soqe.libro.server.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.Set;

@Entity
@Table(name = "genres", indexes = {
    @Index(name = "idx_genres_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Genre extends BaseEntity {
    @Column(nullable = false, unique = true)
    private String name;

    @Column(unique = true, nullable = false, updatable = false)
    private String handle;

    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Status status = Status.ACTIVE;

    @ManyToMany(mappedBy = "genres")
    private Set<Book> books;

    public enum Status {
        ACTIVE, INACTIVE
    }
}
