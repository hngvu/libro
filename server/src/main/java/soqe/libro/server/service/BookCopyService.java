package soqe.libro.server.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import soqe.libro.server.dto.*;
import soqe.libro.server.entity.BookCopy;
import soqe.libro.server.entity.Book;
import soqe.libro.server.repository.BookCopyRepository;
import soqe.libro.server.repository.BookRepository;
import soqe.libro.server.specification.BookCopySpecification;
import soqe.libro.server.exception.BusinessValidationException;
import soqe.libro.server.exception.ResourceNotFoundException;
import org.springframework.util.StringUtils;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class BookCopyService {
    private final BookCopyRepository repository;
    private final BookRepository bookRepository;

    @Transactional(readOnly = true)
    public Page<BookCopyResponse> searchForAdmin(String keyword, BookCopy.Status status, Long bookId, Pageable pageable) {
        return repository.findAll(BookCopySpecification.filter(keyword, status, bookId, null), pageable)
                .map(this::toAdminResponse);
    }

    @Transactional(readOnly = true)
    public BookCopyResponse getForAdmin(Long id) {
        BookCopy c = repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("BookCopy not found"));
        return toAdminResponse(c);
    }

    @Transactional
    public BookCopyResponse createByAdmin(BookCopyCreateRequest req) {
        validateUnique(req.barcode(), null);
        Book book = bookRepository.findById(req.bookId()).orElseThrow(() -> new ResourceNotFoundException("Book not found"));
        BookCopy c = BookCopy.builder()
                .barcode(req.barcode())
                .book(book)
                .status(BookCopy.Status.AVAILABLE)
                .location(req.location())
                .build();
        c = repository.save(c);
        
        // Update book counters
        book.setTotalCopies(book.getTotalCopies() + 1);
        book.setAvailableCopies(book.getAvailableCopies() + 1);
        bookRepository.save(book);

        return toAdminResponse(c);
    }

    @Transactional
    public BookCopyResponse updateByAdmin(Long id, BookCopyUpdateRequest req) {
        BookCopy c = repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("BookCopy not found"));
        validateUnique(req.barcode(), id);
        
        BookCopy.Status oldStatus = c.getStatus();
        
        c.setBarcode(req.barcode());
        if (req.status() != null) c.setStatus(req.status());
        if (req.location() != null) c.setLocation(req.location());
        c = repository.save(c);
        
        // Update book counters if status changed between AVAILABLE and non-AVAILABLE
        if (oldStatus != c.getStatus()) {
            Book book = c.getBook();
            if (oldStatus == BookCopy.Status.AVAILABLE && c.getStatus() != BookCopy.Status.AVAILABLE) {
                book.setAvailableCopies(book.getAvailableCopies() - 1);
            } else if (oldStatus != BookCopy.Status.AVAILABLE && c.getStatus() == BookCopy.Status.AVAILABLE) {
                book.setAvailableCopies(book.getAvailableCopies() + 1);
            }
            bookRepository.save(book);
        }

        return toAdminResponse(c);
    }

    private BookCopyResponse toAdminResponse(BookCopy c) {
        java.time.LocalDate lastDate = null;
        if (c.getLoans() != null && !c.getLoans().isEmpty()) {
            lastDate = c.getLoans().stream()
                    .map(soqe.libro.server.entity.Loan::getBorrowDate)
                    .filter(java.util.Objects::nonNull)
                    .max(java.util.Comparator.naturalOrder())
                    .orElse(null);
        }
        return BookCopyResponse.builder()
                .id(c.getId())
                .barcode(c.getBarcode())
                .status(c.getStatus() != null ? c.getStatus().name() : null)
                .location(c.getLocation())
                .bookId(c.getBook() != null ? c.getBook().getId() : null)
                .lastLoanDate(lastDate)
                .build();
    }

    @Transactional
    public void deleteByAdmin(Long id) {
        BookCopy c = repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("BookCopy not found"));
        if (c.getStatus() != BookCopy.Status.ARCHIVED) {
            if (c.getStatus() == BookCopy.Status.AVAILABLE) {
                Book book = c.getBook();
                book.setAvailableCopies(book.getAvailableCopies() - 1);
                book.setTotalCopies(book.getTotalCopies() - 1);
                bookRepository.save(book);
            }
            c.setStatus(BookCopy.Status.ARCHIVED);
            repository.save(c);
        }
    }

    @Transactional(readOnly = true)
    public Page<BookCopyPublicResponse> getCopiesForBook(String bookHandle, Pageable pageable) {
        Book book = bookRepository.findByHandle(bookHandle).orElseThrow(() -> new ResourceNotFoundException("Book not found"));
        return repository.findAll(soqe.libro.server.specification.BookCopySpecification.filter(null, null, book.getId(), BookCopy.Status.ARCHIVED), pageable)
                .map(c -> BookCopyPublicResponse.builder()
                        .barcode(c.getBarcode())
                        .status(c.getStatus() != null ? c.getStatus().name() : null)
                        .location(c.getLocation())
                        .build());
    }

    @Transactional(readOnly = true)
    public BookCopyPublicResponse getByBarcode(String barcode) {
        BookCopy c = repository.findByBarcode(barcode)
                .filter(x -> x.getStatus() != BookCopy.Status.ARCHIVED)
                .orElseThrow(() -> new ResourceNotFoundException("BookCopy not found"));
        return BookCopyPublicResponse.builder()
                .barcode(c.getBarcode())
                .status(c.getStatus() != null ? c.getStatus().name() : null)
                .location(c.getLocation())
                .build();
    }

    private void validateUnique(String barcode, Long excludeId) {
        Map<String, String> errors = new HashMap<>();
        if (StringUtils.hasText(barcode)) {
            repository.findByBarcode(barcode).ifPresent(c -> { if (excludeId == null || !c.getId().equals(excludeId)) errors.put("barcode", "Barcode is taken"); });
        }
        if (!errors.isEmpty()) throw new BusinessValidationException("Validation failed", errors);
    }
}
