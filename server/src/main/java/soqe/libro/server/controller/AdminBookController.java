package soqe.libro.server.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import soqe.libro.server.dto.BookCreateRequest;
import soqe.libro.server.dto.BookResponse;
import soqe.libro.server.dto.BookUpdateRequest;
import soqe.libro.server.entity.Book;
import soqe.libro.server.service.BookService;

@RestController
@RequestMapping("/admin/books")
@RequiredArgsConstructor
public class AdminBookController {

    private final BookService bookService;

    @GetMapping
    public ResponseEntity<Page<BookResponse>> searchBooks(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) java.util.List<Book.Format> format,
            @RequestParam(required = false) java.util.List<Book.Status> status,
            @RequestParam(required = false, name = "genre") java.util.List<String> genreHandle,
            @RequestParam(required = false) java.util.List<Long> authorId,
            @RequestParam(required = false) java.util.List<Long> genreId,
            Pageable pageable) {
        return ResponseEntity.ok(bookService.searchBooksForAdminMulti(keyword, format, status, genreHandle, authorId, genreId, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BookResponse> getBookById(@PathVariable Long id) {
        return ResponseEntity.ok(bookService.getBookForAdmin(id));
    }

    @PostMapping
    public ResponseEntity<BookResponse> createBook(@Valid @RequestBody BookCreateRequest request) {
        return ResponseEntity.ok(bookService.createBookByAdmin(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BookResponse> updateBook(@PathVariable Long id, @Valid @RequestBody BookUpdateRequest request) {
        return ResponseEntity.ok(bookService.updateBookByAdmin(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBook(@PathVariable Long id) {
        bookService.deleteBookByAdmin(id);
        return ResponseEntity.noContent().build();
    }
}
