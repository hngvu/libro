package soqe.libro.server.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import soqe.libro.server.dto.BookPublicResponse;
import soqe.libro.server.entity.Book;
import soqe.libro.server.service.BookService;

@RestController
@RequestMapping("/books")
@RequiredArgsConstructor
public class BookController {

    private final BookService bookService;

    @GetMapping
    public ResponseEntity<Page<BookPublicResponse>> searchBooks(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Book.Format format,
            Pageable pageable) {
        return ResponseEntity.ok(bookService.searchBooks(keyword, format, pageable));
    }

    @GetMapping("/{handle}")
    public ResponseEntity<BookPublicResponse> getBookByHandle(@PathVariable String handle) {
        return ResponseEntity.ok(bookService.getBookByHandle(handle));
    }
}
