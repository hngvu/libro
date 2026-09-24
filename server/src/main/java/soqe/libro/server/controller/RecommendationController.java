package soqe.libro.server.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import soqe.libro.server.dto.BookPublicResponse;
import soqe.libro.server.service.RecommendationService;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/recommendations")
@RequiredArgsConstructor
public class RecommendationController {

    private final RecommendationService recommendationService;

    @GetMapping("/for-you")
    public ResponseEntity<List<BookPublicResponse>> getPersonalizedRecommendations(
            Principal principal,
            @RequestParam(defaultValue = "6") int limit) {
        String email = principal != null ? principal.getName() : null;
        return ResponseEntity.ok(recommendationService.getPersonalizedRecommendations(email, limit));
    }

    @GetMapping("/similar/{bookId}")
    public ResponseEntity<List<BookPublicResponse>> getSimilarBooks(
            @PathVariable Long bookId,
            @RequestParam(defaultValue = "6") int limit) {
        return ResponseEntity.ok(recommendationService.getSimilarBooks(bookId, limit));
    }

    @GetMapping("/trending")
    public ResponseEntity<List<BookPublicResponse>> getTrendingBooks(
            @RequestParam(defaultValue = "6") int limit) {
        return ResponseEntity.ok(recommendationService.getTrendingBooks(limit));
    }
}
