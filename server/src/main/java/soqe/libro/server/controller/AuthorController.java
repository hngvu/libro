package soqe.libro.server.controller;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import soqe.libro.server.dto.AuthorPublicResponse;
import soqe.libro.server.service.AuthorService;

@RestController
@RequestMapping("/authors")
@RequiredArgsConstructor
public class AuthorController {
    private final AuthorService service;
    @GetMapping
    public ResponseEntity<Page<AuthorPublicResponse>> search(@RequestParam(required = false) String keyword, Pageable pageable) {
        return ResponseEntity.ok(service.searchPublic(keyword, pageable));
    }
    @GetMapping("/{handle}")
    public ResponseEntity<AuthorPublicResponse> getByHandle(@PathVariable String handle) {
        return ResponseEntity.ok(service.getByHandle(handle));
    }
}
