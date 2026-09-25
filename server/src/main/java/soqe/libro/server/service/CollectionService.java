package soqe.libro.server.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import soqe.libro.server.dto.BookPublicResponse;
import soqe.libro.server.dto.CollectionCreateRequest;
import soqe.libro.server.dto.CollectionResponse;
import soqe.libro.server.dto.CollectionUpdateRequest;
import soqe.libro.server.entity.Book;
import soqe.libro.server.entity.Collection;
import soqe.libro.server.entity.CollectionBook;
import soqe.libro.server.entity.User;
import soqe.libro.server.exception.BusinessValidationException;
import soqe.libro.server.exception.ResourceNotFoundException;
import soqe.libro.server.repository.BookRepository;
import soqe.libro.server.repository.CollectionBookRepository;
import soqe.libro.server.repository.CollectionRepository;
import soqe.libro.server.repository.UserRepository;

import java.text.Normalizer;
import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class CollectionService {

    private final CollectionRepository collectionRepository;
    private final CollectionBookRepository collectionBookRepository;
    private final BookRepository bookRepository;
    private final UserRepository userRepository;
    private final BookService bookService;

    private static final int MAX_COLLECTIONS_PER_USER = 20;
    private static final int MAX_BOOKS_PER_COLLECTION = 200;

    // ==========================================
    // PUBLIC / CURATED APIS
    // ==========================================

    @Transactional(readOnly = true)
    public List<CollectionResponse> getCuratedCollections() {
        return collectionRepository.findByTypeOrderByDisplayOrderAscCreatedAtDesc(Collection.CollectionType.CURATED)
                .stream()
                .map(this::toResponseWithPreviews)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CollectionResponse> getPinnedCuratedCollections() {
        return collectionRepository.findByTypeAndPinnedTrueOrderByDisplayOrderAsc(Collection.CollectionType.CURATED)
                .stream()
                .map(this::toResponseWithPreviews)
                .toList();
    }

    @Transactional(readOnly = true)
    public CollectionResponse getCollectionBySlug(String slug, String viewerEmail) {
        Collection collection = collectionRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Collection not found: " + slug));

        if (collection.getType() == Collection.CollectionType.PERSONAL) {
            User viewer = viewerEmail != null ? userRepository.findByEmail(viewerEmail).orElse(null) : null;
            if (viewer == null || collection.getOwner() == null || !collection.getOwner().getId().equals(viewer.getId())) {
                throw new ResourceNotFoundException("Collection not found or access denied");
            }
        }

        return toResponseWithPreviews(collection);
    }

    @Transactional(readOnly = true)
    public Page<BookPublicResponse> getBooksInCollection(Long collectionId, String viewerEmail, Pageable pageable) {
        Collection collection = collectionRepository.findById(collectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Collection not found: " + collectionId));

        if (collection.getType() == Collection.CollectionType.PERSONAL) {
            User viewer = viewerEmail != null ? userRepository.findByEmail(viewerEmail).orElse(null) : null;
            if (viewer == null || collection.getOwner() == null || !collection.getOwner().getId().equals(viewer.getId())) {
                throw new ResourceNotFoundException("Collection not found or access denied");
            }
        }

        return collectionBookRepository.findByCollectionOrderByAddedAtDesc(collection, pageable)
                .map(cb -> bookService.mapToPublicResponse(cb.getBook()));
    }

    // ==========================================
    // MEMBER PERSONAL APIS
    // ==========================================

    @Transactional
    public Collection getOrCreateDefaultCollection(User user) {
        return collectionRepository.findByOwnerAndIsDefaultTrue(user)
                .orElseGet(() -> {
                    String slug = "saved-books-" + user.getId();
                    Collection defaultColl = Collection.builder()
                            .name("Saved Books")
                            .slug(slug)
                            .description("Default collection for your bookmarked titles")
                            .type(Collection.CollectionType.PERSONAL)
                            .owner(user)
                            .isDefault(true)
                            .bookCount(0)
                            .build();
                    return collectionRepository.save(defaultColl);
                });
    }

    @Transactional
    public List<CollectionResponse> getMyCollections(String email) {
        User user = findUserByEmail(email);
        getOrCreateDefaultCollection(user); // Ensure default collection exists

        return collectionRepository.findByOwnerOrderByIsDefaultDescUpdatedAtDesc(user)
                .stream()
                .map(this::toResponseWithPreviews)
                .toList();
    }

    @Transactional
    public CollectionResponse createCollection(String email, CollectionCreateRequest req) {
        User user = findUserByEmail(email);

        long count = collectionRepository.countByOwner(user);
        if (count >= MAX_COLLECTIONS_PER_USER) {
            throw new BusinessValidationException("collection",
                    Map.of("limit", "You can have at most " + MAX_COLLECTIONS_PER_USER + " collections"));
        }

        String baseSlug = toSlug(req.name());
        String slug = generateUniqueSlug(baseSlug, user.getId());

        Collection collection = Collection.builder()
                .name(req.name().trim())
                .slug(slug)
                .description(req.description() != null ? req.description().trim() : null)
                .coverImage(req.coverImage())
                .type(Collection.CollectionType.PERSONAL)
                .owner(user)
                .isDefault(false)
                .bookCount(0)
                .build();

        collection = collectionRepository.save(collection);
        log.info("User {} created collection '{}' ({})", email, collection.getName(), collection.getSlug());
        return toResponseWithPreviews(collection);
    }

    @Transactional
    public CollectionResponse updateCollection(String email, Long id, CollectionUpdateRequest req) {
        User user = findUserByEmail(email);
        Collection collection = findOwnedCollection(user, id);

        if (StringUtils.hasText(req.name())) {
            collection.setName(req.name().trim());
        }
        if (req.description() != null) {
            collection.setDescription(req.description().trim());
        }
        if (req.coverImage() != null) {
            collection.setCoverImage(req.coverImage());
        }

        collection = collectionRepository.save(collection);
        log.info("User {} updated collection '{}'", email, collection.getName());
        return toResponseWithPreviews(collection);
    }

    @Transactional
    public void deleteCollection(String email, Long id) {
        User user = findUserByEmail(email);
        Collection collection = findOwnedCollection(user, id);

        if (collection.isDefault()) {
            throw new BusinessValidationException("collection",
                    Map.of("default", "The default 'Saved Books' collection cannot be deleted"));
        }

        List<CollectionBook> books = collectionBookRepository.findByCollectionOrderByAddedAtDesc(collection);
        collectionBookRepository.deleteAll(books);
        collectionRepository.delete(collection);
        log.info("User {} deleted collection '{}'", email, collection.getName());
    }

    @Transactional
    public void addBookToCollection(String email, Long collectionId, Long bookId) {
        User user = findUserByEmail(email);
        Collection collection = findOwnedCollection(user, collectionId);
        Book book = findBookById(bookId);

        if (collectionBookRepository.existsByCollectionAndBook(collection, book)) {
            return; // Already added
        }

        if (collection.getBookCount() >= MAX_BOOKS_PER_COLLECTION) {
            throw new BusinessValidationException("collection",
                    Map.of("limit", "This collection has reached the maximum of " + MAX_BOOKS_PER_COLLECTION + " books"));
        }

        CollectionBook cb = CollectionBook.builder()
                .collection(collection)
                .book(book)
                .addedAt(LocalDateTime.now())
                .sortOrder(collection.getBookCount() + 1)
                .build();
        collectionBookRepository.save(cb);

        collection.setBookCount(collection.getBookCount() + 1);
        collectionRepository.save(collection);
        log.info("User {} added book '{}' to collection '{}'", email, book.getTitle(), collection.getName());
    }

    @Transactional
    public void removeBookFromCollection(String email, Long collectionId, Long bookId) {
        User user = findUserByEmail(email);
        Collection collection = findOwnedCollection(user, collectionId);
        Book book = findBookById(bookId);

        var existing = collectionBookRepository.findByCollectionAndBook(collection, book);
        if (existing.isPresent()) {
            collectionBookRepository.delete(existing.get());
            collection.setBookCount(Math.max(0, collection.getBookCount() - 1));
            collectionRepository.save(collection);
            log.info("User {} removed book '{}' from collection '{}'", email, book.getTitle(), collection.getName());
        }
    }

    @Transactional(readOnly = true)
    public List<Long> getCollectionIdsContainingBook(String email, Long bookId) {
        User user = findUserByEmail(email);
        return collectionBookRepository.findCollectionIdsByOwnerAndBookId(user, bookId);
    }

    // ==========================================
    // BOOKMARK INTEGRATION (Saved Books Shortcuts)
    // ==========================================

    @Transactional
    public Map<String, Object> toggleBookInDefaultCollection(String email, Long bookId) {
        User user = findUserByEmail(email);
        Collection defaultColl = getOrCreateDefaultCollection(user);
        Book book = findBookById(bookId);

        var existing = collectionBookRepository.findByCollectionAndBook(defaultColl, book);
        boolean isSaved;
        if (existing.isPresent()) {
            collectionBookRepository.delete(existing.get());
            defaultColl.setBookCount(Math.max(0, defaultColl.getBookCount() - 1));
            isSaved = false;
        } else {
            CollectionBook cb = CollectionBook.builder()
                    .collection(defaultColl)
                    .book(book)
                    .addedAt(LocalDateTime.now())
                    .sortOrder(defaultColl.getBookCount() + 1)
                    .build();
            collectionBookRepository.save(cb);
            defaultColl.setBookCount(defaultColl.getBookCount() + 1);
            isSaved = true;
        }
        collectionRepository.save(defaultColl);

        return Map.of(
                "bookmarked", isSaved,
                "count", (long) defaultColl.getBookCount(),
                "bookId", bookId
        );
    }

    @Transactional(readOnly = true)
    public boolean isBookInDefaultCollection(String email, Long bookId) {
        if (email == null) return false;
        var userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) return false;
        User user = userOpt.get();

        var defaultColl = collectionRepository.findByOwnerAndIsDefaultTrue(user);
        if (defaultColl.isEmpty()) return false;

        var bookOpt = bookRepository.findById(bookId);
        return bookOpt.filter(book -> collectionBookRepository.existsByCollectionAndBook(defaultColl.get(), book)).isPresent();
    }

    @Transactional(readOnly = true)
    public long countBooksInDefaultCollection(String email) {
        if (email == null) return 0L;
        var userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) return 0L;
        User user = userOpt.get();

        return collectionRepository.findByOwnerAndIsDefaultTrue(user)
                .map(c -> (long) c.getBookCount())
                .orElse(0L);
    }

    @Transactional(readOnly = true)
    public List<BookPublicResponse> getMySavedBooks(String email) {
        User user = findUserByEmail(email);
        Collection defaultColl = getOrCreateDefaultCollection(user);

        return collectionBookRepository.findByCollectionOrderByAddedAtDesc(defaultColl)
                .stream()
                .map(cb -> bookService.mapToPublicResponse(cb.getBook()))
                .toList();
    }

    // ==========================================
    // ADMIN CURATED APIS
    // ==========================================

    @Transactional(readOnly = true)
    public List<CollectionResponse> getAllCurated() {
        return collectionRepository.findByTypeOrderByDisplayOrderAscCreatedAtDesc(Collection.CollectionType.CURATED)
                .stream()
                .map(this::toResponseWithPreviews)
                .toList();
    }

    @Transactional
    public CollectionResponse createCurated(CollectionCreateRequest req) {
        String baseSlug = toSlug(req.name());
        String slug = generateUniqueSlug(baseSlug, null);

        Collection collection = Collection.builder()
                .name(req.name().trim())
                .slug(slug)
                .description(req.description() != null ? req.description().trim() : null)
                .coverImage(req.coverImage())
                .type(Collection.CollectionType.CURATED)
                .owner(null)
                .isDefault(false)
                .bookCount(0)
                .pinned(false)
                .displayOrder(0)
                .build();

        collection = collectionRepository.save(collection);
        log.info("Admin created curated collection '{}'", collection.getName());
        return toResponseWithPreviews(collection);
    }

    @Transactional
    public CollectionResponse updateCurated(Long id, CollectionUpdateRequest req) {
        Collection collection = collectionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Collection not found: " + id));

        if (collection.getType() != Collection.CollectionType.CURATED) {
            throw new BusinessValidationException("collection", Map.of("type", "Cannot modify personal collection via admin API"));
        }

        if (StringUtils.hasText(req.name())) {
            collection.setName(req.name().trim());
        }
        if (req.description() != null) {
            collection.setDescription(req.description().trim());
        }
        if (req.coverImage() != null) {
            collection.setCoverImage(req.coverImage());
        }
        if (req.pinned() != null) {
            collection.setPinned(req.pinned());
        }
        if (req.displayOrder() != null) {
            collection.setDisplayOrder(req.displayOrder());
        }

        collection = collectionRepository.save(collection);
        log.info("Admin updated curated collection '{}'", collection.getName());
        return toResponseWithPreviews(collection);
    }

    @Transactional
    public void deleteCurated(Long id) {
        Collection collection = collectionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Collection not found: " + id));

        if (collection.getType() != Collection.CollectionType.CURATED) {
            throw new BusinessValidationException("collection", Map.of("type", "Cannot delete personal collection via admin API"));
        }

        List<CollectionBook> books = collectionBookRepository.findByCollectionOrderByAddedAtDesc(collection);
        collectionBookRepository.deleteAll(books);
        collectionRepository.delete(collection);
        log.info("Admin deleted curated collection '{}'", collection.getName());
    }

    @Transactional
    public void adminAddBook(Long collectionId, Long bookId) {
        Collection collection = collectionRepository.findById(collectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Collection not found: " + collectionId));

        if (collection.getType() != Collection.CollectionType.CURATED) {
            throw new BusinessValidationException("collection", Map.of("type", "Cannot modify personal collection via admin API"));
        }

        Book book = findBookById(bookId);
        if (collectionBookRepository.existsByCollectionAndBook(collection, book)) {
            return;
        }

        CollectionBook cb = CollectionBook.builder()
                .collection(collection)
                .book(book)
                .addedAt(LocalDateTime.now())
                .sortOrder(collection.getBookCount() + 1)
                .build();
        collectionBookRepository.save(cb);

        collection.setBookCount(collection.getBookCount() + 1);
        collectionRepository.save(collection);
        log.info("Admin added book '{}' to curated collection '{}'", book.getTitle(), collection.getName());
    }

    @Transactional
    public void adminRemoveBook(Long collectionId, Long bookId) {
        Collection collection = collectionRepository.findById(collectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Collection not found: " + collectionId));

        if (collection.getType() != Collection.CollectionType.CURATED) {
            throw new BusinessValidationException("collection", Map.of("type", "Cannot modify personal collection via admin API"));
        }

        Book book = findBookById(bookId);
        var existing = collectionBookRepository.findByCollectionAndBook(collection, book);
        if (existing.isPresent()) {
            collectionBookRepository.delete(existing.get());
            collection.setBookCount(Math.max(0, collection.getBookCount() - 1));
            collectionRepository.save(collection);
            log.info("Admin removed book '{}' from curated collection '{}'", book.getTitle(), collection.getName());
        }
    }

    // ==========================================
    // HELPERS
    // ==========================================

    private User findUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    private Book findBookById(Long bookId) {
        return bookRepository.findById(bookId)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found with id: " + bookId));
    }

    private Collection findOwnedCollection(User user, Long collectionId) {
        Collection c = collectionRepository.findById(collectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Collection not found: " + collectionId));
        if (c.getOwner() == null || !c.getOwner().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("Collection not found or access denied");
        }
        return c;
    }

    private CollectionResponse toResponseWithPreviews(Collection c) {
        List<BookPublicResponse> previews = collectionBookRepository.findTop4ByCollectionOrderByAddedAtDesc(c)
                .stream()
                .map(cb -> bookService.mapToPublicResponse(cb.getBook()))
                .toList();

        return CollectionResponse.builder()
                .id(c.getId())
                .name(c.getName())
                .slug(c.getSlug())
                .description(c.getDescription())
                .coverImage(c.getCoverImage())
                .type(c.getType().name())
                .isDefault(c.isDefault())
                .bookCount(c.getBookCount())
                .pinned(c.isPinned())
                .displayOrder(c.getDisplayOrder())
                .previewBooks(previews)
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }

    private String toSlug(String input) {
        if (!StringUtils.hasText(input)) return "collection";
        return Normalizer.normalize(input, Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "")
                .toLowerCase()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-+|-+$", "");
    }

    private String generateUniqueSlug(String base, Long userId) {
        String prefix = userId != null ? base + "-u" + userId : base;
        String candidate = prefix;
        int counter = 1;
        while (collectionRepository.existsBySlug(candidate)) {
            candidate = prefix + "-" + counter++;
        }
        return candidate;
    }
}
