package soqe.libro.server.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.web.bind.annotation.*;
import soqe.libro.server.dto.BookPublicResponse;
import soqe.libro.server.dto.CollectionCreateRequest;
import soqe.libro.server.dto.CollectionResponse;
import soqe.libro.server.dto.CollectionUpdateRequest;
import soqe.libro.server.service.CollectionService;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/collections")
@RequiredArgsConstructor
public class CollectionController {

    private final CollectionService collectionService;

    // ==========================================
    // PUBLIC APIS
    // ==========================================

    @GetMapping("/curated")
    public ResponseEntity<List<CollectionResponse>> getCuratedCollections() {
        return ResponseEntity.ok(collectionService.getCuratedCollections());
    }

    @GetMapping("/curated/pinned")
    public ResponseEntity<List<CollectionResponse>> getPinnedCuratedCollections() {
        return ResponseEntity.ok(collectionService.getPinnedCuratedCollections());
    }

    @GetMapping("/{slug}")
    public ResponseEntity<CollectionResponse> getCollectionBySlug(
            @PathVariable String slug,
            Principal principal) {
        String email = principal != null ? principal.getName() : null;
        return ResponseEntity.ok(collectionService.getCollectionBySlug(slug, email));
    }

    @GetMapping("/{id}/books")
    public ResponseEntity<Page<BookPublicResponse>> getBooksInCollection(
            @PathVariable Long id,
            Principal principal,
            Pageable pageable) {
        String email = principal != null ? principal.getName() : null;
        return ResponseEntity.ok(collectionService.getBooksInCollection(id, email, pageable));
    }

    // ==========================================
    // MEMBER PERSONAL APIS
    // ==========================================

    @GetMapping("/my")
    public ResponseEntity<List<CollectionResponse>> getMyCollections(Principal principal) {
        requireAuth(principal);
        return ResponseEntity.ok(collectionService.getMyCollections(principal.getName()));
    }

    @PostMapping
    public ResponseEntity<CollectionResponse> createCollection(
            @Valid @RequestBody CollectionCreateRequest req,
            Principal principal) {
        requireAuth(principal);
        return ResponseEntity.status(HttpStatus.CREATED).body(collectionService.createCollection(principal.getName(), req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CollectionResponse> updateCollection(
            @PathVariable Long id,
            @Valid @RequestBody CollectionUpdateRequest req,
            Principal principal) {
        requireAuth(principal);
        return ResponseEntity.ok(collectionService.updateCollection(principal.getName(), id, req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCollection(
            @PathVariable Long id,
            Principal principal) {
        requireAuth(principal);
        collectionService.deleteCollection(principal.getName(), id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/books/{bookId}")
    public ResponseEntity<Void> addBookToCollection(
            @PathVariable Long id,
            @PathVariable Long bookId,
            Principal principal) {
        requireAuth(principal);
        collectionService.addBookToCollection(principal.getName(), id, bookId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}/books/{bookId}")
    public ResponseEntity<Void> removeBookFromCollection(
            @PathVariable Long id,
            @PathVariable Long bookId,
            Principal principal) {
        requireAuth(principal);
        collectionService.removeBookFromCollection(principal.getName(), id, bookId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/my/containing-book/{bookId}")
    public ResponseEntity<List<Long>> getCollectionIdsContainingBook(
            @PathVariable Long bookId,
            Principal principal) {
        if (principal == null) {
            return ResponseEntity.ok(List.of());
        }
        return ResponseEntity.ok(collectionService.getCollectionIdsContainingBook(principal.getName(), bookId));
    }

    // ==========================================
    // SAVED BOOKS (DEFAULT COLLECTION SHORTCUTS)
    // ==========================================

    @GetMapping("/saved")
    public ResponseEntity<List<BookPublicResponse>> getMySavedBooks(Principal principal) {
        requireAuth(principal);
        return ResponseEntity.ok(collectionService.getMySavedBooks(principal.getName()));
    }

    @PostMapping("/saved/toggle/{bookId}")
    public ResponseEntity<java.util.Map<String, Object>> toggleSavedBook(Principal principal, @PathVariable Long bookId) {
        requireAuth(principal);
        return ResponseEntity.ok(collectionService.toggleBookInDefaultCollection(principal.getName(), bookId));
    }

    @DeleteMapping("/saved/{bookId}")
    public ResponseEntity<Void> removeSavedBook(Principal principal, @PathVariable Long bookId) {
        requireAuth(principal);
        collectionService.removeBookFromDefaultCollection(principal.getName(), bookId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/saved/check/{bookId}")
    public ResponseEntity<java.util.Map<String, Boolean>> checkSavedBook(Principal principal, @PathVariable Long bookId) {
        if (principal == null) {
            return ResponseEntity.ok(java.util.Map.of("bookmarked", false));
        }
        boolean isSaved = collectionService.isBookInDefaultCollection(principal.getName(), bookId);
        return ResponseEntity.ok(java.util.Map.of("bookmarked", isSaved));
    }

    @GetMapping("/saved/count")
    public ResponseEntity<java.util.Map<String, Long>> getSavedBooksCount(Principal principal) {
        if (principal == null) {
            return ResponseEntity.ok(java.util.Map.of("count", 0L));
        }
        long count = collectionService.countBooksInDefaultCollection(principal.getName());
        return ResponseEntity.ok(java.util.Map.of("count", count));
    }

    private void requireAuth(Principal principal) {
        if (principal == null) {
            throw new AuthenticationCredentialsNotFoundException("Not authenticated");
        }
    }
}
