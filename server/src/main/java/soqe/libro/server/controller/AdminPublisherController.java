package soqe.libro.server.controller;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import soqe.libro.server.dto.*;
import soqe.libro.server.entity.Publisher;
import soqe.libro.server.service.PublisherService;

@RestController
@RequestMapping("/admin/publishers")
@RequiredArgsConstructor
public class AdminPublisherController {
    private final PublisherService service;
    @GetMapping
    public ResponseEntity<Page<PublisherResponse>> search(@RequestParam(required = false) String keyword, @RequestParam(required = false) Publisher.Status status, Pageable pageable) {
        return ResponseEntity.ok(service.searchForAdmin(keyword, status, pageable));
    }
    @GetMapping("/{id}")
    public ResponseEntity<PublisherResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getForAdmin(id));
    }
    @PostMapping
    public ResponseEntity<PublisherResponse> create(@Valid @RequestBody PublisherCreateRequest req) {
        return ResponseEntity.ok(service.createByAdmin(req));
    }
    @PutMapping("/{id}")
    public ResponseEntity<PublisherResponse> update(@PathVariable Long id, @Valid @RequestBody PublisherUpdateRequest req) {
        return ResponseEntity.ok(service.updateByAdmin(id, req));
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.deleteByAdmin(id);
        return ResponseEntity.noContent().build();
    }
}
