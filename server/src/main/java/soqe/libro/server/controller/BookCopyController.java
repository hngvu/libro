package soqe.libro.server.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import soqe.libro.server.dto.BookCopyPublicResponse;
import soqe.libro.server.service.BookCopyService;

@RestController
@RequestMapping("/book-copies")
@RequiredArgsConstructor
public class BookCopyController {
    private final BookCopyService service;

    @GetMapping("/book/{bookHandle}")
    public ResponseEntity<Page<BookCopyPublicResponse>> getByBookHandle(@PathVariable String bookHandle, Pageable pageable) {
        return ResponseEntity.ok(service.getCopiesForBook(bookHandle, pageable));
    }

    @GetMapping("/{barcode}")
    public ResponseEntity<BookCopyPublicResponse> getByBarcode(@PathVariable String barcode) {
        return ResponseEntity.ok(service.getByBarcode(barcode));
    }
}
