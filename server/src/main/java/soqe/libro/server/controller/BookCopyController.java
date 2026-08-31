package soqe.libro.server.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import soqe.libro.server.service.BookCopyService;
import soqe.libro.server.entity.BookCopy;

import java.util.List;

@RestController
@RequestMapping("/book-copies")
@RequiredArgsConstructor
public class BookCopyController {
    
    private final BookCopyService service;

    @GetMapping
    public ResponseEntity<List<BookCopy>> getAll() {
        return ResponseEntity.ok(service.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<BookCopy> getById(@PathVariable Long id) {
        return service.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<BookCopy> create(@RequestBody BookCopy entity) {
        return ResponseEntity.ok(service.save(entity));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BookCopy> update(@PathVariable Long id, @RequestBody BookCopy entity) {
        return ResponseEntity.ok(service.update(id, entity));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
