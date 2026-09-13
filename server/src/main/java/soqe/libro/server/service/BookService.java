package soqe.libro.server.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import soqe.libro.server.dto.*;
import soqe.libro.server.entity.Author;
import soqe.libro.server.entity.Book;
import soqe.libro.server.entity.Genre;
import soqe.libro.server.entity.Publisher;
import soqe.libro.server.repository.AuthorRepository;
import soqe.libro.server.repository.BookRepository;
import soqe.libro.server.repository.GenreRepository;
import soqe.libro.server.repository.PublisherRepository;
import soqe.libro.server.specification.BookSpecification;
import soqe.libro.server.exception.BusinessValidationException;
import soqe.libro.server.exception.ResourceNotFoundException;
import org.springframework.util.StringUtils;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookService {
    private final BookRepository repository;
    private final AuthorRepository authorRepository;
    private final PublisherRepository publisherRepository;
    private final GenreRepository genreRepository;

    // ==========================================
    // BACKOFFICE / ADMIN APIs
    // ==========================================

    @Transactional(readOnly = true)
    public Page<BookResponse> searchBooksForAdmin(String keyword, Book.Format format, Book.Status status, String genreHandle, Long authorId, Long genreId, Pageable pageable) {
        return searchBooksForAdminMulti(
                keyword,
                format != null ? java.util.List.of(format) : null,
                status != null ? java.util.List.of(status) : null,
                org.springframework.util.StringUtils.hasText(genreHandle) ? java.util.List.of(genreHandle) : null,
                authorId != null ? java.util.List.of(authorId) : null,
                genreId != null ? java.util.List.of(genreId) : null,
                pageable
        );
    }

    @Transactional(readOnly = true)
    public Page<BookResponse> searchBooksForAdminMulti(String keyword, java.util.List<Book.Format> formats, java.util.List<Book.Status> statuses, java.util.List<String> genreHandles, java.util.List<Long> authorIds, java.util.List<Long> genreIds, Pageable pageable) {
        return repository.findAll(BookSpecification.filterMulti(keyword, formats, statuses, genreHandles, authorIds, genreIds, null), pageable)
                .map(this::mapToAdminResponse);
    }

    @Transactional(readOnly = true)
    public BookResponse getBookForAdmin(Long id) {
        Book book = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found with id: " + id));
        return mapToAdminResponse(book);
    }

    @Transactional
    public BookResponse createBookByAdmin(BookCreateRequest request) {
        validateUniqueConstraints(request.handle(), request.isbn(), null);

        Book book = Book.builder()
                .title(request.title())
                .handle(request.handle())
                .slug(request.slug())
                .isbn(request.isbn())
                .publicationYear(request.publicationYear())
                .cover(request.cover())
                .edition(request.edition())
                .format(request.format())
                .pageCount(request.pageCount())
                .language(request.language())
                .work(request.work())
                .description(request.description())
                .status(Book.Status.ACTIVE)
                .totalCopies(0)
                .availableCopies(0)
                .build();

        if (request.publisherId() != null) {
            publisherRepository.findById(request.publisherId()).ifPresent(book::setPublisher);
        }
        if (request.authorIds() != null && !request.authorIds().isEmpty()) {
            book.setAuthors(new HashSet<>(authorRepository.findAllById(request.authorIds())));
        }
        if (request.genreIds() != null && !request.genreIds().isEmpty()) {
            book.setGenres(new HashSet<>(genreRepository.findAllById(request.genreIds())));
        }

        book = repository.save(book);
        return mapToAdminResponse(book);
    }

    @Transactional
    public BookResponse updateBookByAdmin(Long id, BookUpdateRequest request) {
        Book book = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found with id: " + id));

        book.setTitle(request.title());
        if (StringUtils.hasText(request.slug())) {
            book.setSlug(request.slug().trim());
        } else if (!StringUtils.hasText(book.getSlug())) {
            book.setSlug(toSlug(request.title()));
        }

        if (StringUtils.hasText(request.isbn())) {
            validateUniqueConstraints(null, request.isbn().trim(), id);
            book.setIsbn(request.isbn().trim());
        } else {
            book.setIsbn(null);
        }

        book.setPublicationYear(request.publicationYear());
        book.setCover(request.cover());
        book.setEdition(request.edition());
        if (request.format() != null) book.setFormat(request.format());
        book.setPageCount(request.pageCount());
        book.setLanguage(request.language());
        if (request.work() != null) book.setWork(request.work());
        book.setDescription(request.description());
        
        if (request.status() != null) book.setStatus(request.status());

        if (request.publisherId() != null) {
            book.setPublisher(publisherRepository.findById(request.publisherId()).orElse(null));
        } else {
            book.setPublisher(null);
        }

        if (request.authorIds() != null) {
            book.setAuthors(new HashSet<>(authorRepository.findAllById(request.authorIds())));
        }

        if (request.genreIds() != null) {
            book.setGenres(new HashSet<>(genreRepository.findAllById(request.genreIds())));
        }

        book = repository.save(book);
        return mapToAdminResponse(book);
    }

    @Transactional
    public void deleteBookByAdmin(Long id) {
        Book book = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found with id: " + id));
        book.setStatus(Book.Status.ARCHIVED);
        repository.save(book);
    }

    // ==========================================
    // PUBLIC / END-USER APIs
    // ==========================================

    @Transactional(readOnly = true)
    public Page<BookPublicResponse> searchBooks(String keyword, Book.Format format, String genreHandle, String authorHandle, Pageable pageable) {
        return searchBooksMulti(
                keyword,
                format != null ? java.util.List.of(format) : null,
                org.springframework.util.StringUtils.hasText(genreHandle) ? java.util.List.of(genreHandle) : null,
                org.springframework.util.StringUtils.hasText(authorHandle) ? java.util.List.of(authorHandle) : null,
                pageable
        );
    }

    @Transactional(readOnly = true)
    public Page<BookPublicResponse> searchBooksMulti(String keyword, java.util.List<Book.Format> formats, java.util.List<String> genreHandles, java.util.List<String> authorHandles, Pageable pageable) {
        // Users can only search for ACTIVE books
        return repository.findAll(BookSpecification.filterMulti(keyword, formats, java.util.List.of(Book.Status.ACTIVE), genreHandles, null, null, authorHandles), pageable)
                .map(this::mapToPublicResponse);
    }

    @Transactional(readOnly = true)
    public BookPublicResponse getBookByHandle(String handle) {
        Book book = repository.findByHandle(handle)
                .filter(b -> b.getStatus() == Book.Status.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found or is not active with handle: " + handle));
        return mapToPublicResponse(book);
    }

    // ==========================================
    // HELPER METHODS
    // ==========================================

    public void validateUniqueConstraints(String handle, String isbn, Long excludeId) {
        Map<String, String> errors = new HashMap<>();

        if (StringUtils.hasText(handle)) {
            repository.findByHandle(handle).ifPresent(book -> {
                if (excludeId == null || !book.getId().equals(excludeId)) {
                    errors.put("handle", "Handle is already taken");
                }
            });
        }

        if (StringUtils.hasText(isbn)) {
            repository.findByIsbn(isbn).ifPresent(book -> {
                if (excludeId == null || !book.getId().equals(excludeId)) {
                    errors.put("isbn", "ISBN is already taken");
                }
            });
        }

        if (!errors.isEmpty()) {
            throw new BusinessValidationException("Validation failed", errors);
        }
    }

    private BookPublicResponse mapToPublicResponse(Book book) {
        return BookPublicResponse.builder()
                .id(book.getId())
                .title(book.getTitle())
                .handle(book.getHandle())
                .slug(book.getSlug())
                .isbn(book.getIsbn())
                .publicationYear(book.getPublicationYear())
                .cover(book.getCover())
                .edition(book.getEdition())
                .format(book.getFormat() != null ? book.getFormat().name() : null)
                .pageCount(book.getPageCount())
                .language(book.getLanguage())
                .description(book.getDescription())
                .totalCopies(book.getTotalCopies())
                .availableCopies(book.getAvailableCopies())
                .authors(mapAuthorsToPublic(book.getAuthors()))
                .genres(mapGenresToPublic(book.getGenres()))
                .publisher(mapPublisherToPublic(book.getPublisher()))
                .build();
    }

    private BookResponse mapToAdminResponse(Book book) {
        return BookResponse.builder()
                .id(book.getId())
                .title(book.getTitle())
                .handle(book.getHandle())
                .slug(book.getSlug())
                .isbn(book.getIsbn())
                .publicationYear(book.getPublicationYear())
                .cover(book.getCover())
                .edition(book.getEdition())
                .format(book.getFormat() != null ? book.getFormat().name() : null)
                .pageCount(book.getPageCount())
                .language(book.getLanguage())
                .description(book.getDescription())
                .totalCopies(book.getTotalCopies())
                .availableCopies(book.getAvailableCopies())
                .status(book.getStatus() != null ? book.getStatus().name() : null)
                .authors(mapAuthorsToAdmin(book.getAuthors()))
                .genres(mapGenresToAdmin(book.getGenres()))
                .publisher(mapPublisherToAdmin(book.getPublisher()))
                .build();
    }

    private Set<AuthorPublicResponse> mapAuthorsToPublic(Set<Author> authors) {
        if (authors == null) return Set.of();
        return authors.stream()
                .map(a -> AuthorPublicResponse.builder()
                        .name(a.getName())
                        .handle(a.getHandle())
                        .biography(a.getBiography())
                        .build())
                .collect(Collectors.toSet());
    }

    private Set<GenrePublicResponse> mapGenresToPublic(Set<Genre> genres) {
        if (genres == null) return Set.of();
        return genres.stream()
                .map(g -> GenrePublicResponse.builder()
                        .name(g.getName())
                        .handle(g.getHandle())
                        .description(g.getDescription())
                        .build())
                .collect(Collectors.toSet());
    }

    private PublisherPublicResponse mapPublisherToPublic(Publisher publisher) {
        if (publisher == null) return null;
        return PublisherPublicResponse.builder()
                .name(publisher.getName())
                .handle(publisher.getHandle())
                .address(publisher.getAddress())
                .website(publisher.getWebsite())
                .build();
    }

    private Set<AuthorResponse> mapAuthorsToAdmin(Set<Author> authors) {
        if (authors == null) return Set.of();
        return authors.stream()
                .map(a -> AuthorResponse.builder()
                        .id(a.getId())
                        .name(a.getName())
                        .handle(a.getHandle())
                        .biography(a.getBiography())
                        .status(a.getStatus() != null ? a.getStatus().name() : null)
                        .build())
                .collect(Collectors.toSet());
    }

    private Set<GenreResponse> mapGenresToAdmin(Set<Genre> genres) {
        if (genres == null) return Set.of();
        return genres.stream()
                .map(g -> GenreResponse.builder()
                        .id(g.getId())
                        .name(g.getName())
                        .handle(g.getHandle())
                        .description(g.getDescription())
                        .status(g.getStatus() != null ? g.getStatus().name() : null)
                        .build())
                .collect(Collectors.toSet());
    }

    private PublisherResponse mapPublisherToAdmin(Publisher publisher) {
        if (publisher == null) return null;
        return PublisherResponse.builder()
                .id(publisher.getId())
                .name(publisher.getName())
                .handle(publisher.getHandle())
                .address(publisher.getAddress())
                .website(publisher.getWebsite())
                .status(publisher.getStatus() != null ? publisher.getStatus().name() : null)
                .build();
    }

    private String toSlug(String input) {
        if (!StringUtils.hasText(input)) return "book";
        return java.text.Normalizer.normalize(input, java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "")
                .toLowerCase()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-+|-+$", "");
    }
}

