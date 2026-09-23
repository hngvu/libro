package soqe.libro.server.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import soqe.libro.server.dto.*;
import soqe.libro.server.entity.Book;
import soqe.libro.server.entity.BookCopy;
import soqe.libro.server.entity.Loan;
import soqe.libro.server.entity.Reservation;
import soqe.libro.server.entity.User;
import soqe.libro.server.exception.BusinessValidationException;
import soqe.libro.server.exception.ResourceNotFoundException;
import soqe.libro.server.repository.BookCopyRepository;
import soqe.libro.server.repository.BookRepository;
import soqe.libro.server.repository.LoanRepository;
import soqe.libro.server.repository.ReservationRepository;
import soqe.libro.server.repository.UserRepository;
import soqe.libro.server.specification.LoanSpecification;

import org.springframework.util.StringUtils;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class LoanService {

    public static final int DEFAULT_FREE_MAX_ACTIVE_LOANS = 1;
    public static final int DEFAULT_FREE_LOAN_DAYS = 7;
    public static final int DEFAULT_FREE_MAX_RENEWALS = 0;
    public static final int STANDARD_RENEWAL_DAYS = 14;

    private static final String ALPHANUMERIC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyMMdd");

    private final LoanRepository repository;
    private final UserRepository userRepository;
    private final BookCopyRepository bookCopyRepository;
    private final BookRepository bookRepository;
    private final FineService fineService;
    private final soqe.libro.server.repository.FineRepository fineRepository;
    private final soqe.libro.server.repository.UserSubscriptionRepository userSubscriptionRepository;
    private final ReservationService reservationService;
    private final ReservationRepository reservationRepository;
    private final MetricsService metricsService;

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
            Boolean hasRenewals,
            Pageable pageable) {
        return searchLoansForAdminMulti(
                keyword,
                status != null ? java.util.List.of(status) : null,
                userId != null ? java.util.List.of(userId) : null,
                bookCopyId != null ? java.util.List.of(bookCopyId) : null,
                isOverdue,
                hasRenewals,
                pageable
        );
    }

    @Transactional(readOnly = true)
    public Page<LoanResponse> searchLoansForAdminMulti(
            String keyword,
            java.util.List<Loan.LoanStatus> statuses,
            java.util.List<Long> userIds,
            java.util.List<Long> bookCopyIds,
            Boolean isOverdue,
            Boolean hasRenewals,
            Pageable pageable) {

        return repository.findAll(LoanSpecification.filterMulti(keyword, statuses, userIds, bookCopyIds, isOverdue, hasRenewals), pageable)
                .map(this::toAdminResponse);
    }

    @Transactional(readOnly = true)
    public LoanResponse getLoanForAdmin(Long id) {
        Loan loan = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found"));

        return toAdminResponse(loan);
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

                // Check active loans limit (dynamic based on membership tier)
                int maxActiveLoans = DEFAULT_FREE_MAX_ACTIVE_LOANS;
                var activeSubOpt = userSubscriptionRepository.findTopByUserAndStatusOrderByCurrentPeriodEndDesc(
                        user, soqe.libro.server.entity.UserSubscription.SubscriptionStatus.ACTIVE);
                if (activeSubOpt.isPresent() && activeSubOpt.get().getPlan() != null) {
                    maxActiveLoans = activeSubOpt.get().getPlan().getMaxActiveLoans();
                }

                long activeLoansCount = repository.countByUserAndStatus(user, Loan.LoanStatus.ONGOING);
                if (activeLoansCount >= maxActiveLoans) {
                    errors.put("user", "User has reached the limit of " + maxActiveLoans + " active borrowed books under their current membership plan");
                }

                // Check overdue loans
                boolean hasOverdue = repository.existsByUserAndStatus(user, Loan.LoanStatus.OVERDUE)
                        || repository.existsByUserAndStatusAndDueDateBefore(user, Loan.LoanStatus.ONGOING, LocalDate.now());
                if (hasOverdue) {
                    errors.put("user", "User currently has overdue books that must be returned before borrowing new books");
                }

                // Check unpaid fines
                boolean hasUnpaidFines = fineRepository.existsByUserAndStatus(user, soqe.libro.server.entity.Fine.FineStatus.PENDING);
                if (hasUnpaidFines) {
                    errors.put("user", "User currently has unpaid library fines that must be settled before borrowing new books");
                }
            }
        }

        BookCopy copy = null;
        if (StringUtils.hasText(req.barcode())) {
            var copyOpt = bookCopyRepository.findByBarcode(req.barcode().trim());
            if (copyOpt.isEmpty()) {
                errors.put("barcode", "Book copy not found with barcode: " + req.barcode().trim());
            } else {
                copy = copyOpt.get();
            }
        } else if (req.bookCopyId() != null) {
            var copyOpt = bookCopyRepository.findById(req.bookCopyId());
            if (copyOpt.isEmpty()) {
                errors.put("bookCopyId", "Book copy not found with ID: " + req.bookCopyId());
            } else {
                copy = copyOpt.get();
            }
        } else {
            errors.put("bookCopy", "Either barcode or bookCopyId must be provided");
        }

        Reservation userReservationToFulfill = null;

        if (copy != null) {
            Book book = copy.getBook();

            // 1. Check if this specific physical copy is assigned to an active hold
            var specificHoldOpt = reservationRepository.findFirstByBookCopyAndStatus(copy, Reservation.ReservationStatus.READY_FOR_PICKUP);
            if (specificHoldOpt.isPresent()) {
                Reservation assignedHold = specificHoldOpt.get();
                if (user != null && assignedHold.getUser().getId().equals(user.getId())) {
                    userReservationToFulfill = assignedHold;
                } else {
                    String patronName = assignedHold.getUser().getFullName() != null
                            ? assignedHold.getUser().getFullName()
                            : assignedHold.getUser().getEmail();
                    errors.put("bookCopy", "This physical copy (barcode: " + copy.getBarcode() +
                            ") is specifically reserved for patron '" + patronName + "' and is waiting for pickup");
                }
            }

            // 2. If not locked to a specific copy, check if this user has an active hold (READY_FOR_PICKUP or PENDING) for this book
            if (userReservationToFulfill == null && user != null && book != null) {
                var userHoldOpt = reservationRepository.findFirstByUserAndBookAndStatusInOrderByReservedAtAsc(
                        user, book, List.of(Reservation.ReservationStatus.READY_FOR_PICKUP, Reservation.ReservationStatus.PENDING));
                if (userHoldOpt.isPresent()) {
                    userReservationToFulfill = userHoldOpt.get();
                }
            }

            // 3. If user does NOT have a hold, protect held copies from walk-in patrons
            if (userReservationToFulfill == null && book != null) {
                long physicalAvailable = bookCopyRepository.countByBookAndStatus(book, BookCopy.Status.AVAILABLE);
                long readyHolds = reservationRepository.countByBookAndStatus(book, Reservation.ReservationStatus.READY_FOR_PICKUP);
                if (physicalAvailable <= readyHolds) {
                    errors.put("bookCopy", "All available copies of '" + book.getTitle() +
                            "' are currently held for patrons with active reservations waiting for pickup. Cannot issue to a walk-in patron");
                }
            }

            // 4. Validate physical copy status (allow if it's the copy already assigned to user's reservation, or must be AVAILABLE)
            boolean isAssignedToThisUser = userReservationToFulfill != null
                    && userReservationToFulfill.getBookCopy() != null
                    && userReservationToFulfill.getBookCopy().getId().equals(copy.getId());

            if (!isAssignedToThisUser && copy.getStatus() != BookCopy.Status.AVAILABLE) {
                errors.put("bookCopy", "Book copy is currently " + copy.getStatus() + " and not available for borrowing");
            }

            // 5. Check if user is already borrowing a copy of the same book/work
            if (user != null && book != null) {
                boolean alreadyBorrowing = false;

                if (StringUtils.hasText(book.getWork())) {
                    alreadyBorrowing = repository.existsByUserAndBookCopy_Book_WorkAndStatus(user, book.getWork(), Loan.LoanStatus.ONGOING);
                } else {
                    alreadyBorrowing = repository.existsByUserAndBookCopy_BookAndStatus(user, book, Loan.LoanStatus.ONGOING);
                }

                if (alreadyBorrowing) {
                    errors.put("book", "User is already borrowing a copy of this book/work ('" + book.getTitle() + "'). Must return the current copy before borrowing another edition or copy");
                }
            }
        }

        if (!errors.isEmpty()) {
            throw new BusinessValidationException("Loan creation failed", errors);
        }

        // If this reservation previously had a different copy locked, release the old one
        if (userReservationToFulfill != null && userReservationToFulfill.getBookCopy() != null
                && !userReservationToFulfill.getBookCopy().getId().equals(copy.getId())) {
            BookCopy oldCopy = userReservationToFulfill.getBookCopy();
            if (oldCopy.getStatus() == BookCopy.Status.RESERVED) {
                oldCopy.setStatus(BookCopy.Status.AVAILABLE);
                bookCopyRepository.save(oldCopy);
            }
        }

        // Update book copy and book counters
        copy.setStatus(BookCopy.Status.LOANED);
        Book book = copy.getBook();
        if (book != null) {
            boolean wasAlreadyDecremented = userReservationToFulfill != null
                    && userReservationToFulfill.getStatus() == Reservation.ReservationStatus.READY_FOR_PICKUP;
            if (!wasAlreadyDecremented) {
                book.setAvailableCopies(Math.max(0, book.getAvailableCopies() - 1));
                bookRepository.save(book);
            }
        }
        bookCopyRepository.save(copy);

        LocalDate borrowDate = LocalDate.now();
        int loanDurationDays = DEFAULT_FREE_LOAN_DAYS;
        if (user != null) {
            var activeSubOpt = userSubscriptionRepository.findTopByUserAndStatusOrderByCurrentPeriodEndDesc(
                    user, soqe.libro.server.entity.UserSubscription.SubscriptionStatus.ACTIVE);
            if (activeSubOpt.isPresent() && activeSubOpt.get().getPlan() != null) {
                loanDurationDays = activeSubOpt.get().getPlan().getLoanDurationDays();
            }
        }
        LocalDate dueDate = req.dueDate() != null ? req.dueDate() : borrowDate.plusDays(loanDurationDays);
        String loanCode = generateUniqueLoanCode();

        Loan loan = Loan.builder()
                .loanCode(loanCode)
                .user(user)
                .bookCopy(copy)
                .borrowDate(borrowDate)
                .dueDate(dueDate)
                .status(Loan.LoanStatus.ONGOING)
                .renewalCount(0)
                .build();

        loan = repository.save(loan);

        // Auto-fulfill reservation if applicable
        if (userReservationToFulfill != null) {
            boolean wasPending = userReservationToFulfill.getStatus() == Reservation.ReservationStatus.PENDING;
            userReservationToFulfill.setBookCopy(copy);
            userReservationToFulfill.setStatus(Reservation.ReservationStatus.FULFILLED);
            userReservationToFulfill.setFulfilledAt(LocalDateTime.now());
            userReservationToFulfill.setQueuePosition(null);
            reservationRepository.save(userReservationToFulfill);

            if (wasPending && book != null) {
                reservationService.recalculateQueuePositions(book);
            }

            log.info("Auto-fulfilled reservation {} via admin loan creation for user {} with copy {}",
                    userReservationToFulfill.getReservationCode(),
                    user != null ? user.getEmail() : "unknown",
                    copy.getBarcode());
        }

        metricsService.incrementLoansCreated();
        return toAdminResponse(loan);
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
            boolean assignedToReservation = reservationService.assignCopyFromReturn(copy);
            if (!assignedToReservation) {
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
        }

        loan = repository.save(loan);

        // Assess overdue fine if returned after due date
        fineService.assessOverdueFineIfAny(loan, loan.getReturnDate());

        return toAdminResponse(loan);
    }

    @Transactional
    public LoanResponse reportLostByAdmin(Long id, java.math.BigDecimal customAmount) {
        Loan loan = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found"));

        if (loan.getStatus() == Loan.LoanStatus.RETURNED || loan.getStatus() == Loan.LoanStatus.CANCELLED) {
            throw new BusinessValidationException("Action failed", Map.of("loan", "Cannot report lost for a loan that is already " + loan.getStatus()));
        }

        loan.setStatus(Loan.LoanStatus.RETURNED);
        loan.setReturnDate(LocalDate.now());

        BookCopy copy = loan.getBookCopy();
        if (copy != null) {
            copy.setStatus(BookCopy.Status.LOST);
            bookCopyRepository.save(copy);

            Book book = copy.getBook();
            if (book != null) {
                book.setTotalCopies(Math.max(0, book.getTotalCopies() - 1));
                bookRepository.save(book);
            }
        }

        loan = repository.save(loan);
        fineService.createLostBookFine(loan, customAmount);

        return toAdminResponse(loan);
    }

    @Transactional
    public LoanResponse reportDamagedByAdmin(Long id, java.math.BigDecimal customAmount, String note) {
        Loan loan = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found"));

        if (loan.getStatus() == Loan.LoanStatus.RETURNED || loan.getStatus() == Loan.LoanStatus.CANCELLED) {
            throw new BusinessValidationException("Action failed", Map.of("loan", "Cannot report damaged for a loan that is already " + loan.getStatus()));
        }

        loan.setStatus(Loan.LoanStatus.RETURNED);
        loan.setReturnDate(LocalDate.now());

        BookCopy copy = loan.getBookCopy();
        if (copy != null) {
            copy.setStatus(BookCopy.Status.DAMAGED);
            bookCopyRepository.save(copy);
        }

        loan = repository.save(loan);
        fineService.createDamagedBookFine(loan, customAmount, note);

        return toAdminResponse(loan);
    }

    @Transactional
    public LoanResponse renewLoanByAdmin(Long id, LoanRenewRequest req) {
        Loan loan = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found"));

        if (loan.getStatus() != Loan.LoanStatus.ONGOING) {
            throw new BusinessValidationException("Renew failed", Map.of("loan", "Only ongoing loans can be renewed"));
        }

        if (loan.getDueDate().isBefore(LocalDate.now())) {
            throw new BusinessValidationException("Renew failed", Map.of("loan", "Overdue loans cannot be renewed. Sách quá hạn phải được trả trước."));
        }

        if (loan.getUser() != null && loan.getUser().getStatus() != User.Status.ACTIVE) {
            throw new BusinessValidationException("Renew failed", Map.of("user", "User account is not active"));
        }

        int maxRenewals = DEFAULT_FREE_MAX_RENEWALS;
        if (loan.getUser() != null) {
            var activeSubOpt = userSubscriptionRepository.findTopByUserAndStatusOrderByCurrentPeriodEndDesc(
                    loan.getUser(), soqe.libro.server.entity.UserSubscription.SubscriptionStatus.ACTIVE);
            if (activeSubOpt.isPresent() && activeSubOpt.get().getPlan() != null) {
                maxRenewals = activeSubOpt.get().getPlan().getMaxRenewals();
            }
        }

        int currentRenewals = loan.getRenewalCount() != null ? loan.getRenewalCount() : 0;
        if (currentRenewals >= maxRenewals) {
            throw new BusinessValidationException("Renew failed", Map.of("renewalCount", "Loan has reached the maximum renewal limit of " + maxRenewals + " times"));
        }

        // Block renewal if there are pending reservations for this book
        if (loan.getBookCopy() != null && loan.getBookCopy().getBook() != null) {
            if (reservationService.hasPendingReservations(loan.getBookCopy().getBook())) {
                throw new BusinessValidationException("Renew failed", Map.of("reservation", "Cannot renew: other patrons have reserved this book. Please return it on time."));
            }
        }

        if (req != null && req.newDueDate() != null) {
            if (req.newDueDate().isBefore(loan.getDueDate()) || req.newDueDate().isEqual(loan.getDueDate())) {
                throw new BusinessValidationException("Renew failed", Map.of("newDueDate", "New due date must be strictly after current due date"));
            }
            loan.setDueDate(req.newDueDate());
        } else {
            int days = (req != null && req.extensionDays() != null) ? req.extensionDays() : STANDARD_RENEWAL_DAYS;
            loan.setDueDate(loan.getDueDate().plusDays(days));
        }

        loan.setRenewalCount(currentRenewals + 1);
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
                .renewalCount(loan.getRenewalCount())
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
            boolean assignedToReservation = reservationService.assignCopyFromReturn(copy);
            if (!assignedToReservation) {
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

        return page.map(this::toPublicResponse);
    }

    @Transactional(readOnly = true)
    public LoanPublicResponse getMyLoanDetail(String email, String loanCode) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Loan loan = repository.findByLoanCodeAndUser(loanCode, user)
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found"));

        return toPublicResponse(loan);
    }

    @Transactional
    public LoanPublicResponse renewMyLoan(String email, String loanCode) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getStatus() != User.Status.ACTIVE) {
            throw new BusinessValidationException("Renew failed", Map.of("user", "Your account is not active"));
        }

        Loan loan = repository.findByLoanCodeAndUser(loanCode, user)
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found"));

        if (loan.getStatus() != Loan.LoanStatus.ONGOING) {
            throw new BusinessValidationException("Renew failed", Map.of("loan", "Only ongoing loans can be renewed"));
        }

        if (loan.getDueDate().isBefore(LocalDate.now())) {
            throw new BusinessValidationException("Renew failed", Map.of("loan", "Overdue loans cannot be renewed. Please return the book to the library."));
        }

        int maxRenewals = DEFAULT_FREE_MAX_RENEWALS;
        var activeSubOpt = userSubscriptionRepository.findTopByUserAndStatusOrderByCurrentPeriodEndDesc(
                user, soqe.libro.server.entity.UserSubscription.SubscriptionStatus.ACTIVE);
        if (activeSubOpt.isPresent() && activeSubOpt.get().getPlan() != null) {
            maxRenewals = activeSubOpt.get().getPlan().getMaxRenewals();
        }

        int currentRenewals = loan.getRenewalCount() != null ? loan.getRenewalCount() : 0;
        if (currentRenewals >= maxRenewals) {
            throw new BusinessValidationException("Renew failed", Map.of("renewalCount", "You have reached the maximum renewal limit of " + maxRenewals + " times for this loan under your current membership plan"));
        }

        // Block renewal if there are pending reservations for this book
        if (loan.getBookCopy() != null && loan.getBookCopy().getBook() != null) {
            if (reservationService.hasPendingReservations(loan.getBookCopy().getBook())) {
                throw new BusinessValidationException("Renew failed", Map.of("reservation", "Cannot renew: other patrons have reserved this book. Please return it on time."));
            }
        }

        loan.setDueDate(loan.getDueDate().plusDays(STANDARD_RENEWAL_DAYS));
        loan.setRenewalCount(currentRenewals + 1);
        loan = repository.save(loan);

        return toPublicResponse(loan);
    }

    @Transactional
    public LoanPublicResponse borrowBookByPatron(String email, Long bookId, String bookHandle) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getStatus() != User.Status.ACTIVE) {
            throw new BusinessValidationException("Borrowing denied", Map.of("user", "User account is " + user.getStatus() + " and cannot borrow books"));
        }

        Book book = null;
        if (bookId != null) {
            book = bookRepository.findById(bookId).orElse(null);
        } else if (StringUtils.hasText(bookHandle)) {
            book = bookRepository.findByHandle(bookHandle.trim()).orElse(null);
        }

        if (book == null) {
            throw new ResourceNotFoundException("Book not found");
        }

        if (book.getStatus() != Book.Status.ACTIVE) {
            throw new BusinessValidationException("Borrowing denied", Map.of("book", "This book is not currently active in the catalog"));
        }

        // 1. Check user membership active loans limit
        int maxActiveLoans = DEFAULT_FREE_MAX_ACTIVE_LOANS;
        var activeSubOpt = userSubscriptionRepository.findTopByUserAndStatusOrderByCurrentPeriodEndDesc(
                user, soqe.libro.server.entity.UserSubscription.SubscriptionStatus.ACTIVE);
        if (activeSubOpt.isPresent() && activeSubOpt.get().getPlan() != null) {
            maxActiveLoans = activeSubOpt.get().getPlan().getMaxActiveLoans();
        }

        long activeLoansCount = repository.countByUserAndStatus(user, Loan.LoanStatus.ONGOING);
        if (activeLoansCount >= maxActiveLoans) {
            throw new BusinessValidationException("Borrowing limit reached", Map.of(
                    "limit", "You have reached your limit of " + maxActiveLoans + " active borrowed book(s) under your current membership plan. Return a book or upgrade your plan to borrow more."
            ));
        }

        // 2. Check overdue loans
        boolean hasOverdue = repository.existsByUserAndStatus(user, Loan.LoanStatus.OVERDUE)
                || repository.existsByUserAndStatusAndDueDateBefore(user, Loan.LoanStatus.ONGOING, LocalDate.now());
        if (hasOverdue) {
            throw new BusinessValidationException("Borrowing denied", Map.of("overdue", "You currently have overdue books that must be returned before borrowing new titles."));
        }

        // 3. Check unpaid fines
        boolean hasUnpaidFines = fineRepository.existsByUserAndStatus(user, soqe.libro.server.entity.Fine.FineStatus.PENDING);
        if (hasUnpaidFines) {
            throw new BusinessValidationException("Borrowing denied", Map.of("fines", "You have outstanding unpaid library fines. Please settle your fines before borrowing new titles."));
        }

        // 4. Check if user is already borrowing a copy of this book/work
        boolean alreadyBorrowing = false;
        if (StringUtils.hasText(book.getWork())) {
            alreadyBorrowing = repository.existsByUserAndBookCopy_Book_WorkAndStatus(user, book.getWork(), Loan.LoanStatus.ONGOING);
        } else {
            alreadyBorrowing = repository.existsByUserAndBookCopy_BookAndStatus(user, book, Loan.LoanStatus.ONGOING);
        }
        if (alreadyBorrowing) {
            throw new BusinessValidationException("Borrowing denied", Map.of("duplicate", "You are already currently borrowing a copy of this book ('" + book.getTitle() + "'). Please return it before borrowing another copy."));
        }

        // 5. Find an AVAILABLE BookCopy
        java.util.List<BookCopy> availableCopies = bookCopyRepository.findByBookAndStatus(book, BookCopy.Status.AVAILABLE);
        if (availableCopies.isEmpty()) {
            throw new BusinessValidationException("Out of stock", Map.of("copies", "There are currently no available physical copies of this book to borrow. You may place a reservation hold instead."));
        }

        BookCopy copy = availableCopies.get(0);
        copy.setStatus(BookCopy.Status.LOANED);
        bookCopyRepository.save(copy);

        book.setAvailableCopies(Math.max(0, book.getAvailableCopies() - 1));
        bookRepository.save(book);

        LocalDate borrowDate = LocalDate.now();
        int loanDurationDays = DEFAULT_FREE_LOAN_DAYS;
        if (activeSubOpt.isPresent() && activeSubOpt.get().getPlan() != null) {
            loanDurationDays = activeSubOpt.get().getPlan().getLoanDurationDays();
        }
        LocalDate dueDate = borrowDate.plusDays(loanDurationDays);
        String loanCode = generateUniqueLoanCode();

        Loan loan = Loan.builder()
                .loanCode(loanCode)
                .user(user)
                .bookCopy(copy)
                .borrowDate(borrowDate)
                .dueDate(dueDate)
                .status(Loan.LoanStatus.ONGOING)
                .renewalCount(0)
                .build();

        loan = repository.save(loan);
        return toPublicResponse(loan);
    }

    private LoanPublicResponse toPublicResponse(Loan loan) {
        var book = loan.getBookCopy() != null ? loan.getBookCopy().getBook() : null;
        java.util.List<String> authorNames = null;
        if (book != null && book.getAuthors() != null) {
            authorNames = book.getAuthors().stream()
                    .map(soqe.libro.server.entity.Author::getName)
                    .toList();
        }

        return LoanPublicResponse.builder()
                .loanCode(loan.getLoanCode())
                .bookTitle(book != null ? book.getTitle() : null)
                .bookHandle(book != null ? book.getHandle() : null)
                .bookCover(book != null ? book.getCover() : null)
                .authors(authorNames)
                .barcode(loan.getBookCopy() != null ? loan.getBookCopy().getBarcode() : null)
                .borrowDate(loan.getBorrowDate())
                .dueDate(loan.getDueDate())
                .returnDate(loan.getReturnDate())
                .status(loan.getStatus() != null ? loan.getStatus().name() : null)
                .renewalCount(loan.getRenewalCount())
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

    private LoanResponse toAdminResponse(Loan loan) {
        var book = loan.getBookCopy() != null ? loan.getBookCopy().getBook() : null;
        java.util.List<String> authorNames = null;
        if (book != null && book.getAuthors() != null) {
            authorNames = book.getAuthors().stream()
                    .map(soqe.libro.server.entity.Author::getName)
                    .toList();
        }

        return LoanResponse.builder()
                .id(loan.getId())
                .loanCode(loan.getLoanCode())
                .userId(loan.getUser() != null ? loan.getUser().getId() : null)
                .userEmail(loan.getUser() != null ? loan.getUser().getEmail() : null)
                .userFullName(loan.getUser() != null ? loan.getUser().getFullName() : null)
                .bookCopyId(loan.getBookCopy() != null ? loan.getBookCopy().getId() : null)
                .barcode(loan.getBookCopy() != null ? loan.getBookCopy().getBarcode() : null)
                .bookId(book != null ? book.getId() : null)
                .bookTitle(book != null ? book.getTitle() : null)
                .bookHandle(book != null ? book.getHandle() : null)
                .bookCover(book != null ? book.getCover() : null)
                .authors(authorNames)
                .borrowDate(loan.getBorrowDate())
                .dueDate(loan.getDueDate())
                .returnDate(loan.getReturnDate())
                .status(loan.getStatus() != null ? loan.getStatus().name() : null)
                .renewalCount(loan.getRenewalCount())
                .createdAt(loan.getCreatedAt())
                .updatedAt(loan.getUpdatedAt())
                .createdBy(loan.getCreatedBy())
                .updatedBy(loan.getUpdatedBy())
                .build();
    }
}
