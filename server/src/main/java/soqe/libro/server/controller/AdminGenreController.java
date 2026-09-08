package soqe.libro.server.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import soqe.libro.server.dto.*;
import soqe.libro.server.entity.Genre;
import soqe.libro.server.service.GenreService;

@RestController
@RequestMapping("/admin/genres")
@RequiredArgsConstructor
public class AdminGenreController {
    private final GenreService service;

    @GetMapping
    public ResponseEntity<Page<GenreResponse>> search(@RequestParam(required = false) String keyword, @RequestParam(required = false) Genre.Status status, Pageable pageable) {
        return ResponseEntity.ok(service.searchGenresForAdmin(keyword, status, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<GenreResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getGenreForAdmin(id));
    }

    @PostMapping
    public ResponseEntity<GenreResponse> create(@Valid @RequestBody GenreCreateRequest req) {
        return ResponseEntity.ok(service.createGenreByAdmin(req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<GenreResponse> update(@PathVariable Long id, @Valid @RequestBody GenreUpdateRequest req) {
        return ResponseEntity.ok(service.updateGenreByAdmin(id, req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.deleteGenreByAdmin(id);
        return ResponseEntity.noContent().build();
    }
}
