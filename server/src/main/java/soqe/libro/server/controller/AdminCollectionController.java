package soqe.libro.server.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import soqe.libro.server.dto.CollectionCreateRequest;
import soqe.libro.server.dto.CollectionResponse;
import soqe.libro.server.dto.CollectionUpdateRequest;
import soqe.libro.server.service.CollectionService;

import java.util.List;

@RestController
@RequestMapping("/admin/collections")
@RequiredArgsConstructor
public class AdminCollectionController {

    private final CollectionService collectionService;

    @GetMapping
    public ResponseEntity<List<CollectionResponse>> getAllCurated() {
        return ResponseEntity.ok(collectionService.getAllCurated());
    }

    @PostMapping
    public ResponseEntity<CollectionResponse> createCurated(
            @Valid @RequestBody CollectionCreateRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(collectionService.createCurated(req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CollectionResponse> updateCurated(
            @PathVariable Long id,
            @Valid @RequestBody CollectionUpdateRequest req) {
        return ResponseEntity.ok(collectionService.updateCurated(id, req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCurated(@PathVariable Long id) {
        collectionService.deleteCurated(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/books/{bookId}")
    public ResponseEntity<Void> addBookToCurated(
            @PathVariable Long id,
            @PathVariable Long bookId) {
        collectionService.adminAddBook(id, bookId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}/books/{bookId}")
    public ResponseEntity<Void> removeBookFromCurated(
            @PathVariable Long id,
            @PathVariable Long bookId) {
        collectionService.adminRemoveBook(id, bookId);
        return ResponseEntity.noContent().build();
    }
}
