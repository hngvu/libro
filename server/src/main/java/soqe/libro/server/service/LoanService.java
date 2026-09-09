package soqe.libro.server.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import soqe.libro.server.dto.*;
import soqe.libro.server.entity.Book;
import soqe.libro.server.entity.BookCopy;
import soqe.libro.server.entity.Loan;
import soqe.libro.server.entity.User;
import soqe.libro.server.exception.BusinessValidationException;
import soqe.libro.server.exception.ResourceNotFoundException;
import soqe.libro.server.repository.BookCopyRepository;
import soqe.libro.server.repository.BookRepository;
import soqe.libro.server.repository.LoanRepository;
import soqe.libro.server.repository.UserRepository;
import soqe.libro.server.specification.LoanSpecification;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class LoanService {

    private static final String ALPHANUMERIC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyMMdd");

    private final LoanRepository repository;
    private final UserRepository userRepository;
    private final BookCopyRepository bookCopyRepository;
    private final BookRepository bookRepository;

    // ==========================================
    // ADMIN METHODS
    // ==========================================

    @Transactional(readOnly = true)
    public Page<LoanResponse> searchLoansForAdmin(
            String keyword,
            Loan.LoanStatus status,
            Long userId,
            Long bookCopyId,
            Boolean isOverdue,
            Pageable pageable) {

        return repository.findAll(LoanSpecification.filter(keyword, status, userId, bookCopyId, isOverdue), pageable)
                .map(loan -> LoanResponse.builder()
                        .id(loan.getId())
                        .loanCode(loan.getLoanCode())
                        .userId(loan.getUser() != null ? loan.getUser().getId() : null)
                        .userEmail(loan.getUser() != null ? loan.getUser().getEmail() : null)
                        .userFullName(loan.getUser() != null ? loan.getUser().getFullName() : null)
                        .bookCopyId(loan.getBookCopy() != null ? loan.getBookCopy().getId() : null)
                        .barcode(loan.getBookCopy() != null ? loan.getBookCopy().getBarcode() : null)
                        .bookId(loan.getBookCopy() != null && loan.getBookCopy().getBook() != null ? loan.getBookCopy().getBook().getId() : null)
                        .bookTitle(loan.getBookCopy() != null && loan.getBookCopy().getBook() != null ? loan.getBookCopy().getBook().getTitle() : null)
                        .bookHandle(loan.getBookCopy() != null && loan.getBookCopy().getBook() != null ? loan.getBookCopy().getBook().getHandle() : null)
                        .borrowDate(loan.getBorrowDate())
                        .dueDate(loan.getDueDate())
                        .returnDate(loan.getReturnDate())
                        .status(loan.getStatus() != null ? loan.getStatus().name() : null)
                        .createdAt(loan.getCreatedAt())
                        .updatedAt(loan.getUpdatedAt())
                        .createdBy(loan.getCreatedBy())
                        .updatedBy(loan.getUpdatedBy())
                        .build());
    }

    @Transactional(readOnly = true)
    public LoanResponse getLoanForAdmin(Long id) {
        Loan loan = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found"));

        return LoanResponse.builder()
                .id(loan.getId())
                .loanCode(loan.getLoanCode())
                .userId(loan.getUser() != null ? loan.getUser().getId() : null)
                .userEmail(loan.getUser() != null ? loan.getUser().getEmail() : null)
                .userFullName(loan.getUser() != null ? loan.getUser().getFullName() : null)
                .bookCopyId(loan.getBookCopy() != null ? loan.getBookCopy().getId() : null)
                .barcode(loan.getBookCopy() != null ? loan.getBookCopy().getBarcode() : null)
                .bookId(loan.getBookCopy() != null && loan.getBookCopy().getBook() != null ? loan.getBookCopy().getBook().getId() : null)
                .bookTitle(loan.getBookCopy() != null && loan.getBookCopy().getBook() != null ? loan.getBookCopy().getBook().getTitle() : null)
                .bookHandle(loan.getBookCopy() != null && loan.getBookCopy().getBook() != null ? loan.getBookCopy().getBook().getHandle() : null)
                .borrowDate(loan.getBorrowDate())
                .dueDate(loan.getDueDate())
                .returnDate(loan.getReturnDate())
                .status(loan.getStatus() != null ? loan.getStatus().name() : null)
                .createdAt(loan.getCreatedAt())
                .updatedAt(loan.getUpdatedAt())
                .createdBy(loan.getCreatedBy())
                .updatedBy(loan.getUpdatedBy())
                .build();
    }

    @Transactional
    public LoanResponse createLoanByAdmin(LoanCreateRequest req) {
        Map<String, String> errors = new HashMap<>();

        User user = null;
        if (req.userId() != null) {
            var userOpt = userRepository.findById(req.userId());
            if (userOpt.isEmpty()) {
                errors.put("userId", "User not found with ID: " + req.userId());
            } else {
                user = userOpt.get();
                if (user.getStatus() != User.Status.ACTIVE) {
                    errors.put("user", "User account is " + user.getStatus() + " and cannot borrow books");
                }
            }
        }

        BookCopy copy = null;
        if (req.bookCopyId() != null) {
            var copyOpt = bookCopyRepository.findById(req.bookCopyId());
            if (copyOpt.isEmpty()) {
                errors.put("bookCopyId", "Book copy not found with ID: " + req.bookCopyId());
            } else {
                copy = copyOpt.get();
                if (copy.getStatus() != BookCopy.Status.AVAILABLE) {
                    errors.put("bookCopy", "Book copy is currently " + copy.getStatus() + " and not available for borrowing");
                }
            }
        }

        if (!errors.isEmpty()) {
            throw new BusinessValidationException("Loan creation failed", errors);
        }

        // Update book copy and book counters
        copy.setStatus(BookCopy.Status.LOANED);
        Book book = copy.getBook();
        if (book != null) {
            book.setAvailableCopies(Math.max(0, book.getAvailableCopies() - 1));
            bookRepository.save(book);
        }
        bookCopyRepository.save(copy);

        LocalDate borrowDate = LocalDate.now();
        LocalDate dueDate = req.dueDate() != null ? req.dueDate() : borrowDate.plusDays(14);
        String loanCode = generateUniqueLoanCode();

        Loan loan = Loan.builder()
                .loanCode(loanCode)
                .user(user)
                .bookCopy(copy)
                .borrowDate(borrowDate)
                .dueDate(dueDate)
                .status(Loan.LoanStatus.ONGOING)
                .build();

        loan = repository.save(loan);

        return LoanResponse.builder()
                .id(loan.getId())
                .loanCode(loan.getLoanCode())
                .userId(user.getId())
                .userEmail(user.getEmail())
                .userFullName(user.getFullName())
                .bookCopyId(copy.getId())
                .barcode(copy.getBarcode())
                .bookId(book != null ? book.getId() : null)
                .bookTitle(book != null ? book.getTitle() : null)
                .bookHandle(book != null ? book.getHandle() : null)
                .borrowDate(loan.getBorrowDate())
                .dueDate(loan.getDueDate())
                .returnDate(loan.getReturnDate())
                .status(loan.getStatus().name())
                .createdAt(loan.getCreatedAt())
                .updatedAt(loan.getUpdatedAt())
                .createdBy(loan.getCreatedBy())
                .updatedBy(loan.getUpdatedBy())
                .build();
    }

    @Transactional
    public LoanResponse returnLoanByAdmin(Long id) {
        Loan loan = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found"));

        if (loan.getStatus() == Loan.LoanStatus.RETURNED) {
            throw new BusinessValidationException("Return failed", Map.of("loan", "This loan has already been marked as returned"));
        }
        if (loan.getStatus() == Loan.LoanStatus.CANCELLED) {
            throw new BusinessValidationException("Return failed", Map.of("loan", "This loan has been cancelled and cannot be returned"));
        }

        loan.setReturnDate(LocalDate.now());
        loan.setStatus(Loan.LoanStatus.RETURNED);

        BookCopy copy = loan.getBookCopy();
        if (copy != null) {
            if (copy.getStatus() == BookCopy.Status.LOANED) {
                copy.setStatus(BookCopy.Status.AVAILABLE);
                bookCopyRepository.save(copy);
            }
            Book book = copy.getBook();
            if (book != null) {
                book.setAvailableCopies(book.getAvailableCopies() + 1);
                bookRepository.save(book);
            }
        }

        loan = repository.save(loan);

        return LoanResponse.builder()
                .id(loan.getId())
                .loanCode(loan.getLoanCode())
                .userId(loan.getUser() != null ? loan.getUser().getId() : null)
                .userEmail(loan.getUser() != null ? loan.getUser().getEmail() : null)
                .userFullName(loan.getUser() != null ? loan.getUser().getFullName() : null)
                .bookCopyId(loan.getBookCopy() != null ? loan.getBookCopy().getId() : null)
                .barcode(loan.getBookCopy() != null ? loan.getBookCopy().getBarcode() : null)
                .bookId(loan.getBookCopy() != null && loan.getBookCopy().getBook() != null ? loan.getBookCopy().getBook().getId() : null)
                .bookTitle(loan.getBookCopy() != null && loan.getBookCopy().getBook() != null ? loan.getBookCopy().getBook().getTitle() : null)
                .bookHandle(loan.getBookCopy() != null && loan.getBookCopy().getBook() != null ? loan.getBookCopy().getBook().getHandle() : null)
                .borrowDate(loan.getBorrowDate())
                .dueDate(loan.getDueDate())
                .returnDate(loan.getReturnDate())
                .status(loan.getStatus().name())
                .createdAt(loan.getCreatedAt())
                .updatedAt(loan.getUpdatedAt())
                .createdBy(loan.getCreatedBy())
                .updatedBy(loan.getUpdatedBy())
                .build();
    }

    @Transactional
    public LoanResponse renewLoanByAdmin(Long id, LoanRenewRequest req) {
        Loan loan = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found"));

        if (loan.getStatus() != Loan.LoanStatus.ONGOING) {
            throw new BusinessValidationException("Renew failed", Map.of("loan", "Only ongoing loans can be renewed"));
        }

        if (req != null && req.newDueDate() != null) {
            if (req.newDueDate().isBefore(loan.getDueDate())) {
                throw new BusinessValidationException("Renew failed", Map.of("newDueDate", "New due date cannot be earlier than current due date"));
            }
            loan.setDueDate(req.newDueDate());
        } else {
            int days = (req != null && req.extensionDays() != null) ? req.extensionDays() : 14;
            loan.setDueDate(loan.getDueDate().plusDays(days));
        }

        loan = repository.save(loan);

        return LoanResponse.builder()
                .id(loan.getId())
                .loanCode(loan.getLoanCode())
                .userId(loan.getUser() != null ? loan.getUser().getId() : null)
                .userEmail(loan.getUser() != null ? loan.getUser().getEmail() : null)
                .userFullName(loan.getUser() != null ? loan.getUser().getFullName() : null)
                .bookCopyId(loan.getBookCopy() != null ? loan.getBookCopy().getId() : null)
                .barcode(loan.getBookCopy() != null ? loan.getBookCopy().getBarcode() : null)
                .bookId(loan.getBookCopy() != null && loan.getBookCopy().getBook() != null ? loan.getBookCopy().getBook().getId() : null)
                .bookTitle(loan.getBookCopy() != null && loan.getBookCopy().getBook() != null ? loan.getBookCopy().getBook().getTitle() : null)
                .bookHandle(loan.getBookCopy() != null && loan.getBookCopy().getBook() != null ? loan.getBookCopy().getBook().getHandle() : null)
                .borrowDate(loan.getBorrowDate())
                .dueDate(loan.getDueDate())
                .returnDate(loan.getReturnDate())
                .status(loan.getStatus().name())
                .createdAt(loan.getCreatedAt())
                .updatedAt(loan.getUpdatedAt())
                .createdBy(loan.getCreatedBy())
                .updatedBy(loan.getUpdatedBy())
                .build();
    }

    @Transactional
    public void cancelLoanByAdmin(Long id) {
        Loan loan = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found"));

        if (loan.getStatus() != Loan.LoanStatus.ONGOING) {
            throw new BusinessValidationException("Cancel failed", Map.of("loan", "Only ongoing loans can be cancelled"));
        }

        BookCopy copy = loan.getBookCopy();
        if (copy != null) {
            if (copy.getStatus() == BookCopy.Status.LOANED) {
                copy.setStatus(BookCopy.Status.AVAILABLE);
                bookCopyRepository.save(copy);
            }
            Book book = copy.getBook();
            if (book != null) {
                book.setAvailableCopies(book.getAvailableCopies() + 1);
                bookRepository.save(book);
            }
        }

        loan.setStatus(Loan.LoanStatus.CANCELLED);
        repository.save(loan);
    }

    // ==========================================
    // MEMBER / USER METHODS
    // ==========================================

    @Transactional(readOnly = true)
    public Page<LoanPublicResponse> getMyLoans(String email, Loan.LoanStatus status, Pageable pageable) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Page<Loan> page = (status != null)
                ? repository.findByUserAndStatus(user, status, pageable)
                : repository.findByUser(user, pageable);

        return page.map(loan -> LoanPublicResponse.builder()
                .loanCode(loan.getLoanCode())
                .bookTitle(loan.getBookCopy() != null && loan.getBookCopy().getBook() != null ? loan.getBookCopy().getBook().getTitle() : null)
                .bookHandle(loan.getBookCopy() != null && loan.getBookCopy().getBook() != null ? loan.getBookCopy().getBook().getHandle() : null)
                .bookCover(loan.getBookCopy() != null && loan.getBookCopy().getBook() != null ? loan.getBookCopy().getBook().getCover() : null)
                .barcode(loan.getBookCopy() != null ? loan.getBookCopy().getBarcode() : null)
                .borrowDate(loan.getBorrowDate())
                .dueDate(loan.getDueDate())
                .returnDate(loan.getReturnDate())
                .status(loan.getStatus() != null ? loan.getStatus().name() : null)
                .build());
    }

    @Transactional(readOnly = true)
    public LoanPublicResponse getMyLoanDetail(String email, String loanCode) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Loan loan = repository.findByLoanCodeAndUser(loanCode, user)
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found"));

        return LoanPublicResponse.builder()
                .loanCode(loan.getLoanCode())
                .bookTitle(loan.getBookCopy() != null && loan.getBookCopy().getBook() != null ? loan.getBookCopy().getBook().getTitle() : null)
                .bookHandle(loan.getBookCopy() != null && loan.getBookCopy().getBook() != null ? loan.getBookCopy().getBook().getHandle() : null)
                .bookCover(loan.getBookCopy() != null && loan.getBookCopy().getBook() != null ? loan.getBookCopy().getBook().getCover() : null)
                .barcode(loan.getBookCopy() != null ? loan.getBookCopy().getBarcode() : null)
                .borrowDate(loan.getBorrowDate())
                .dueDate(loan.getDueDate())
                .returnDate(loan.getReturnDate())
                .status(loan.getStatus() != null ? loan.getStatus().name() : null)
                .build();
    }

    private String generateUniqueLoanCode() {
        String datePart = LocalDate.now().format(DATE_FORMATTER);
        String code;
        do {
            StringBuilder sb = new StringBuilder("LN").append(datePart);
            for (int i = 0; i < 4; i++) {
                sb.append(ALPHANUMERIC.charAt(RANDOM.nextInt(ALPHANUMERIC.length())));
            }
            code = sb.toString();
        } while (repository.findByLoanCode(code).isPresent());
        return code;
    }
}
