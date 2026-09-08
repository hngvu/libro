package soqe.libro.server.controller;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import soqe.libro.server.dto.PublisherPublicResponse;
import soqe.libro.server.service.PublisherService;

@RestController
@RequestMapping("/publishers")
@RequiredArgsConstructor
public class PublisherController {
    private final PublisherService service;
    @GetMapping
    public ResponseEntity<Page<PublisherPublicResponse>> search(@RequestParam(required = false) String keyword, Pageable pageable) {
        return ResponseEntity.ok(service.searchPublic(keyword, pageable));
    }
    @GetMapping("/{handle}")
    public ResponseEntity<PublisherPublicResponse> getByHandle(@PathVariable String handle) {
        return ResponseEntity.ok(service.getByHandle(handle));
    }
}
