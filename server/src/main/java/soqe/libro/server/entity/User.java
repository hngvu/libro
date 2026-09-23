package soqe.libro.server.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_users_role_status", columnList = "role, status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User extends BaseEntity {
    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String fullName;

    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status;

    @OneToMany(mappedBy = "user")
    private List<Loan> loans;
    
    public enum Role {
        MEMBER, LIBRARIAN, ADMIN
    }

    public enum Status {
        ACTIVE, INACTIVE, BANNED
    }
}
