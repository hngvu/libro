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

    /**
     * Pool multiplier: score top (limit × POOL_MULTIPLIER) candidates,
     * apply jitter, then pick final `limit` books.
     * This creates freshness without losing relevance.
     */
    private static final int POOL_MULTIPLIER = 4;
    private static final Random RANDOM = new Random();

    // ─── Public APIs ──────────────────────────────────────────────────────────

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

        // 1. Gather user interests from bookmarks & loan history
        Set<Long> interestedGenreIds = new HashSet<>();
        Set<Long> interestedAuthorIds = new HashSet<>();
        Set<Long> interactedBookIds = new HashSet<>();

        var bookmarks = bookmarkRepository.findByUserOrderByCreatedAtDesc(user);
        for (BookBookmark bm : bookmarks) {
            if (bm.getBook() != null) {
                interactedBookIds.add(bm.getBook().getId());
                if (bm.getBook().getGenres() != null)
                    bm.getBook().getGenres().forEach(g -> interestedGenreIds.add(g.getId()));
                if (bm.getBook().getAuthors() != null)
                    bm.getBook().getAuthors().forEach(a -> interestedAuthorIds.add(a.getId()));
            }
        }

        var loans = loanRepository.findByUser(user, PageRequest.of(0, 50));
        for (Loan l : loans.getContent()) {
            if (l.getBookCopy() != null && l.getBookCopy().getBook() != null) {
                Book b = l.getBookCopy().getBook();
                interactedBookIds.add(b.getId());
                if (b.getGenres() != null)
                    b.getGenres().forEach(g -> interestedGenreIds.add(g.getId()));
                if (b.getAuthors() != null)
                    b.getAuthors().forEach(a -> interestedAuthorIds.add(a.getId()));
            }
        }

        if (interestedGenreIds.isEmpty() && interestedAuthorIds.isEmpty()) {
            return getTrendingBooks(safeLimit);
        }

        // 2. Fetch candidates, exclude already-interacted
        List<Book> candidates = bookRepository
                .findByStatus(Book.Status.ACTIVE, PageRequest.of(0, 200))
                .getContent();

        int poolSize = safeLimit * POOL_MULTIPLIER;

        // 3. Score & take top pool
        List<Book> pool = candidates.stream()
                .filter(b -> !interactedBookIds.contains(b.getId()))
                .sorted(Comparator.comparingInt(
                        (Book b) -> calculateRelevanceScore(b, interestedGenreIds, interestedAuthorIds)).reversed())
                .limit(poolSize)
                .collect(Collectors.toCollection(ArrayList::new));

        if (pool.isEmpty()) {
            return getTrendingBooks(safeLimit);
        }

        // 4. Apply jitter within pool → fresh results each call
        return pickWithJitter(pool, interestedGenreIds, interestedAuthorIds, safeLimit)
                .stream()
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

        List<Book> candidates = bookRepository
                .findByStatus(Book.Status.ACTIVE, PageRequest.of(0, 80))
                .getContent();

        int poolSize = safeLimit * POOL_MULTIPLIER;

        List<Book> pool = candidates.stream()
                .filter(b -> !b.getId().equals(bookId))
                .sorted(Comparator.comparingInt(
                        (Book b) -> calculateRelevanceScore(b, genreIds, authorIds)).reversed())
                .limit(poolSize)
                .collect(Collectors.toCollection(ArrayList::new));

        if (pool.isEmpty()) {
            return Collections.emptyList();
        }

        return pickWithJitter(pool, genreIds, authorIds, safeLimit)
                .stream()
                .map(bookService::mapToPublicResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<BookPublicResponse> getTrendingBooks(int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 20));
        int poolSize = safeLimit * POOL_MULTIPLIER;

        // Top borrowed books as seed
        List<Object[]> topBookIdCounts = loanRepository.findTopBorrowedBookIds(PageRequest.of(0, poolSize));
        List<Long> topIds = topBookIdCounts.stream()
                .map(row -> (Long) row[0])
                .filter(Objects::nonNull)
                .toList();

        List<Book> pool = new ArrayList<>();
        if (!topIds.isEmpty()) {
            pool.addAll(bookRepository.findAllById(topIds));
        }

        // Fill remaining pool slots with newest active books
        if (pool.size() < poolSize) {
            Set<Long> existingIds = pool.stream().map(Book::getId).collect(Collectors.toSet());
            bookRepository.findByStatus(Book.Status.ACTIVE, PageRequest.of(0, poolSize * 2))
                    .getContent()
                    .stream()
                    .filter(b -> !existingIds.contains(b.getId()))
                    .limit(poolSize - pool.size())
                    .forEach(pool::add);
        }

        // Shuffle the pool slightly so trending order varies each call
        int shuffleBound = Math.min(pool.size(), poolSize);
        List<Book> mutablePool = new ArrayList<>(pool.subList(0, shuffleBound));
        Collections.shuffle(mutablePool, RANDOM);

        return mutablePool.stream()
                .limit(safeLimit)
                .map(bookService::mapToPublicResponse)
                .toList();
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    /**
     * Top-K Pool + Score Jitter:
     * Each book's final score = base_score × random_factor in [0.70, 1.30].
     * Books with score=0 get a small random nudge [0.0, 0.5] so they're
     * shuffled among each other rather than all appearing in insertion order.
     *
     * Effect:
     *  - High-relevance books (score ≥ 3) still dominate — they appear ~85–90%
     *    of the time even with ±30% jitter.
     *  - Mid-relevance books rotate in and out, keeping the list feeling fresh.
     *  - Users are occasionally shown an unexpected discovery from the pool.
     */
    private List<Book> pickWithJitter(List<Book> pool, Set<Long> genreIds, Set<Long> authorIds, int limit) {
        record Scored(Book book, double score) {}

        return pool.stream()
                .map(b -> {
                    double base = calculateRelevanceScore(b, genreIds, authorIds);
                    double jittered = base > 0
                            ? base * (0.70 + RANDOM.nextDouble() * 0.60)  // ±30% jitter
                            : RANDOM.nextDouble() * 0.50;                   // random nudge for score-0
                    return new Scored(b, jittered);
                })
                .sorted(Comparator.comparingDouble(Scored::score).reversed())
                .limit(limit)
                .map(Scored::book)
                .collect(Collectors.toCollection(ArrayList::new));
    }

    private int calculateRelevanceScore(Book book, Set<Long> genreIds, Set<Long> authorIds) {
        int score = 0;
        if (book.getAuthors() != null) {
            for (Author a : book.getAuthors()) {
                if (authorIds.contains(a.getId())) score += 3; // same author → higher weight
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
