package soqe.libro.server.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import soqe.libro.server.dto.BookPublicResponse;
import soqe.libro.server.dto.TopBorrowedBookResponse;
import soqe.libro.server.entity.Book;
import soqe.libro.server.repository.BookRepository;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class TrendingService {

    private final AnalyticsService analyticsService;
    private final BookRepository bookRepository;
    private final BookService bookService;
    private static final Random RANDOM = new Random();
    private static final int POOL_SIZE = 24;

    /**
     * Pool 24 sách hot nhất – cached toàn cục trong RAM bằng Caffeine, TTL 6 tiếng.
     * Tất cả user (kể cả anonymous) đều dùng chung cache này.
     */
    @Cacheable(value = "trending_pool", key = "'global'")
    @Transactional(readOnly = true)
    public List<BookPublicResponse> getTrendingPool() {
        log.info("[Trending] Cache miss – querying DB for trending books pool");
        List<TopBorrowedBookResponse> topBooks = analyticsService.getTopBorrowedBooks(POOL_SIZE);

        List<BookPublicResponse> pool = new ArrayList<>();
        Set<Long> existingIds = new HashSet<>();

        for (TopBorrowedBookResponse top : topBooks) {
            BookPublicResponse mapped = bookService.mapToPublicResponseById(top.bookId());
            if (mapped != null) {
                pool.add(mapped);
                existingIds.add(mapped.id());
            }
        }

        // Nếu số lượng sách có lượt mượn chưa đủ 24, bù thêm sách active mới nhất
        if (pool.size() < POOL_SIZE) {
            List<Book> filler = bookRepository.findByStatus(Book.Status.ACTIVE, PageRequest.of(0, POOL_SIZE * 2)).getContent();
            for (Book b : filler) {
                if (pool.size() >= POOL_SIZE) break;
                if (!existingIds.contains(b.getId())) {
                    pool.add(bookService.mapToPublicResponse(b));
                    existingIds.add(b.getId());
                }
            }
        }

        log.info("[Trending] Loaded and cached {} books in trending pool", pool.size());
        return pool;
    }

    /**
     * Public API: lấy `limit` cuốn từ pool đã cache, shuffle nhẹ để tạo freshness mỗi lần xem.
     * Hoạt động thuần túy trong RAM (không chạm DB).
     */
    public List<BookPublicResponse> getTrending(int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 20));
        List<BookPublicResponse> pool = new ArrayList<>(getTrendingPool());
        Collections.shuffle(pool, RANDOM);
        return pool.stream().limit(safeLimit).toList();
    }

    /**
     * Reset cache 00:05 sáng mỗi ngày
     */
    @Scheduled(cron = "0 5 0 * * *")
    @CacheEvict(value = "trending_pool", allEntries = true)
    public void evictTrendingCache() {
        log.info("[Trending] Daily scheduled cache eviction triggered");
    }
}
