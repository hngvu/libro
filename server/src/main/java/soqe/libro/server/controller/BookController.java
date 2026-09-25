package soqe.libro.server.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import soqe.libro.server.dto.BookPublicResponse;
import soqe.libro.server.entity.Book;
import soqe.libro.server.service.BookService;
import soqe.libro.server.service.TrendingService;

import java.util.List;

@RestController
@RequestMapping("/books")
@RequiredArgsConstructor
public class BookController {

    private final BookService bookService;
    private final TrendingService trendingService;

    @GetMapping("/trending")
    public ResponseEntity<List<BookPublicResponse>> getTrending(
            @RequestParam(defaultValue = "6") int limit) {
        return ResponseEntity.ok(trendingService.getTrending(limit));
    }

    @GetMapping
    public ResponseEntity<Page<BookPublicResponse>> searchBooks(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) java.util.List<Book.Format> format,
            @RequestParam(required = false, name = "genre") java.util.List<String> genreHandle,
            @RequestParam(required = false, name = "author") java.util.List<String> authorHandle,
            Pageable pageable) {
        return ResponseEntity.ok(bookService.searchBooksMulti(keyword, format, genreHandle, authorHandle, pageable));
    }

    @GetMapping("/{handle}")
    public ResponseEntity<BookPublicResponse> getBookByHandle(@PathVariable String handle) {
        return ResponseEntity.ok(bookService.getBookByHandle(handle));
    }
}
