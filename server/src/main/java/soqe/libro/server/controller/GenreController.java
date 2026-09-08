package soqe.libro.server.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import soqe.libro.server.dto.GenrePublicResponse;
import soqe.libro.server.service.GenreService;

@RestController
@RequestMapping("/genres")
@RequiredArgsConstructor
public class GenreController {
    private final GenreService service;

    @GetMapping
    public ResponseEntity<Page<GenrePublicResponse>> search(@RequestParam(required = false) String keyword, Pageable pageable) {
        return ResponseEntity.ok(service.searchGenres(keyword, pageable));
    }

    @GetMapping("/{handle}")
    public ResponseEntity<GenrePublicResponse> getByHandle(@PathVariable String handle) {
        return ResponseEntity.ok(service.getGenreByHandle(handle));
    }
}
