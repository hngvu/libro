package soqe.libro.server.controller;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import soqe.libro.server.dto.*;
import soqe.libro.server.entity.Author;
import soqe.libro.server.service.AuthorService;

@RestController
@RequestMapping("/admin/authors")
@RequiredArgsConstructor
public class AdminAuthorController {
    private final AuthorService service;
    @GetMapping
    public ResponseEntity<Page<AuthorResponse>> search(@RequestParam(required = false) String keyword, @RequestParam(required = false) Author.Status status, Pageable pageable) {
        return ResponseEntity.ok(service.searchForAdmin(keyword, status, pageable));
    }
    @GetMapping("/{id}")
    public ResponseEntity<AuthorResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getForAdmin(id));
    }
    @PostMapping
    public ResponseEntity<AuthorResponse> create(@Valid @RequestBody AuthorCreateRequest req) {
        return ResponseEntity.ok(service.createByAdmin(req));
    }
    @PutMapping("/{id}")
    public ResponseEntity<AuthorResponse> update(@PathVariable Long id, @Valid @RequestBody AuthorUpdateRequest req) {
        return ResponseEntity.ok(service.updateByAdmin(id, req));
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.deleteByAdmin(id);
        return ResponseEntity.noContent().build();
    }
}
