package soqe.libro.server.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import soqe.libro.server.dto.BookCreateRequest;
import soqe.libro.server.dto.BookResponse;
import soqe.libro.server.dto.BookUpdateRequest;
import soqe.libro.server.entity.Book;
import soqe.libro.server.repository.BookRepository;
import soqe.libro.server.specification.BookSpecification;
import soqe.libro.server.exception.BusinessValidationException;
import soqe.libro.server.exception.ResourceNotFoundException;
import org.springframework.util.StringUtils;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class BookService {
    private final BookRepository repository;

    // ==========================================
    // BACKOFFICE / ADMIN APIs
    // ==========================================

    @Transactional(readOnly = true)
    public Page<BookResponse> searchBooksForAdmin(String keyword, Book.Format format, Book.Status status, String genreHandle, Pageable pageable) {
        return repository.findAll(BookSpecification.filter(keyword, format, status, genreHandle), pageable)
                .map(book -> BookResponse.builder()
                        .id(book.getId())
                        .title(book.getTitle())
                        .handle(book.getHandle())
                        .slug(book.getSlug())
                        .isbn(book.getIsbn())
                        .publicationYear(book.getPublicationYear())
                        .cover(book.getCover())
                        .edition(book.getEdition())
                        .format(book.getFormat() != null ? book.getFormat().name() : null)
                        .description(book.getDescription())
                        .totalCopies(book.getTotalCopies())
                        .availableCopies(book.getAvailableCopies())
                        .status(book.getStatus() != null ? book.getStatus().name() : null)
                        .build());
    }

    @Transactional(readOnly = true)
    public BookResponse getBookForAdmin(Long id) {
        Book book = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found with id: " + id));
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
                .description(book.getDescription())
                .totalCopies(book.getTotalCopies())
                .availableCopies(book.getAvailableCopies())
                .status(book.getStatus() != null ? book.getStatus().name() : null)
                .build();
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
                .work(request.work())
                .description(request.description())
                .status(Book.Status.ACTIVE)
                .totalCopies(0)
                .availableCopies(0)
                .build();

        book = repository.save(book);
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
                .description(book.getDescription())
                .totalCopies(book.getTotalCopies())
                .availableCopies(book.getAvailableCopies())
                .status(book.getStatus() != null ? book.getStatus().name() : null)
                .build();
    }

    @Transactional
    public BookResponse updateBookByAdmin(Long id, BookUpdateRequest request) {
        Book book = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found with id: " + id));

        validateUniqueConstraints(null, request.isbn(), id);

        book.setTitle(request.title());
        book.setSlug(request.slug());
        book.setIsbn(request.isbn());
        book.setPublicationYear(request.publicationYear());
        book.setCover(request.cover());
        book.setEdition(request.edition());
        book.setFormat(request.format());
        book.setWork(request.work());
        book.setDescription(request.description());
        
        if (request.status() != null) book.setStatus(request.status());

        book = repository.save(book);
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
                .description(book.getDescription())
                .totalCopies(book.getTotalCopies())
                .availableCopies(book.getAvailableCopies())
                .status(book.getStatus() != null ? book.getStatus().name() : null)
                .build();
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
    public Page<soqe.libro.server.dto.BookPublicResponse> searchBooks(String keyword, Book.Format format, String genreHandle, Pageable pageable) {
        // Users can only search for ACTIVE books
        return repository.findAll(BookSpecification.filter(keyword, format, Book.Status.ACTIVE, genreHandle), pageable)
                .map(book -> soqe.libro.server.dto.BookPublicResponse.builder()
                        .title(book.getTitle())
                        .handle(book.getHandle())
                        .slug(book.getSlug())
                        .isbn(book.getIsbn())
                        .publicationYear(book.getPublicationYear())
                        .cover(book.getCover())
                        .edition(book.getEdition())
                        .format(book.getFormat() != null ? book.getFormat().name() : null)
                        .description(book.getDescription())
                        .totalCopies(book.getTotalCopies())
                        .availableCopies(book.getAvailableCopies())
                        .build());
    }

    @Transactional(readOnly = true)
    public soqe.libro.server.dto.BookPublicResponse getBookByHandle(String handle) {
        Book book = repository.findByHandle(handle)
                .filter(b -> b.getStatus() == Book.Status.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found or is not active with handle: " + handle));
        return soqe.libro.server.dto.BookPublicResponse.builder()
                .title(book.getTitle())
                .handle(book.getHandle())
                .slug(book.getSlug())
                .isbn(book.getIsbn())
                .publicationYear(book.getPublicationYear())
                .cover(book.getCover())
                .edition(book.getEdition())
                .format(book.getFormat() != null ? book.getFormat().name() : null)
                .description(book.getDescription())
                .totalCopies(book.getTotalCopies())
                .availableCopies(book.getAvailableCopies())
                .build();
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
}
