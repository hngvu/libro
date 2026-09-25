package soqe.libro.server.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "collections", indexes = {
        @Index(name = "idx_collection_owner", columnList = "owner_id"),
        @Index(name = "idx_collection_type", columnList = "type"),
        @Index(name = "idx_collection_slug", columnList = "slug", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Collection extends BaseEntity {

    @Column(nullable = false, length = 150)
    private String name;

    @Column(unique = true, nullable = false, length = 200)
    private String slug;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "cover_image")
    private String coverImage;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private CollectionType type = CollectionType.PERSONAL;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    private User owner;

    @Column(name = "is_default", nullable = false)
    @Builder.Default
    private boolean isDefault = false;

    @Column(name = "book_count", nullable = false)
    @Builder.Default
    private int bookCount = 0;

    @Column(name = "is_pinned", nullable = false)
    @Builder.Default
    private boolean pinned = false;

    @Column(name = "display_order", nullable = false)
    @Builder.Default
    private int displayOrder = 0;

    public enum CollectionType {
        CURATED,
        PERSONAL
    }
}
