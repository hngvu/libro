package soqe.libro.server.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import soqe.libro.server.entity.*;
import soqe.libro.server.repository.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Component
@RequiredArgsConstructor
@Slf4j
public class DatabaseSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final GenreRepository genreRepository;
    private final PublisherRepository publisherRepository;
    private final AuthorRepository authorRepository;
    private final BookRepository bookRepository;
    private final BookCopyRepository bookCopyRepository;
    private final MembershipPlanRepository membershipPlanRepository;
    private final UserSubscriptionRepository userSubscriptionRepository;
    private final ReservationRepository reservationRepository;
    private final LoanRepository loanRepository;
    private final FineRepository fineRepository;
    private final SystemSettingRepository systemSettingRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        seedSystemSettings();
        seedMembershipPlans();

        if (userRepository.count() > 0) {
            log.info("Database users already seeded. Checking loan data population...");
            return;
        }

        log.info("Seeding initial database data with strict plan quotas...");

        // 1. Users
        User admin = User.builder()
                .email("admin@libro.com")
                .password(passwordEncoder.encode("admin123"))
                .fullName("System Administrator")
                .phone("0901234567")
                .role(User.Role.ADMIN)
                .status(User.Status.ACTIVE)
                .build();

        User librarian = User.builder()
                .email("lucia@libro.com")
                .password(passwordEncoder.encode("lucia123"))
                .fullName("Lucia Lilia")
                .phone("0902345678")
                .role(User.Role.LIBRARIAN)
                .status(User.Status.ACTIVE)
                .build();

        User memberBin = User.builder()
                .email("bin@libro.com")
                .password(passwordEncoder.encode("chubin123"))
                .fullName("Bin Chu")
                .phone("0903456789")
                .role(User.Role.MEMBER)
                .status(User.Status.ACTIVE)
                .build();

        User memberAlice = User.builder()
                .email("alice@libro.com")
                .password(passwordEncoder.encode("alice123"))
                .fullName("Alice Wonderland")
                .phone("0904567890")
                .role(User.Role.MEMBER)
                .status(User.Status.ACTIVE)
                .build();

        User memberFree = User.builder()
                .email("free@libro.com")
                .password(passwordEncoder.encode("free123"))
                .fullName("Frank Free")
                .phone("0905678901")
                .role(User.Role.MEMBER)
                .status(User.Status.ACTIVE)
                .build();

        userRepository.saveAll(List.of(admin, librarian, memberBin, memberAlice, memberFree));

        // 2. User Subscriptions matching Plan Quotas
        MembershipPlan standardPlan = membershipPlanRepository.findByCode("STANDARD").orElse(null);
        MembershipPlan vipPlan = membershipPlanRepository.findByCode("VIP").orElse(null);

        if (standardPlan != null && !standardPlan.getPrices().isEmpty()) {
            MembershipPlanPrice standardMonthlyPrice = standardPlan.getPrices().get(0);
            UserSubscription binSub = UserSubscription.builder()
                    .user(memberBin)
                    .plan(standardPlan)
                    .planPrice(standardMonthlyPrice)
                    .status(UserSubscription.SubscriptionStatus.ACTIVE)
                    .stripeCustomerId("cus_seed_bin_standard_123")
                    .stripeSubscriptionId("sub_seed_bin_standard_123")
                    .startDate(LocalDateTime.now().minusMonths(2))
                    .currentPeriodStart(LocalDateTime.now().minusDays(10))
                    .currentPeriodEnd(LocalDateTime.now().plusDays(20))
                    .cancelAtPeriodEnd(false)
                    .build();
            userSubscriptionRepository.save(binSub);
            log.info("Seeded STANDARD subscription for bin@libro.com");
        }

        if (vipPlan != null && !vipPlan.getPrices().isEmpty()) {
            MembershipPlanPrice vipYearlyPrice = vipPlan.getPrices().stream()
                    .filter(p -> p.getBillingCycle() == MembershipPlanPrice.BillingCycle.YEARLY)
                    .findFirst()
                    .orElse(vipPlan.getPrices().get(0));

            UserSubscription aliceSub = UserSubscription.builder()
                    .user(memberAlice)
                    .plan(vipPlan)
                    .planPrice(vipYearlyPrice)
                    .status(UserSubscription.SubscriptionStatus.ACTIVE)
                    .stripeCustomerId("cus_seed_alice_vip_456")
                    .stripeSubscriptionId("sub_seed_alice_vip_456")
                    .startDate(LocalDateTime.now().minusMonths(4))
                    .currentPeriodStart(LocalDateTime.now().minusMonths(1))
                    .currentPeriodEnd(LocalDateTime.now().plusMonths(11))
                    .cancelAtPeriodEnd(false)
                    .build();
            userSubscriptionRepository.save(aliceSub);
            log.info("Seeded VIP subscription for alice@libro.com");
        }

        // 3. Genres
        Genre techGenre = Genre.builder()
                .name("Information Technology")
                .handle("information-technology")
                .description("Books specialized in programming, technology, and computer science")
                .status(Genre.Status.ACTIVE)
                .build();

        Genre sciFiGenre = Genre.builder()
                .name("Science Fiction")
                .handle("science-fiction")
                .description("Speculative fiction dealing with imaginative and futuristic concepts")
                .status(Genre.Status.ACTIVE)
                .build();

        Genre classicGenre = Genre.builder()
                .name("Classic Literature")
                .handle("classic-literature")
                .description("World-renowned literary masterpieces")
                .status(Genre.Status.ACTIVE)
                .build();

        genreRepository.saveAll(List.of(techGenre, sciFiGenre, classicGenre));

        // 4. Publishers
        Publisher oreilly = Publisher.builder()
                .name("O'Reilly Media")
                .handle("oreilly-media")
                .address("Sebastopol, CA, United States")
                .website("https://www.oreilly.com")
                .status(Publisher.Status.ACTIVE)
                .build();

        Publisher penguin = Publisher.builder()
                .name("Penguin Random House")
                .handle("penguin-random-house")
                .address("1745 Broadway, New York, NY")
                .website("https://www.penguinrandomhouse.com")
                .status(Publisher.Status.ACTIVE)
                .build();

        publisherRepository.saveAll(List.of(oreilly, penguin));

        // 5. Authors
        Author uncleBob = Author.builder()
                .name("Robert C. Martin")
                .handle("robert-c-martin")
                .biography("Uncle Bob is a legendary software craftsman and author of Clean Code and Clean Architecture.")
                .image("https://images.gr-assets.com/authors/1490470967p8/45372.jpg")
                .status(Author.Status.ACTIVE)
                .build();

        Author rowling = Author.builder()
                .name("J.K. Rowling")
                .handle("j-k-rowling")
                .biography("British author best known for the Harry Potter fantasy series.")
                .image("https://images.gr-assets.com/authors/1596216614p8/1077326.jpg")
                .status(Author.Status.ACTIVE)
                .build();

        authorRepository.saveAll(List.of(uncleBob, rowling));

        // 6. Books
        Book cleanCode = Book.builder()
                .title("Clean Code: A Handbook of Agile Software Craftsmanship")
                .handle("BK000001")
                .slug("clean-code-a-handbook-of-agile-software-craftsmanship")
                .isbn("9780132350884")
                .publicationYear(2008)
                .edition("1st Edition")
                .format(Book.Format.PAPERBACK)
                .pageCount(464)
                .language("English")
                .description("Even bad code can function. But if code isn't clean, it can bring a development organization to its knees.")
                .cover("https://images-na.ssl-images-amazon.com/images/I/41xShlnTZTL.jpg")
                .totalCopies(3)
                .availableCopies(1)
                .publisher(oreilly)
                .authors(Set.of(uncleBob))
                .genres(Set.of(techGenre))
                .status(Book.Status.ACTIVE)
                .build();

        Book harryPotter = Book.builder()
                .title("Harry Potter and the Philosopher's Stone")
                .handle("BK000002")
                .slug("harry-potter-and-the-philosopher-stone")
                .isbn("9780590353427")
                .publicationYear(1997)
                .edition("First US Edition")
                .format(Book.Format.HARDCOVER)
                .pageCount(223)
                .language("English")
                .description("The first novel in the Harry Potter series and Rowling's debut novel.")
                .cover("https://images-na.ssl-images-amazon.com/images/I/51UoqRAxwEL.jpg")
                .totalCopies(2)
                .availableCopies(0)
                .publisher(penguin)
                .authors(Set.of(rowling))
                .genres(Set.of(sciFiGenre, classicGenre))
                .status(Book.Status.ACTIVE)
                .build();

        Book designPatterns = Book.builder()
                .title("Design Patterns: Elements of Reusable Object-Oriented Software")
                .handle("BK000003")
                .slug("design-patterns-elements-of-reusable-object-oriented-software")
                .isbn("9780201633610")
                .publicationYear(1994)
                .edition("1st Edition")
                .format(Book.Format.HARDCOVER)
                .pageCount(395)
                .language("English")
                .description("Capturing a wealth of experience about the design of object-oriented software.")
                .cover("https://images-na.ssl-images-amazon.com/images/I/51szD9HC9pL.jpg")
                .totalCopies(2)
                .availableCopies(0)
                .publisher(oreilly)
                .authors(Set.of(uncleBob))
                .genres(Set.of(techGenre))
                .status(Book.Status.ACTIVE)
                .build();

        bookRepository.saveAll(List.of(cleanCode, harryPotter, designPatterns));

        // 7. Book Copies
        // Clean Code Copies: BC1 (Loaned to Bin), BC2 (Available), BC3 (Loaned to Free)
        BookCopy cc1 = BookCopy.builder().barcode("BC00000001").status(BookCopy.Status.LOANED).location("Shelf A-1").book(cleanCode).build();
        BookCopy cc2 = BookCopy.builder().barcode("BC00000002").status(BookCopy.Status.AVAILABLE).location("Shelf A-1").book(cleanCode).build();
        BookCopy cc3 = BookCopy.builder().barcode("BC00000003").status(BookCopy.Status.LOANED).location("Shelf A-2").book(cleanCode).build();

        // Harry Potter Copies: HP1 (Loaned to Bin - Overdue), HP2 (Loaned to Alice)
        BookCopy hp1 = BookCopy.builder().barcode("BC00000004").status(BookCopy.Status.LOANED).location("Shelf B-1").book(harryPotter).build();
        BookCopy hp2 = BookCopy.builder().barcode("BC00000005").status(BookCopy.Status.LOANED).location("Shelf B-2").book(harryPotter).build();

        // Design Patterns Copies: DP1 (Loaned to Alice), DP2 (Reserved for Bin)
        BookCopy dp1 = BookCopy.builder().barcode("BC00000006").status(BookCopy.Status.LOANED).location("Shelf A-3").book(designPatterns).build();
        BookCopy dp2 = BookCopy.builder().barcode("BC00000007").status(BookCopy.Status.RESERVED).location("Shelf A-3").book(designPatterns).build();

        bookCopyRepository.saveAll(List.of(cc1, cc2, cc3, hp1, hp2, dp1, dp2));

        // 8. Loans strictly adhering to user plan quotas
        List<Loan> loansToSeed = new ArrayList<>();

        // bin@libro.com (STANDARD: max 3 active loans, 14 days, max 1 renewal)
        // Loan 1: Ongoing (Clean Code - BC1), borrow 4 days ago, due in 10 days (14-day duration, 0 renewals)
        Loan binLoan1 = Loan.builder()
                .loanCode("LN260910A101")
                .user(memberBin)
                .bookCopy(cc1)
                .borrowDate(LocalDate.now().minusDays(4))
                .dueDate(LocalDate.now().plusDays(10))
                .status(Loan.LoanStatus.ONGOING)
                .renewalCount(0)
                .build();

        // Loan 2: Overdue (Harry Potter - HP1), borrowed 25 days ago, renewed once (+14 days), due 5 days ago
        Loan binLoan2 = Loan.builder()
                .loanCode("LN260820B202")
                .user(memberBin)
                .bookCopy(hp1)
                .borrowDate(LocalDate.now().minusDays(25))
                .dueDate(LocalDate.now().minusDays(5))
                .status(Loan.LoanStatus.OVERDUE)
                .renewalCount(1)
                .build();

        // Loan 3: Returned in past (Clean Code - BC2)
        Loan binLoan3 = Loan.builder()
                .loanCode("LN260815C303")
                .user(memberBin)
                .bookCopy(cc2)
                .borrowDate(LocalDate.now().minusDays(30))
                .dueDate(LocalDate.now().minusDays(16))
                .returnDate(LocalDate.now().minusDays(18))
                .status(Loan.LoanStatus.RETURNED)
                .renewalCount(0)
                .build();

        // alice@libro.com (VIP: max 8 active loans, 30 days, max 3 renewals)
        // Loan 4: Ongoing (Harry Potter - HP2), borrowed 15 days ago, 30-day plan duration, due in 15 days
        Loan aliceLoan1 = Loan.builder()
                .loanCode("LN260901D404")
                .user(memberAlice)
                .bookCopy(hp2)
                .borrowDate(LocalDate.now().minusDays(15))
                .dueDate(LocalDate.now().plusDays(15))
                .status(Loan.LoanStatus.ONGOING)
                .renewalCount(0)
                .build();

        // Loan 5: Ongoing (Design Patterns - DP1), borrowed 10 days ago, renewed once (+30 days), due in 50 days
        Loan aliceLoan2 = Loan.builder()
                .loanCode("LN260905E505")
                .user(memberAlice)
                .bookCopy(dp1)
                .borrowDate(LocalDate.now().minusDays(10))
                .dueDate(LocalDate.now().plusDays(50))
                .status(Loan.LoanStatus.ONGOING)
                .renewalCount(1)
                .build();

        // free@libro.com (FREE: max 1 active loan, 7 days, max 0 renewals)
        // Loan 6: Ongoing (Clean Code - BC3), borrowed 2 days ago, 7-day duration, due in 5 days
        Loan freeLoan1 = Loan.builder()
                .loanCode("LN260915F606")
                .user(memberFree)
                .bookCopy(cc3)
                .borrowDate(LocalDate.now().minusDays(2))
                .dueDate(LocalDate.now().plusDays(5))
                .status(Loan.LoanStatus.ONGOING)
                .renewalCount(0)
                .build();

        loansToSeed.addAll(List.of(binLoan1, binLoan2, binLoan3, aliceLoan1, aliceLoan2, freeLoan1));
        loanRepository.saveAll(loansToSeed);

        // 9. Fines (5 days overdue on binLoan2: 5 * $0.50 = $2.50)
        Fine overdueFine = Fine.builder()
                .fineCode("FN260912A001")
                .user(memberBin)
                .loan(binLoan2)
                .book(harryPotter)
                .amount(new BigDecimal("2.50"))
                .reason(Fine.FineReason.OVERDUE)
                .daysOverdue(5)
                .status(Fine.FineStatus.PENDING)
                .build();

        Fine paidFine = Fine.builder()
                .fineCode("FN260810B002")
                .user(memberAlice)
                .book(cleanCode)
                .amount(new BigDecimal("10.00"))
                .reason(Fine.FineReason.DAMAGED_BOOK)
                .status(Fine.FineStatus.PAID)
                .paymentMethod(Fine.PaymentMethod.STRIPE)
                .paidAt(LocalDateTime.now().minusDays(20))
                .stripePaymentIntentId("pi_seed_mock_123")
                .build();

        fineRepository.saveAll(List.of(overdueFine, paidFine));

        // 10. Reservations (Ready for pickup on Design Patterns)
        Reservation sampleRes = Reservation.builder()
                .reservationCode("RES202609120001")
                .user(memberBin)
                .book(designPatterns)
                .bookCopy(dp2)
                .status(Reservation.ReservationStatus.READY_FOR_PICKUP)
                .reservedAt(LocalDateTime.now().minusDays(1))
                .pickupDeadline(LocalDate.now().plusDays(2))
                .queuePosition(1)
                .build();
        reservationRepository.save(sampleRes);

        log.info("Database seeding completed successfully with {} loans and 2 subscriptions!", loansToSeed.size());
    }

    private void seedSystemSettings() {
        createSettingIfAbsent("fine.daily_rate", "0.50", "Mức phạt trễ hạn mỗi ngày (USD)", "FINES", SystemSetting.DataType.NUMBER);
        createSettingIfAbsent("fine.default_lost_fee", "20.00", "Phí phạt mặc định khi mất sách (USD)", "FINES", SystemSetting.DataType.NUMBER);
        createSettingIfAbsent("fine.default_damaged_fee", "10.00", "Phí phạt mặc định khi làm hỏng sách (USD)", "FINES", SystemSetting.DataType.NUMBER);
        createSettingIfAbsent("fine.max_cap", "50.00", "Mức phạt trần tối đa (USD)", "FINES", SystemSetting.DataType.NUMBER);

        createSettingIfAbsent("loan.default_days", "7", "Thời hạn mượn sách mặc định (ngày)", "CIRCULATION", SystemSetting.DataType.NUMBER);
        createSettingIfAbsent("loan.standard_renewal_days", "14", "Số ngày gia hạn mỗi lần (ngày)", "CIRCULATION", SystemSetting.DataType.NUMBER);
        createSettingIfAbsent("loan.default_max_active", "1", "Số sách mượn tối đa cho tài khoản Free", "CIRCULATION", SystemSetting.DataType.NUMBER);

        createSettingIfAbsent("reservation.default_hold_days", "3", "Thời gian giữ sách đặt trước tại quầy (ngày)", "RESERVATIONS", SystemSetting.DataType.NUMBER);
        createSettingIfAbsent("reservation.max_active", "3", "Số lượt đặt trước tối đa mỗi độc giả", "RESERVATIONS", SystemSetting.DataType.NUMBER);
    }

    private void createSettingIfAbsent(String key, String value, String desc, String category, SystemSetting.DataType type) {
        if (systemSettingRepository.findBySettingKey(key).isEmpty()) {
            systemSettingRepository.save(SystemSetting.builder()
                    .settingKey(key)
                    .settingValue(value)
                    .description(desc)
                    .category(category)
                    .dataType(type)
                    .build());
            log.info("Seeded system setting: {} = {}", key, value);
        }
    }

    private void seedMembershipPlans() {
        if (membershipPlanRepository.findByCode("FREE").isEmpty()) {
            MembershipPlan freePlan = MembershipPlan.builder()
                    .name("Free Reader")
                    .code("FREE")
                    .description("Basic library access for occasional readers. 1 active book at a time.")
                    .maxActiveLoans(1)
                    .loanDurationDays(7)
                    .maxRenewals(0)
                    .status(MembershipPlan.Status.ACTIVE)
                    .prices(new ArrayList<>())
                    .build();

            freePlan.getPrices().add(MembershipPlanPrice.builder()
                    .plan(freePlan)
                    .billingCycle(MembershipPlanPrice.BillingCycle.MONTHLY)
                    .price(BigDecimal.ZERO)
                    .build());

            membershipPlanRepository.save(freePlan);
            log.info("Seeded membership plan: FREE");
        }

        if (membershipPlanRepository.findByCode("STANDARD").isEmpty()) {
            MembershipPlan standardPlan = MembershipPlan.builder()
                    .name("Standard Reader")
                    .code("STANDARD")
                    .description("Perfect for regular book lovers. Up to 3 active books with 14-day borrowing and 1 renewal.")
                    .maxActiveLoans(3)
                    .loanDurationDays(14)
                    .maxRenewals(1)
                    .status(MembershipPlan.Status.ACTIVE)
                    .prices(new ArrayList<>())
                    .build();

            standardPlan.getPrices().add(MembershipPlanPrice.builder()
                    .plan(standardPlan)
                    .billingCycle(MembershipPlanPrice.BillingCycle.MONTHLY)
                    .price(new BigDecimal("5.00"))
                    .build());

            standardPlan.getPrices().add(MembershipPlanPrice.builder()
                    .plan(standardPlan)
                    .billingCycle(MembershipPlanPrice.BillingCycle.YEARLY)
                    .price(new BigDecimal("50.00"))
                    .build());

            membershipPlanRepository.save(standardPlan);
            log.info("Seeded membership plan: STANDARD");
        }

        if (membershipPlanRepository.findByCode("VIP").isEmpty()) {
            MembershipPlan vipPlan = MembershipPlan.builder()
                    .name("VIP Reader")
                    .code("VIP")
                    .description("Unlimited passion for reading. Up to 8 active books, 30-day loans, and 3 renewals.")
                    .maxActiveLoans(8)
                    .loanDurationDays(30)
                    .maxRenewals(3)
                    .status(MembershipPlan.Status.ACTIVE)
                    .prices(new ArrayList<>())
                    .build();

            vipPlan.getPrices().add(MembershipPlanPrice.builder()
                    .plan(vipPlan)
                    .billingCycle(MembershipPlanPrice.BillingCycle.MONTHLY)
                    .price(new BigDecimal("10.00"))
                    .build());

            vipPlan.getPrices().add(MembershipPlanPrice.builder()
                    .plan(vipPlan)
                    .billingCycle(MembershipPlanPrice.BillingCycle.YEARLY)
                    .price(new BigDecimal("100.00"))
                    .build());

            membershipPlanRepository.save(vipPlan);
            log.info("Seeded membership plan: VIP");
        }
    }
}

