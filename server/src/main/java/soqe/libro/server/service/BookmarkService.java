package soqe.libro.server.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import soqe.libro.server.dto.BookmarkResponse;
import soqe.libro.server.entity.*;
import soqe.libro.server.exception.ResourceNotFoundException;
import soqe.libro.server.repository.CollectionBookRepository;
import soqe.libro.server.repository.UserRepository;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class BookmarkService {

    private final CollectionService collectionService;
    private final CollectionBookRepository collectionBookRepository;
    private final UserRepository userRepository;

    @Transactional
    public List<BookmarkResponse> getMyBookmarks(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Collection defaultColl = collectionService.getOrCreateDefaultCollection(user);

        return collectionBookRepository.findByCollectionOrderByAddedAtDesc(defaultColl)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public Map<String, Object> toggleBookmark(String email, Long bookId) {
        return collectionService.toggleBookInDefaultCollection(email, bookId);
    }

    @Transactional
    public void removeBookmark(String email, Long bookId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Collection defaultColl = collectionService.getOrCreateDefaultCollection(user);
        collectionService.removeBookFromCollection(email, defaultColl.getId(), bookId);
    }

    @Transactional(readOnly = true)
    public boolean isBookmarked(String email, Long bookId) {
        return collectionService.isBookInDefaultCollection(email, bookId);
    }

    @Transactional(readOnly = true)
    public long getBookmarkCount(String email) {
        return collectionService.countBooksInDefaultCollection(email);
    }

    private BookmarkResponse toResponse(CollectionBook cb) {
        Book book = cb.getBook();
        List<String> authors = book.getAuthors() != null
                ? book.getAuthors().stream().map(Author::getName).toList()
                : List.of();
        List<String> genres = book.getGenres() != null
                ? book.getGenres().stream().map(Genre::getName).toList()
                : List.of();

        return BookmarkResponse.builder()
                .id(cb.getId())
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
                .createdAt(cb.getAddedAt())
                .build();
    }
}
