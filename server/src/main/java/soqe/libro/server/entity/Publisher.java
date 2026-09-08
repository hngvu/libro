package soqe.libro.server.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.List;

@Entity
@Table(name = "publishers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Publisher extends BaseEntity {

    @Column(nullable = false)
    private String name;

    @Column(unique = true, nullable = false, updatable = false)
    private String handle;

    private String address;
    private String website;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Status status = Status.ACTIVE;

    @OneToMany(mappedBy = "publisher", cascade = CascadeType.ALL)
    private List<Book> books;
    
    public enum Status {
        ACTIVE, INACTIVE
    }
}
