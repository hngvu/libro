package soqe.libro.server.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import soqe.libro.server.entity.*;
import soqe.libro.server.repository.*;

import java.util.List;
import java.util.Set;

@Component
@RequiredArgsConstructor
@Slf4j
public class DatabaseSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final GenreRepository genreRepository;
    private final PublisherRepository publisherRepository;
    private final AuthorRepository authorRepository;
    private final BookRepository bookRepository;
    private final BookCopyRepository bookCopyRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        if (userRepository.count() > 0) {
            log.info("Database already seeded. Skipping initial data population.");
            return;
        }

        log.info("Seeding initial database data...");

        // 1. Users
        User admin = User.builder()

                .email("admin@libro.com")
                .password(passwordEncoder.encode("admin123"))
                .fullName("System Administrator")
                .phone("0901234567")
                .role(User.Role.ADMIN)
                .status(User.Status.ACTIVE)
                .build();

        User librarian = User.builder()

                .email("lucia@libro.com")
                .password(passwordEncoder.encode("lucia123"))
                .fullName("Lucia Lilia")
                .phone("0902345678")
                .role(User.Role.LIBRARIAN)
                .status(User.Status.ACTIVE)
                .build();

        User member = User.builder()

                .email("bin@libro.com")
                .password(passwordEncoder.encode("chubin123"))
                .fullName("Bin Chu")
                .phone("0903456789")
                .role(User.Role.MEMBER)
                .status(User.Status.ACTIVE)
                .build();

        userRepository.saveAll(List.of(admin, librarian, member));

        // 2. Genres
        Genre techGenre = Genre.builder()
                .name("Information Technology")
                .handle("information-technology")
                .description("Books specialized in programming, technology, and computer science")
                .status(Genre.Status.ACTIVE)
                .build();

        Genre sciFiGenre = Genre.builder()
                .name("Science Fiction")
                .handle("science-fiction")
                .description("Speculative fiction dealing with imaginative and futuristic concepts")
                .status(Genre.Status.ACTIVE)
                .build();

        Genre classicGenre = Genre.builder()
                .name("Classic Literature")
                .handle("classic-literature")
                .description("World-renowned literary masterpieces")
                .status(Genre.Status.ACTIVE)
                .build();

        genreRepository.saveAll(List.of(techGenre, sciFiGenre, classicGenre));

        // 3. Publishers
        Publisher oreilly = Publisher.builder()
                .name("O'Reilly Media")
                .handle("oreilly-media")
                .address("Sebastopol, CA, United States")
                .website("https://www.oreilly.com")
                .status(Publisher.Status.ACTIVE)
                .build();

        Publisher penguin = Publisher.builder()
                .name("Penguin Random House")
                .handle("penguin-random-house")
                .address("1745 Broadway, New York, NY")
                .website("https://www.penguinrandomhouse.com")
                .status(Publisher.Status.ACTIVE)
                .build();

        publisherRepository.saveAll(List.of(oreilly, penguin));

        // 4. Authors
        Author uncleBob = Author.builder()
                .name("Robert C. Martin")
                .handle("robert-c-martin")
                .biography("Uncle Bob is a legendary software craftsman and author of Clean Code and Clean Architecture.")
                .status(Author.Status.ACTIVE)
                .build();

        Author rowling = Author.builder()
                .name("J.K. Rowling")
                .handle("j-k-rowling")
                .biography("British author best known for the Harry Potter fantasy series.")
                .status(Author.Status.ACTIVE)
                .build();

        authorRepository.saveAll(List.of(uncleBob, rowling));

        // 5. Books
        Book cleanCode = Book.builder()
                .title("Clean Code: A Handbook of Agile Software Craftsmanship")
                .handle("BK000001")
                .slug("clean-code-a-handbook-of-agile-software-craftsmanship")
                .isbn("9780132350884")
                .publicationYear(2008)
                .edition("1st Edition")
                .format(Book.Format.PAPERBACK)
                .description("Even bad code can function. But if code isn't clean, it can bring a development organization to its knees.")
                .cover("https://images-na.ssl-images-amazon.com/images/I/41xShlnTZTL._SX376_BO1,204,203,200_.jpg")
                .totalCopies(3)
                .availableCopies(3)
                .publisher(oreilly)
                .authors(Set.of(uncleBob))
                .genres(Set.of(techGenre))
                .status(Book.Status.ACTIVE)
                .build();

        Book harryPotter = Book.builder()
                .title("Harry Potter and the Philosopher's Stone")
                .handle("BK000002")
                .slug("harry-potter-and-the-philosopher-stone")
                .isbn("9780590353427")
                .publicationYear(1997)
                .edition("First US Edition")
                .format(Book.Format.HARDCOVER)
                .description("The first novel in the Harry Potter series and Rowling's debut novel.")
                .cover("https://images-na.ssl-images-amazon.com/images/I/51UoqRAxwEL._SX331_BO1,204,203,200_.jpg")
                .totalCopies(2)
                .availableCopies(2)
                .publisher(penguin)
                .authors(Set.of(rowling))
                .genres(Set.of(sciFiGenre, classicGenre))
                .status(Book.Status.ACTIVE)
                .build();

        bookRepository.saveAll(List.of(cleanCode, harryPotter));

        // 6. Book Copies
        BookCopy cc1 = BookCopy.builder().barcode("BC-CC-001").status(BookCopy.Status.AVAILABLE).book(cleanCode).build();
        BookCopy cc2 = BookCopy.builder().barcode("BC-CC-002").status(BookCopy.Status.AVAILABLE).book(cleanCode).build();
        BookCopy cc3 = BookCopy.builder().barcode("BC-CC-003").status(BookCopy.Status.AVAILABLE).book(cleanCode).build();

        BookCopy hp1 = BookCopy.builder().barcode("BC-HP-001").status(BookCopy.Status.AVAILABLE).book(harryPotter).build();
        BookCopy hp2 = BookCopy.builder().barcode("BC-HP-002").status(BookCopy.Status.AVAILABLE).book(harryPotter).build();

        bookCopyRepository.saveAll(List.of(cc1, cc2, cc3, hp1, hp2));

        log.info("Database seeding completed successfully!");
    }
}
