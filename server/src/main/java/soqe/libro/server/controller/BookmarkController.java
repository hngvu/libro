package soqe.libro.server.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.web.bind.annotation.*;
import soqe.libro.server.dto.BookmarkResponse;
import soqe.libro.server.service.BookmarkService;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/bookmarks")
@RequiredArgsConstructor
public class BookmarkController {

    private final BookmarkService bookmarkService;

    @GetMapping
    public ResponseEntity<List<BookmarkResponse>> getMyBookmarks(Principal principal) {
        if (principal == null) {
            throw new AuthenticationCredentialsNotFoundException("Not authenticated");
        }
        return ResponseEntity.ok(bookmarkService.getMyBookmarks(principal.getName()));
    }

    @PostMapping("/{bookId}/toggle")
    public ResponseEntity<Map<String, Object>> toggleBookmark(Principal principal, @PathVariable Long bookId) {
        if (principal == null) {
            throw new AuthenticationCredentialsNotFoundException("Not authenticated");
        }
        return ResponseEntity.ok(bookmarkService.toggleBookmark(principal.getName(), bookId));
    }

    @DeleteMapping("/{bookId}")
    public ResponseEntity<Void> removeBookmark(Principal principal, @PathVariable Long bookId) {
        if (principal == null) {
            throw new AuthenticationCredentialsNotFoundException("Not authenticated");
        }
        bookmarkService.removeBookmark(principal.getName(), bookId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/check/{bookId}")
    public ResponseEntity<Map<String, Boolean>> checkBookmarked(Principal principal, @PathVariable Long bookId) {
        if (principal == null) {
            return ResponseEntity.ok(Map.of("bookmarked", false));
        }
        boolean bookmarked = bookmarkService.isBookmarked(principal.getName(), bookId);
        return ResponseEntity.ok(Map.of("bookmarked", bookmarked));
    }

    @GetMapping("/count")
    public ResponseEntity<Map<String, Long>> getBookmarkCount(Principal principal) {
        if (principal == null) {
            return ResponseEntity.ok(Map.of("count", 0L));
        }
        long count = bookmarkService.getBookmarkCount(principal.getName());
        return ResponseEntity.ok(Map.of("count", count));
    }
}
