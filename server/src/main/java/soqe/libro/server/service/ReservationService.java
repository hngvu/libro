package soqe.libro.server.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import soqe.libro.server.dto.ReservationResponse;
import soqe.libro.server.entity.*;
import soqe.libro.server.exception.BusinessValidationException;
import soqe.libro.server.exception.ResourceNotFoundException;
import soqe.libro.server.repository.*;
import soqe.libro.server.specification.ReservationSpecification;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import org.springframework.util.StringUtils;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReservationService {

    public static final int DEFAULT_MAX_ACTIVE_RESERVATIONS = 3;
    public static final int DEFAULT_PICKUP_HOLD_DAYS = 3;
    public static final int DEFAULT_FREE_LOAN_DAYS = 7;
    public static final int DEFAULT_FREE_MAX_ACTIVE_LOANS = 1;

    private static final String ALPHANUMERIC = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMdd");

    private final ReservationRepository reservationRepository;
    private final UserRepository userRepository;
    private final BookRepository bookRepository;
    private final BookCopyRepository bookCopyRepository;
    private final LoanRepository loanRepository;
    private final FineRepository fineRepository;
    private final UserSubscriptionRepository userSubscriptionRepository;

    @Transactional(readOnly = true)
    public boolean hasPendingReservations(Book book) {
        return reservationRepository.countByBookAndStatus(book, Reservation.ReservationStatus.PENDING) > 0
                || reservationRepository.countByBookAndStatus(book, Reservation.ReservationStatus.READY_FOR_PICKUP) > 0;
    }

    @Transactional
    public ReservationResponse createReservation(String email, Long bookId, String bookHandle) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Book book;
        if (bookId != null) {
            book = bookRepository.findById(bookId)
                    .orElseThrow(() -> new ResourceNotFoundException("Book not found with ID: " + bookId));
        } else if (bookHandle != null) {
            book = bookRepository.findByHandle(bookHandle)
                    .orElseThrow(() -> new ResourceNotFoundException("Book not found with handle: " + bookHandle));
        } else {
            throw new BusinessValidationException("Reservation failed", Map.of("book", "Book ID or handle is required"));
        }

        return createReservationForUser(user, book);
    }

    @Transactional
    public ReservationResponse createReservationForUser(User user, Book book) {
        Map<String, String> errors = new HashMap<>();

        if (user.getStatus() != User.Status.ACTIVE) {
            errors.put("user", "User account is " + user.getStatus() + " and cannot place reservations");
        }

        // 1. Membership plan limit check
        int maxActiveLoans = DEFAULT_FREE_MAX_ACTIVE_LOANS;
        var activeSubOpt = userSubscriptionRepository.findTopByUserAndStatusOrderByCurrentPeriodEndDesc(
                user, UserSubscription.SubscriptionStatus.ACTIVE);
        if (activeSubOpt.isPresent() && activeSubOpt.get().getPlan() != null) {
            maxActiveLoans = activeSubOpt.get().getPlan().getMaxActiveLoans();
        }

        long activeLoansCount = loanRepository.countByUserAndStatus(user, Loan.LoanStatus.ONGOING);
        long activeResCount = reservationRepository.countByUserAndStatusIn(user,
                List.of(Reservation.ReservationStatus.PENDING, Reservation.ReservationStatus.READY_FOR_PICKUP));

        if (activeLoansCount + activeResCount >= maxActiveLoans) {
            errors.put("limit", "You have reached your limit of " + maxActiveLoans +
                    " active borrowed book(s) and reservation(s) under your current membership plan. Return a book or upgrade your plan to reserve more.");
        }

        // 2. Check active reservations quota
        if (activeResCount >= DEFAULT_MAX_ACTIVE_RESERVATIONS) {
            errors.put("reservation", "You have reached the limit of " + DEFAULT_MAX_ACTIVE_RESERVATIONS + " active book reservations");
        }

        // 3. Check overdue loans
        boolean hasOverdue = loanRepository.existsByUserAndStatus(user, Loan.LoanStatus.OVERDUE)
                || loanRepository.existsByUserAndStatusAndDueDateBefore(user, Loan.LoanStatus.ONGOING, LocalDate.now());
        if (hasOverdue) {
            errors.put("overdue", "You currently have overdue books that must be returned before placing new reservations");
        }

        // 4. Check unpaid fines
        if (fineRepository.existsByUserAndStatus(user, Fine.FineStatus.PENDING)) {
            errors.put("fines", "You have outstanding unpaid fines. Please settle your fines before placing a hold reservation");
        }

        if (book.getStatus() != Book.Status.ACTIVE) {
            errors.put("book", "This book is not currently available for reservation");
        }

        // 5. Check if user is already borrowing a copy of this book
        if (loanRepository.existsByUserAndBookCopy_BookAndStatus(user, book, Loan.LoanStatus.ONGOING)) {
            errors.put("loan", "You are currently borrowing a copy of this book");
        }

        // 6. Check if user already has an active reservation for this book
        if (reservationRepository.existsByUserAndBookAndStatusIn(user, book,
                List.of(Reservation.ReservationStatus.PENDING, Reservation.ReservationStatus.READY_FOR_PICKUP))) {
            errors.put("duplicate", "You already have an active reservation for this book");
        }

        if (!errors.isEmpty()) {
            throw new BusinessValidationException("Reservation failed", errors);
        }

        String code = generateUniqueReservationCode();
        Reservation reservation;

        // Title-level Hold: Check if there are available copies on the open shelf
        boolean hasAvailableCopies = book.getAvailableCopies() != null && book.getAvailableCopies() > 0;
        if (!hasAvailableCopies) {
            hasAvailableCopies = bookCopyRepository.countByBookAndStatus(book, BookCopy.Status.AVAILABLE) > 0;
        }

        if (hasAvailableCopies) {
            if (book.getAvailableCopies() != null && book.getAvailableCopies() > 0) {
                book.setAvailableCopies(book.getAvailableCopies() - 1);
                bookRepository.save(book);
            }

            reservation = Reservation.builder()
                    .reservationCode(code)
                    .user(user)
                    .book(book)
                    .bookCopy(null) // Title-level hold: assigned by librarian upon physical pickup
                    .status(Reservation.ReservationStatus.READY_FOR_PICKUP)
                    .reservedAt(LocalDateTime.now())
                    .pickupDeadline(LocalDate.now().plusDays(DEFAULT_PICKUP_HOLD_DAYS))
                    .queuePosition(0)
                    .build();
        } else {
            // Place on waitlist
            long pendingCount = reservationRepository.countByBookAndStatus(book, Reservation.ReservationStatus.PENDING);
            int queuePosition = (int) pendingCount + 1;

            reservation = Reservation.builder()
                    .reservationCode(code)
                    .user(user)
                    .book(book)
                    .bookCopy(null)
                    .status(Reservation.ReservationStatus.PENDING)
                    .reservedAt(LocalDateTime.now())
                    .queuePosition(queuePosition)
                    .build();
        }

        reservation = reservationRepository.save(reservation);
        log.info("Created reservation {} for user {} on book {} (status: {})",
                code, user.getEmail(), book.getTitle(), reservation.getStatus());

        return toResponse(reservation);
    }

    @Transactional(readOnly = true)
    public Page<ReservationResponse> getMyReservations(String email, Reservation.ReservationStatus status, Pageable pageable) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Page<Reservation> page = (status != null)
                ? reservationRepository.findByUserAndStatus(user, status, pageable)
                : reservationRepository.findByUser(user, pageable);

        return page.map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<ReservationResponse> getReservationsForAdmin(
            String keyword,
            List<Reservation.ReservationStatus> statuses,
            List<Long> userIds,
            List<Long> bookIds,
            Pageable pageable) {

        return reservationRepository.findAll(
                ReservationSpecification.filterMulti(keyword, statuses, userIds, bookIds), pageable
        ).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public ReservationResponse getReservationDetail(Long id) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found with ID: " + id));
        return toResponse(reservation);
    }

    @Transactional
    public ReservationResponse cancelReservationByPatron(String email, Long id, String reason) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found with ID: " + id));

        if (!reservation.getUser().getId().equals(user.getId())) {
            throw new BusinessValidationException("Action forbidden", Map.of("reservation", "You can only cancel your own reservations"));
        }

        return doCancelReservation(reservation, reason != null ? reason : "Cancelled by patron");
    }

    @Transactional
    public ReservationResponse cancelReservationByAdmin(Long id, String reason) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found with ID: " + id));

        return doCancelReservation(reservation, reason != null ? reason : "Cancelled by librarian");
    }

    private ReservationResponse doCancelReservation(Reservation reservation, String reason) {
        if (reservation.getStatus() != Reservation.ReservationStatus.PENDING &&
                reservation.getStatus() != Reservation.ReservationStatus.READY_FOR_PICKUP) {
            throw new BusinessValidationException("Cancel failed",
                    Map.of("status", "Only PENDING or READY_FOR_PICKUP reservations can be cancelled"));
        }

        Book book = reservation.getBook();

        releaseReservationHold(reservation);

        reservation.setStatus(Reservation.ReservationStatus.CANCELLED);
        reservation.setCancellationReason(reason);
        reservation.setQueuePosition(null);
        reservation.setBookCopy(null);
        reservationRepository.save(reservation);

        // Recalculate queue positions for remaining pending reservations
        recalculateQueuePositions(book);

        return toResponse(reservation);
    }

    @Transactional
    public ReservationResponse markReadyForPickupManual(Long reservationId, Long bookCopyId) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found"));

        if (reservation.getStatus() != Reservation.ReservationStatus.PENDING) {
            throw new BusinessValidationException("Action failed",
                    Map.of("status", "Only PENDING reservations can be marked ready for pickup"));
        }

        BookCopy copy = null;
        if (bookCopyId != null) {
            copy = bookCopyRepository.findById(bookCopyId)
                    .orElseThrow(() -> new ResourceNotFoundException("Book copy not found"));
            if (!copy.getBook().getId().equals(reservation.getBook().getId())) {
                throw new BusinessValidationException("Copy mismatch",
                        Map.of("bookCopyId", "Book copy does not belong to reserved book title"));
            }
            if (copy.getStatus() != BookCopy.Status.AVAILABLE) {
                throw new BusinessValidationException("Copy unavailable",
                        Map.of("bookCopyId", "Book copy status must be AVAILABLE to reserve"));
            }
        } else {
            // Find any available copy of this book
            List<BookCopy> availableCopies = bookCopyRepository.findByBookAndStatus(reservation.getBook(), BookCopy.Status.AVAILABLE);
            if (availableCopies.isEmpty()) {
                throw new BusinessValidationException("No copy available",
                        Map.of("copies", "No physical copy of this title is currently AVAILABLE"));
            }
            copy = availableCopies.get(0);
        }

        copy.setStatus(BookCopy.Status.RESERVED);
        bookCopyRepository.save(copy);

        Book book = copy.getBook();
        if (book != null && book.getAvailableCopies() != null && book.getAvailableCopies() > 0) {
            book.setAvailableCopies(book.getAvailableCopies() - 1);
            bookRepository.save(book);
        }

        reservation.setBookCopy(copy);
        reservation.setStatus(Reservation.ReservationStatus.READY_FOR_PICKUP);
        reservation.setPickupDeadline(LocalDate.now().plusDays(DEFAULT_PICKUP_HOLD_DAYS));
        reservation.setQueuePosition(0);
        reservationRepository.save(reservation);

        recalculateQueuePositions(reservation.getBook());

        return toResponse(reservation);
    }

    @Transactional
    public ReservationResponse fulfillReservation(Long reservationId) {
        return fulfillReservation(reservationId, null, null);
    }

    @Transactional
    public ReservationResponse fulfillReservation(Long reservationId, String barcode, Long bookCopyId) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found with ID: " + reservationId));

        if (reservation.getStatus() != Reservation.ReservationStatus.READY_FOR_PICKUP) {
            throw new BusinessValidationException("Fulfill failed",
                    Map.of("status", "Only READY_FOR_PICKUP reservations can be fulfilled"));
        }

        Book book = reservation.getBook();
        BookCopy copy = null;

        if (StringUtils.hasText(barcode)) {
            copy = bookCopyRepository.findByBarcode(barcode.trim())
                    .orElseThrow(() -> new BusinessValidationException("Fulfill failed",
                            Map.of("barcode", "No book copy found with barcode: " + barcode.trim())));
            if (!copy.getBook().getId().equals(book.getId())) {
                throw new BusinessValidationException("Fulfill failed",
                        Map.of("barcode", "Scanned copy ('" + copy.getBarcode() + "') belongs to '" + copy.getBook().getTitle() + "', not '" + book.getTitle() + "'"));
            }
            boolean isAssignedToThis = reservation.getBookCopy() != null && reservation.getBookCopy().getId().equals(copy.getId());
            if (!isAssignedToThis && copy.getStatus() != BookCopy.Status.AVAILABLE) {
                throw new BusinessValidationException("Fulfill failed",
                        Map.of("barcode", "Book copy " + barcode.trim() + " is currently " + copy.getStatus() + " and not available for checkout"));
            }
        } else if (bookCopyId != null) {
            copy = bookCopyRepository.findById(bookCopyId)
                    .orElseThrow(() -> new BusinessValidationException("Fulfill failed",
                            Map.of("bookCopyId", "No book copy found with ID: " + bookCopyId)));
            if (!copy.getBook().getId().equals(book.getId())) {
                throw new BusinessValidationException("Fulfill failed",
                        Map.of("bookCopyId", "Selected copy belongs to another book title"));
            }
            boolean isAssignedToThis = reservation.getBookCopy() != null && reservation.getBookCopy().getId().equals(copy.getId());
            if (!isAssignedToThis && copy.getStatus() != BookCopy.Status.AVAILABLE) {
                throw new BusinessValidationException("Fulfill failed",
                        Map.of("bookCopyId", "Book copy is currently " + copy.getStatus() + " and not available for checkout"));
            }
        } else if (reservation.getBookCopy() != null) {
            copy = reservation.getBookCopy();
        } else {
            // Auto-detect an available copy
            List<BookCopy> availableCopies = bookCopyRepository.findByBookAndStatus(book, BookCopy.Status.AVAILABLE);
            if (!availableCopies.isEmpty()) {
                copy = availableCopies.get(0);
            } else {
                throw new BusinessValidationException("Fulfill failed",
                        Map.of("copy", "No AVAILABLE physical copy found for this title. Please scan or select a copy to fulfill."));
            }
        }

        // If this reservation previously had a different copy locked, release the old one
        if (reservation.getBookCopy() != null && !reservation.getBookCopy().getId().equals(copy.getId())) {
            BookCopy oldCopy = reservation.getBookCopy();
            if (oldCopy.getStatus() == BookCopy.Status.RESERVED) {
                oldCopy.setStatus(BookCopy.Status.AVAILABLE);
                bookCopyRepository.save(oldCopy);
            }
        }

        User user = reservation.getUser();

        // Calculate loan due date & verify active loans limit based on user's active membership plan
        int loanDurationDays = DEFAULT_FREE_LOAN_DAYS;
        int maxActiveLoans = DEFAULT_FREE_MAX_ACTIVE_LOANS;
        if (user != null) {
            var activeSubOpt = userSubscriptionRepository.findTopByUserAndStatusOrderByCurrentPeriodEndDesc(
                    user, UserSubscription.SubscriptionStatus.ACTIVE);
            if (activeSubOpt.isPresent() && activeSubOpt.get().getPlan() != null) {
                loanDurationDays = activeSubOpt.get().getPlan().getLoanDurationDays();
                maxActiveLoans = activeSubOpt.get().getPlan().getMaxActiveLoans();
            }

            long activeLoansCount = loanRepository.countByUserAndStatus(user, Loan.LoanStatus.ONGOING);
            if (activeLoansCount >= maxActiveLoans) {
                throw new BusinessValidationException("Borrowing limit reached",
                        Map.of("limit", "User has reached the limit of " + maxActiveLoans +
                                " active borrowed books under their current membership plan. Return an existing book before checking out."));
            }
        }

        LocalDate borrowDate = LocalDate.now();
        LocalDate dueDate = borrowDate.plusDays(loanDurationDays);

        // Convert copy into active Loan
        copy.setStatus(BookCopy.Status.LOANED);
        bookCopyRepository.save(copy);

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
        loanRepository.save(loan);

        // Update reservation to FULFILLED
        reservation.setBookCopy(copy);
        reservation.setStatus(Reservation.ReservationStatus.FULFILLED);
        reservation.setFulfilledAt(LocalDateTime.now());
        reservation.setQueuePosition(null);
        reservationRepository.save(reservation);

        log.info("Fulfilled reservation {} into loan {} for user {} with copy {}",
                reservation.getReservationCode(), loanCode, user != null ? user.getEmail() : "unknown", copy.getBarcode());

        return toResponse(reservation);
    }

    /**
     * Hook called from LoanService when a loan is returned.
     * Checks if there are pending reservations for this book.
     * If yes, assigns the copy to the next patron in queue and returns true.
     * If no, returns false so LoanService can mark copy AVAILABLE and increment availableCopies.
     */
    @Transactional
    public boolean assignCopyFromReturn(BookCopy copy) {
        if (copy == null || copy.getBook() == null) return false;

        Book book = copy.getBook();
        List<Reservation> pending = reservationRepository.findByBookAndStatusOrderByReservedAtAsc(
                book, Reservation.ReservationStatus.PENDING);

        if (pending.isEmpty()) {
            return false;
        }

        Reservation nextInQueue = pending.get(0);
        nextInQueue.setBookCopy(copy);
        nextInQueue.setStatus(Reservation.ReservationStatus.READY_FOR_PICKUP);
        nextInQueue.setPickupDeadline(LocalDate.now().plusDays(DEFAULT_PICKUP_HOLD_DAYS));
        nextInQueue.setQueuePosition(0);
        reservationRepository.save(nextInQueue);

        copy.setStatus(BookCopy.Status.RESERVED);
        bookCopyRepository.save(copy);

        log.info("Assigned returned copy {} to reservation {} for patron {}",
                copy.getBarcode(), nextInQueue.getReservationCode(), nextInQueue.getUser().getEmail());

        recalculateQueuePositions(book);
        return true;
    }

    /**
     * Process hold shelf pickup deadlines that have expired.
     */
    @Transactional
    public int processExpiredReservations() {
        List<Reservation> expiredList = reservationRepository.findByStatusAndPickupDeadlineBefore(
                Reservation.ReservationStatus.READY_FOR_PICKUP, LocalDate.now());

        int count = 0;
        for (Reservation res : expiredList) {
            Book book = res.getBook();

            releaseReservationHold(res);

            res.setStatus(Reservation.ReservationStatus.EXPIRED);
            res.setCancellationReason("Pickup deadline passed (" + res.getPickupDeadline() + ")");
            res.setBookCopy(null);
            res.setQueuePosition(null);
            reservationRepository.save(res);
            count++;

            log.info("Reservation {} expired for user {}", res.getReservationCode(), res.getUser().getEmail());

            recalculateQueuePositions(book);
        }

        return count;
    }

    private void releaseReservationHold(Reservation reservation) {
        Book book = reservation.getBook();
        BookCopy assignedCopy = reservation.getBookCopy();
        boolean wasReadyForPickup = reservation.getStatus() == Reservation.ReservationStatus.READY_FOR_PICKUP;

        if (wasReadyForPickup) {
            List<Reservation> pending = reservationRepository.findByBookAndStatusOrderByReservedAtAsc(
                    book, Reservation.ReservationStatus.PENDING);

            if (!pending.isEmpty()) {
                Reservation next = pending.get(0);
                next.setStatus(Reservation.ReservationStatus.READY_FOR_PICKUP);
                next.setPickupDeadline(LocalDate.now().plusDays(DEFAULT_PICKUP_HOLD_DAYS));
                next.setQueuePosition(0);
                if (assignedCopy != null) {
                    next.setBookCopy(assignedCopy);
                    assignedCopy.setStatus(BookCopy.Status.RESERVED);
                    bookCopyRepository.save(assignedCopy);
                }
                reservationRepository.save(next);
            } else {
                if (assignedCopy != null) {
                    assignedCopy.setStatus(BookCopy.Status.AVAILABLE);
                    bookCopyRepository.save(assignedCopy);
                }
                if (book != null) {
                    int currentAvailable = book.getAvailableCopies() != null ? book.getAvailableCopies() : 0;
                    book.setAvailableCopies(currentAvailable + 1);
                    bookRepository.save(book);
                }
            }
        } else if (assignedCopy != null) {
            assignedCopy.setStatus(BookCopy.Status.AVAILABLE);
            bookCopyRepository.save(assignedCopy);
        }
    }

    private void recalculateQueuePositions(Book book) {
        List<Reservation> pending = reservationRepository.findByBookAndStatusOrderByReservedAtAsc(
                book, Reservation.ReservationStatus.PENDING);

        for (int i = 0; i < pending.size(); i++) {
            Reservation r = pending.get(i);
            int newPos = i + 1;
            if (r.getQueuePosition() == null || r.getQueuePosition() != newPos) {
                r.setQueuePosition(newPos);
                reservationRepository.save(r);
            }
        }
    }

    private String generateUniqueReservationCode() {
        String datePart = LocalDate.now().format(DATE_FORMATTER);
        String code;
        do {
            StringBuilder sb = new StringBuilder("RES").append(datePart);
            for (int i = 0; i < 4; i++) {
                sb.append(ALPHANUMERIC.charAt(RANDOM.nextInt(ALPHANUMERIC.length())));
            }
            code = sb.toString();
        } while (reservationRepository.existsByReservationCode(code));
        return code;
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
        } while (loanRepository.findByLoanCode(code).isPresent());
        return code;
    }

    private ReservationResponse toResponse(Reservation r) {
        var book = r.getBook();
        List<String> authorNames = null;
        if (book != null && book.getAuthors() != null) {
            authorNames = book.getAuthors().stream()
                    .map(Author::getName)
                    .toList();
        }

        return ReservationResponse.builder()
                .id(r.getId())
                .reservationCode(r.getReservationCode())
                .userId(r.getUser() != null ? r.getUser().getId() : null)
                .userEmail(r.getUser() != null ? r.getUser().getEmail() : null)
                .userFullName(r.getUser() != null ? r.getUser().getFullName() : null)
                .userPhone(r.getUser() != null ? r.getUser().getPhone() : null)
                .bookId(book != null ? book.getId() : null)
                .bookTitle(book != null ? book.getTitle() : null)
                .bookHandle(book != null ? book.getHandle() : null)
                .bookCover(book != null ? book.getCover() : null)
                .authors(authorNames)
                .bookCopyId(r.getBookCopy() != null ? r.getBookCopy().getId() : null)
                .barcode(r.getBookCopy() != null ? r.getBookCopy().getBarcode() : null)
                .location(r.getBookCopy() != null ? r.getBookCopy().getLocation() : null)
                .status(r.getStatus() != null ? r.getStatus().name() : null)
                .reservedAt(r.getReservedAt())
                .pickupDeadline(r.getPickupDeadline())
                .fulfilledAt(r.getFulfilledAt())
                .queuePosition(r.getQueuePosition())
                .cancellationReason(r.getCancellationReason())
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .build();
    }
}
