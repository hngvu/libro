package soqe.libro.server;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class LibroServerApplicationTests {

    @org.springframework.beans.factory.annotation.Autowired
    private soqe.libro.server.controller.AuthController authController;

    @org.springframework.beans.factory.annotation.Autowired
    private soqe.libro.server.controller.UserController userController;

    @Test
    void contextLoads() {
    }

    @Test
    void testRegisterEndpoint() {
        soqe.libro.server.dto.RegisterRequest req = new soqe.libro.server.dto.RegisterRequest(
            "empera@castle.org", "password123", "Hoang Vu", null
        );
        authController.register(req);
    }

    @Test
    void testLoginAndGetMe() {
        var loginRes = authController.login(new soqe.libro.server.dto.LoginRequest("admin@libro.com", "admin123"));
        org.junit.jupiter.api.Assertions.assertNotNull(loginRes.getBody());
        org.junit.jupiter.api.Assertions.assertNotNull(loginRes.getBody().getData());

        // Test getCurrentUser with email
        var userResByEmail = userController.getCurrentUser(() -> "admin@libro.com");
        org.junit.jupiter.api.Assertions.assertNotNull(userResByEmail.getBody());
        org.junit.jupiter.api.Assertions.assertEquals("admin@libro.com", userResByEmail.getBody().email());
    }

    @org.springframework.beans.factory.annotation.Autowired
    private soqe.libro.server.service.LoanService loanService;

    @org.springframework.beans.factory.annotation.Autowired
    private soqe.libro.server.repository.UserRepository userRepository;

    @org.springframework.beans.factory.annotation.Autowired
    private soqe.libro.server.repository.BookRepository bookRepository;

    @org.springframework.beans.factory.annotation.Autowired
    private soqe.libro.server.repository.BookCopyRepository bookCopyRepository;

    @org.springframework.beans.factory.annotation.Autowired
    private soqe.libro.server.repository.ReservationRepository reservationRepository;

    @Test
    void testAdminLoanReservationValidationAndAutoFulfill() {
        // Create test book with 1 copy
        soqe.libro.server.entity.Book book = soqe.libro.server.entity.Book.builder()
                .title("Test Hold Book " + System.currentTimeMillis())
                .handle(String.format("H%07d", System.currentTimeMillis() % 10000000))
                .slug("test-hold-book-" + System.currentTimeMillis())
                .isbn("ISBN-" + System.currentTimeMillis())
                .status(soqe.libro.server.entity.Book.Status.ACTIVE)
                .totalCopies(1)
                .availableCopies(0) // reserved
                .build();
        book = bookRepository.save(book);

        soqe.libro.server.entity.BookCopy copy = soqe.libro.server.entity.BookCopy.builder()
                .book(book)
                .barcode("BC-TEST-" + System.currentTimeMillis())
                .status(soqe.libro.server.entity.BookCopy.Status.AVAILABLE)
                .build();
        copy = bookCopyRepository.save(copy);

        // Patron A with a READY_FOR_PICKUP reservation
        soqe.libro.server.entity.User patronA = soqe.libro.server.entity.User.builder()
                .email("patronA-" + System.currentTimeMillis() + "@test.com")
                .fullName("Patron A")
                .password("pwd")
                .role(soqe.libro.server.entity.User.Role.MEMBER)
                .status(soqe.libro.server.entity.User.Status.ACTIVE)
                .build();
        patronA = userRepository.save(patronA);

        // Walk-in Patron C
        soqe.libro.server.entity.User patronC = soqe.libro.server.entity.User.builder()
                .email("patronC-" + System.currentTimeMillis() + "@test.com")
                .fullName("Patron C")
                .password("pwd")
                .role(soqe.libro.server.entity.User.Role.MEMBER)
                .status(soqe.libro.server.entity.User.Status.ACTIVE)
                .build();
        patronC = userRepository.save(patronC);

        soqe.libro.server.entity.Reservation hold = soqe.libro.server.entity.Reservation.builder()
                .reservationCode("RES-" + System.currentTimeMillis())
                .user(patronA)
                .book(book)
                .status(soqe.libro.server.entity.Reservation.ReservationStatus.READY_FOR_PICKUP)
                .reservedAt(java.time.LocalDateTime.now())
                .pickupDeadline(java.time.LocalDate.now().plusDays(3))
                .build();
        hold = reservationRepository.save(hold);

        // Attempt 1: Walk-in Patron C attempts to borrow copy -> Should be REJECTED
        soqe.libro.server.dto.LoanCreateRequest reqC = new soqe.libro.server.dto.LoanCreateRequest(
                patronC.getId(), copy.getId(), null, java.time.LocalDate.now().plusDays(7)
        );
        final Long copyId = copy.getId();
        final Long patronCId = patronC.getId();
        org.junit.jupiter.api.Assertions.assertThrows(
                soqe.libro.server.exception.BusinessValidationException.class,
                () -> loanService.createLoanByAdmin(new soqe.libro.server.dto.LoanCreateRequest(
                        patronCId, copyId, null, java.time.LocalDate.now().plusDays(7)))
        );

        // Attempt 2: Patron A (who holds the reservation) borrows copy -> Should SUCCEED and FULFILL hold
        soqe.libro.server.dto.LoanCreateRequest reqA = new soqe.libro.server.dto.LoanCreateRequest(
                patronA.getId(), copy.getId(), null, java.time.LocalDate.now().plusDays(7)
        );
        var loanRes = loanService.createLoanByAdmin(reqA);
        org.junit.jupiter.api.Assertions.assertNotNull(loanRes);
        org.junit.jupiter.api.Assertions.assertEquals("ONGOING", loanRes.status());

        // Verify hold is now FULFILLED
        var updatedHold = reservationRepository.findById(hold.getId()).orElseThrow();
        org.junit.jupiter.api.Assertions.assertEquals(soqe.libro.server.entity.Reservation.ReservationStatus.FULFILLED, updatedHold.getStatus());
        org.junit.jupiter.api.Assertions.assertNotNull(updatedHold.getFulfilledAt());
        org.junit.jupiter.api.Assertions.assertEquals(copy.getId(), updatedHold.getBookCopy().getId());
    }

    @Test
    void testConcurrentAtomicBorrowNoOverselling() throws InterruptedException {
        // Create a book with only 1 physical copy available
        long timestamp = System.currentTimeMillis();
        soqe.libro.server.entity.Book book = soqe.libro.server.entity.Book.builder()
                .title("Concurrent Race Book " + timestamp)
                .handle(String.format("CR%06d", (int) (timestamp % 1000000)))
                .slug("concurrent-race-book-" + timestamp)
                .isbn("ISBN-RACE-" + timestamp)
                .status(soqe.libro.server.entity.Book.Status.ACTIVE)
                .totalCopies(1)
                .availableCopies(1)
                .build();
        book = bookRepository.save(book);

        soqe.libro.server.entity.BookCopy copy = soqe.libro.server.entity.BookCopy.builder()
                .book(book)
                .barcode("BC-RACE-" + timestamp)
                .status(soqe.libro.server.entity.BookCopy.Status.AVAILABLE)
                .build();
        copy = bookCopyRepository.save(copy);

        // Prepare 5 concurrent users trying to borrow the single copy simultaneously
        int threadCount = 5;
        java.util.List<soqe.libro.server.entity.User> patrons = new java.util.ArrayList<>();
        for (int i = 0; i < threadCount; i++) {
            soqe.libro.server.entity.User u = soqe.libro.server.entity.User.builder()
                    .email("race-user-" + i + "-" + timestamp + "@test.com")
                    .fullName("Race User " + i)
                    .password("pwd")
                    .role(soqe.libro.server.entity.User.Role.MEMBER)
                    .status(soqe.libro.server.entity.User.Status.ACTIVE)
                    .build();
            patrons.add(userRepository.save(u));
        }

        java.util.concurrent.ExecutorService executor = java.util.concurrent.Executors.newFixedThreadPool(threadCount);
        java.util.concurrent.CountDownLatch readyLatch = new java.util.concurrent.CountDownLatch(threadCount);
        java.util.concurrent.CountDownLatch startLatch = new java.util.concurrent.CountDownLatch(1);
        java.util.concurrent.atomic.AtomicInteger successCount = new java.util.concurrent.atomic.AtomicInteger(0);
        java.util.concurrent.atomic.AtomicInteger failureCount = new java.util.concurrent.atomic.AtomicInteger(0);

        final Long targetBookId = book.getId();

        for (soqe.libro.server.entity.User patron : patrons) {
            executor.submit(() -> {
                readyLatch.countDown();
                try {
                    startLatch.await();
                    loanService.borrowBookByPatron(patron.getEmail(), targetBookId, null);
                    successCount.incrementAndGet();
                } catch (soqe.libro.server.exception.BusinessValidationException e) {
                    failureCount.incrementAndGet();
                } catch (Exception e) {
                    failureCount.incrementAndGet();
                }
            });
        }

        readyLatch.await();
        startLatch.countDown(); // Fire all 5 threads simultaneously
        executor.shutdown();
        executor.awaitTermination(10, java.util.concurrent.TimeUnit.SECONDS);

        // Exactly 1 user must succeed; the other 4 must be rejected (No overselling!)
        org.junit.jupiter.api.Assertions.assertEquals(1, successCount.get(), "Exactly one user should succeed in borrowing the single available copy");
        org.junit.jupiter.api.Assertions.assertEquals(4, failureCount.get(), "Remaining users should fail due to atomic lock / out of stock");

        // Verify DB integrity
        var finalBook = bookRepository.findById(targetBookId).orElseThrow();
        org.junit.jupiter.api.Assertions.assertEquals(0, finalBook.getAvailableCopies());

        var finalCopy = bookCopyRepository.findById(copy.getId()).orElseThrow();
        org.junit.jupiter.api.Assertions.assertEquals(soqe.libro.server.entity.BookCopy.Status.LOANED, finalCopy.getStatus());
    }
}
