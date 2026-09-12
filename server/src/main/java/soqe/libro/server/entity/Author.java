package soqe.libro.server.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.Set;

@Entity
@Table(name = "authors")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Author extends BaseEntity {

    @Column(nullable = false)
    private String name;

    @Column(unique = true, nullable = false, updatable = false)
    private String handle;

    @Column(columnDefinition = "TEXT")
    private String biography;

    private String image;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Status status = Status.ACTIVE;

    @ManyToMany(mappedBy = "authors")
    private Set<Book> books;

    public enum Status {
        ACTIVE, INACTIVE
    }
}
