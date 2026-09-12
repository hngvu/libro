package soqe.libro.server.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import soqe.libro.server.dto.*;
import soqe.libro.server.entity.BookCopy;
import soqe.libro.server.service.BookCopyService;

@RestController
@RequestMapping("/admin/book-copies")
@RequiredArgsConstructor
public class AdminBookCopyController {
    private final BookCopyService service;

    @GetMapping
    public ResponseEntity<Page<BookCopyResponse>> search(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) java.util.List<BookCopy.Status> status,
            @RequestParam(required = false) java.util.List<Long> bookId,
            Pageable pageable) {
        return ResponseEntity.ok(service.searchForAdminMulti(keyword, status, bookId, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BookCopyResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getForAdmin(id));
    }

    @PostMapping
    public ResponseEntity<BookCopyResponse> create(@Valid @RequestBody BookCopyCreateRequest req) {
        return ResponseEntity.ok(service.createByAdmin(req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BookCopyResponse> update(@PathVariable Long id, @Valid @RequestBody BookCopyUpdateRequest req) {
        return ResponseEntity.ok(service.updateByAdmin(id, req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.deleteByAdmin(id);
        return ResponseEntity.noContent().build();
    }
}
