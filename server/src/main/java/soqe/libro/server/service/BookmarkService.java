package soqe.libro.server.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import soqe.libro.server.dto.BookmarkResponse;
import soqe.libro.server.entity.Author;
import soqe.libro.server.entity.Book;
import soqe.libro.server.entity.BookBookmark;
import soqe.libro.server.entity.Genre;
import soqe.libro.server.entity.User;
import soqe.libro.server.exception.ResourceNotFoundException;
import soqe.libro.server.repository.BookRepository;
import soqe.libro.server.repository.BookmarkRepository;
import soqe.libro.server.repository.UserRepository;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class BookmarkService {

    private final BookmarkRepository bookmarkRepository;
    private final BookRepository bookRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<BookmarkResponse> getMyBookmarks(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return bookmarkRepository.findByUserOrderByCreatedAtDesc(user)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public Map<String, Object> toggleBookmark(String email, Long bookId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found with id: " + bookId));

        var existingOpt = bookmarkRepository.findByUserAndBook(user, book);
        boolean isBookmarked;

        if (existingOpt.isPresent()) {
            bookmarkRepository.delete(existingOpt.get());
            isBookmarked = false;
            log.info("User {} unbookmarked book {}", email, book.getTitle());
        } else {
            BookBookmark bookmark = BookBookmark.builder()
                    .user(user)
                    .book(book)
                    .build();
            bookmarkRepository.save(bookmark);
            isBookmarked = true;
            log.info("User {} bookmarked book {}", email, book.getTitle());
        }

        long count = bookmarkRepository.countByUser(user);
        return Map.of(
                "bookmarked", isBookmarked,
                "count", count,
                "bookId", bookId
        );
    }

    @Transactional
    public void removeBookmark(String email, Long bookId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found with id: " + bookId));

        bookmarkRepository.deleteByUserAndBook(user, book);
    }

    @Transactional(readOnly = true)
    public boolean isBookmarked(String email, Long bookId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found with id: " + bookId));

        return bookmarkRepository.existsByUserAndBook(user, book);
    }

    @Transactional(readOnly = true)
    public long getBookmarkCount(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return bookmarkRepository.countByUser(user);
    }

    private BookmarkResponse toResponse(BookBookmark b) {
        Book book = b.getBook();
        List<String> authors = book.getAuthors() != null
                ? book.getAuthors().stream().map(Author::getName).toList()
                : List.of();
        List<String> genres = book.getGenres() != null
                ? book.getGenres().stream().map(Genre::getName).toList()
                : List.of();

        return BookmarkResponse.builder()
                .id(b.getId())
                .bookId(book.getId())
                .bookTitle(book.getTitle())
                .bookHandle(book.getHandle())
                .bookSlug(book.getSlug())
                .bookCover(book.getCover())
                .isbn(book.getIsbn())
                .publicationYear(book.getPublicationYear())
                .totalCopies(book.getTotalCopies())
                .availableCopies(book.getAvailableCopies())
                .authors(authors)
                .genres(genres)
                .createdAt(b.getCreatedAt())
                .build();
    }
}
