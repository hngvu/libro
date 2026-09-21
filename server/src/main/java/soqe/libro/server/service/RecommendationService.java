package soqe.libro.server.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import soqe.libro.server.dto.BookPublicResponse;
import soqe.libro.server.entity.*;
import soqe.libro.server.repository.BookRepository;
import soqe.libro.server.repository.BookmarkRepository;
import soqe.libro.server.repository.LoanRepository;
import soqe.libro.server.repository.UserRepository;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RecommendationService {

    private final BookRepository bookRepository;
    private final UserRepository userRepository;
    private final LoanRepository loanRepository;
    private final BookmarkRepository bookmarkRepository;
    private final BookService bookService;

    @Transactional(readOnly = true)
    public List<BookPublicResponse> getPersonalizedRecommendations(String email, int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 20));

        if (email == null) {
            return getTrendingBooks(safeLimit);
        }

        var userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return getTrendingBooks(safeLimit);
        }
        User user = userOpt.get();

        // 1. Gather User Interest IDs (Genres & Authors from Loans & Bookmarks)
        Set<Long> interestedGenreIds = new HashSet<>();
        Set<Long> interestedAuthorIds = new HashSet<>();
        Set<Long> interactedBookIds = new HashSet<>();

        // From bookmarks
        var bookmarks = bookmarkRepository.findByUserOrderByCreatedAtDesc(user);
        for (BookBookmark bm : bookmarks) {
            if (bm.getBook() != null) {
                interactedBookIds.add(bm.getBook().getId());
                if (bm.getBook().getGenres() != null) {
                    bm.getBook().getGenres().forEach(g -> interestedGenreIds.add(g.getId()));
                }
                if (bm.getBook().getAuthors() != null) {
                    bm.getBook().getAuthors().forEach(a -> interestedAuthorIds.add(a.getId()));
                }
            }
        }

        // From loans
        var loans = loanRepository.findByUser(user, PageRequest.of(0, 50));
        for (Loan l : loans.getContent()) {
            if (l.getBookCopy() != null && l.getBookCopy().getBook() != null) {
                Book b = l.getBookCopy().getBook();
                interactedBookIds.add(b.getId());
                if (b.getGenres() != null) {
                    b.getGenres().forEach(g -> interestedGenreIds.add(g.getId()));
                }
                if (b.getAuthors() != null) {
                    b.getAuthors().forEach(a -> interestedAuthorIds.add(a.getId()));
                }
            }
        }

        // 2. If user has no history, fallback to trending / all active books
        if (interestedGenreIds.isEmpty() && interestedAuthorIds.isEmpty()) {
            return getTrendingBooks(safeLimit);
        }

        // 3. Find matching books the user hasn't interacted with
        List<Book> candidates = bookRepository.findByStatus(Book.Status.ACTIVE, PageRequest.of(0, 100)).getContent();

        List<Book> recommended = candidates.stream()
                .filter(b -> !interactedBookIds.contains(b.getId()))
                .sorted((b1, b2) -> {
                    int score1 = calculateRelevanceScore(b1, interestedGenreIds, interestedAuthorIds);
                    int score2 = calculateRelevanceScore(b2, interestedGenreIds, interestedAuthorIds);
                    return Integer.compare(score2, score1);
                })
                .limit(safeLimit)
                .toList();

        if (recommended.isEmpty()) {
            return getTrendingBooks(safeLimit);
        }

        return recommended.stream()
                .map(bookService::mapToPublicResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<BookPublicResponse> getSimilarBooks(Long bookId, int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 10));

        var bookOpt = bookRepository.findById(bookId);
        if (bookOpt.isEmpty()) {
            return Collections.emptyList();
        }
        Book currentBook = bookOpt.get();

        Set<Long> genreIds = currentBook.getGenres() != null
                ? currentBook.getGenres().stream().map(Genre::getId).collect(Collectors.toSet())
                : Collections.emptySet();
        Set<Long> authorIds = currentBook.getAuthors() != null
                ? currentBook.getAuthors().stream().map(Author::getId).collect(Collectors.toSet())
                : Collections.emptySet();

        List<Book> allActive = bookRepository.findByStatus(Book.Status.ACTIVE, PageRequest.of(0, 50)).getContent();

        return allActive.stream()
                .filter(b -> !b.getId().equals(bookId))
                .sorted((b1, b2) -> {
                    int s1 = calculateRelevanceScore(b1, genreIds, authorIds);
                    int s2 = calculateRelevanceScore(b2, genreIds, authorIds);
                    return Integer.compare(s2, s1);
                })
                .limit(safeLimit)
                .map(bookService::mapToPublicResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<BookPublicResponse> getTrendingBooks(int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 20));

        // Get top borrowed book IDs
        List<Object[]> topBookIdCounts = loanRepository.findTopBorrowedBookIds(PageRequest.of(0, safeLimit));
        List<Long> topIds = topBookIdCounts.stream()
                .map(row -> (Long) row[0])
                .filter(Objects::nonNull)
                .toList();

        List<Book> result = new ArrayList<>();
        if (!topIds.isEmpty()) {
            result.addAll(bookRepository.findAllById(topIds));
        }

        // Fill remaining slots with newest active books
        if (result.size() < safeLimit) {
            Set<Long> existingIds = result.stream().map(Book::getId).collect(Collectors.toSet());
            List<Book> filler = bookRepository.findByStatus(Book.Status.ACTIVE, PageRequest.of(0, safeLimit * 2)).getContent();
            for (Book b : filler) {
                if (result.size() >= safeLimit) break;
                if (!existingIds.contains(b.getId())) {
                    result.add(b);
                    existingIds.add(b.getId());
                }
            }
        }

        return result.stream()
                .map(bookService::mapToPublicResponse)
                .toList();
    }

    private int calculateRelevanceScore(Book book, Set<Long> genreIds, Set<Long> authorIds) {
        int score = 0;
        if (book.getAuthors() != null) {
            for (Author a : book.getAuthors()) {
                if (authorIds.contains(a.getId())) score += 3; // higher weight for author
            }
        }
        if (book.getGenres() != null) {
            for (Genre g : book.getGenres()) {
                if (genreIds.contains(g.getId())) score += 1;
            }
        }
        return score;
    }
}
