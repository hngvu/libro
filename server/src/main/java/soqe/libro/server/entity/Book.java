package soqe.libro.server.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "books")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Book {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(unique = true, nullable = false, updatable = false, columnDefinition = "CHAR(8)")
    private String handle;

    @Column(nullable = false)
    private String slug;

    @Column(unique = true)
    private String isbn;

    @Column(name = "publication_year")
    private Integer publicationYear;

    private String cover;

    private String edition;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private Format format;

    @Column(columnDefinition = "CHAR(8)")
    private String work; // first book edition handle for grouping

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "total_copies", nullable = false)
    @Builder.Default
    private Integer totalCopies = 0;

    @Column(name = "available_copies", nullable = false)
    @Builder.Default
    private Integer availableCopies = 0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "publisher_id")
    private Publisher publisher;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "book_authors",
        joinColumns = @JoinColumn(name = "book_id"),
        inverseJoinColumns = @JoinColumn(name = "author_id")
    )
    private Set<Author> authors;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "book_genres",
        joinColumns = @JoinColumn(name = "book_id"),
        inverseJoinColumns = @JoinColumn(name = "genre_id")
    )
    private Set<Genre> genres;

    @OneToMany(mappedBy = "book", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<BookCopy> copies;

    public enum Format {
        HARDCOVER,
        PAPERBACK,
        MASS_MARKET_PAPERBACK,
        EBOOK,
        AUDIOBOOK,
        OTHER
    }
}
