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
    private final AuditLogRepository auditLogRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        seedSystemSettings();
        seedMembershipPlans();
        seedAuditLogs();

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
                .description("Books specialized in programming, software engineering, and computer science")
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

        Genre fantasyGenre = Genre.builder()
                .name("Fantasy")
                .handle("fantasy")
                .description("Magical worlds, mythical creatures, and epic adventures")
                .status(Genre.Status.ACTIVE)
                .build();

        Genre selfHelpGenre = Genre.builder()
                .name("Self-Help & Growth")
                .handle("self-help-growth")
                .description("Books on personal development, productivity, and habit building")
                .status(Genre.Status.ACTIVE)
                .build();

        Genre businessGenre = Genre.builder()
                .name("Business & Economics")
                .handle("business-economics")
                .description("Insights on leadership, strategy, finance, and entrepreneurship")
                .status(Genre.Status.ACTIVE)
                .build();

        Genre historyGenre = Genre.builder()
                .name("History & Biography")
                .handle("history-biography")
                .description("Historical events, human evolution, and inspiring biographies")
                .status(Genre.Status.ACTIVE)
                .build();

        Genre mysteryGenre = Genre.builder()
                .name("Mystery & Thriller")
                .handle("mystery-thriller")
                .description("Suspenseful crime, detective investigations, and thriller stories")
                .status(Genre.Status.ACTIVE)
                .build();

        Genre philosophyGenre = Genre.builder()
                .name("Philosophy & Psychology")
                .handle("philosophy-psychology")
                .description("Explorations of human mind, ethics, and philosophical thinking")
                .status(Genre.Status.ACTIVE)
                .build();

        Genre mangaGenre = Genre.builder()
                .name("Manga & Graphic Novels")
                .handle("manga-graphic-novels")
                .description("Japanese manga, graphic novels, and visual storytelling")
                .status(Genre.Status.ACTIVE)
                .build();

        Genre devopsGenre = Genre.builder()
                .name("DevOps & Cloud")
                .handle("devops-cloud")
                .description("Cloud computing, CI/CD, Kubernetes, and DevOps engineering")
                .status(Genre.Status.ACTIVE)
                .build();

        Genre dataAiGenre = Genre.builder()
                .name("AI & Data Science")
                .handle("ai-data-science")
                .description("Machine learning, deep learning, data engineering, and AI algorithms")
                .status(Genre.Status.ACTIVE)
                .build();

        Genre financeGenre = Genre.builder()
                .name("Finance & Investing")
                .handle("finance-investing")
                .description("Personal finance, wealth management, and stock market investing")
                .status(Genre.Status.ACTIVE)
                .build();

        Genre romanceGenre = Genre.builder()
                .name("Romance & Modern Fiction")
                .handle("romance-modern-fiction")
                .description("Love stories, contemporary relationships, and fiction drama")
                .status(Genre.Status.ACTIVE)
                .build();

        genreRepository.saveAll(List.of(
                techGenre, sciFiGenre, classicGenre, fantasyGenre,
                selfHelpGenre, businessGenre, historyGenre, mysteryGenre, philosophyGenre,
                mangaGenre, devopsGenre, dataAiGenre, financeGenre, romanceGenre
        ));

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

        Publisher harperCollins = Publisher.builder()
                .name("HarperCollins Publishers")
                .handle("harpercollins-publishers")
                .address("195 Broadway, New York, NY")
                .website("https://www.harpercollins.com")
                .status(Publisher.Status.ACTIVE)
                .build();

        Publisher simonSchuster = Publisher.builder()
                .name("Simon & Schuster")
                .handle("simon-schuster")
                .address("1230 Avenue of the Americas, New York, NY")
                .website("https://www.simonandschuster.com")
                .status(Publisher.Status.ACTIVE)
                .build();

        Publisher mitPress = Publisher.builder()
                .name("MIT Press")
                .handle("mit-press")
                .address("One Broadway, Cambridge, MA")
                .website("https://mitpress.mit.edu")
                .status(Publisher.Status.ACTIVE)
                .build();

        Publisher addisonWesley = Publisher.builder()
                .name("Addison-Wesley Professional")
                .handle("addison-wesley")
                .address("501 Boylston St, Boston, MA")
                .website("https://www.informit.com/imprint/addisonwesley")
                .status(Publisher.Status.ACTIVE)
                .build();

        Publisher packt = Publisher.builder()
                .name("Packt Publishing")
                .handle("packt-publishing")
                .address("Livery Place, 35 Livery St, Birmingham, UK")
                .website("https://www.packtpub.com")
                .status(Publisher.Status.ACTIVE)
                .build();

        Publisher bloomsbury = Publisher.builder()
                .name("Bloomsbury Publishing")
                .handle("bloomsbury-publishing")
                .address("50 Bedford Square, London, UK")
                .website("https://www.bloomsbury.com")
                .status(Publisher.Status.ACTIVE)
                .build();

        Publisher vintage = Publisher.builder()
                .name("Vintage Books")
                .handle("vintage-books")
                .address("1745 Broadway, New York, NY")
                .website("https://www.penguinrandomhouse.com/imprints/vintage")
                .status(Publisher.Status.ACTIVE)
                .build();

        publisherRepository.saveAll(List.of(
                oreilly, penguin, harperCollins, simonSchuster, mitPress,
                addisonWesley, packt, bloomsbury, vintage
        ));

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
                .biography("British author best known for the world-famous Harry Potter fantasy series.")
                .image("https://images.gr-assets.com/authors/1596216614p8/1077326.jpg")
                .status(Author.Status.ACTIVE)
                .build();

        Author martinFowler = Author.builder()
                .name("Martin Fowler")
                .handle("martin-fowler")
                .biography("British software developer, author, and international speaker on software architecture.")
                .image("https://images.gr-assets.com/authors/1206103328p8/25215.jpg")
                .status(Author.Status.ACTIVE)
                .build();

        Author georgeOrwell = Author.builder()
                .name("George Orwell")
                .handle("george-orwell")
                .biography("English novelist, essayist, journalist and critic known for 1984 and Animal Farm.")
                .image("https://images.gr-assets.com/authors/1588849406p8/1994.jpg")
                .status(Author.Status.ACTIVE)
                .build();

        Author jamesClear = Author.builder()
                .name("James Clear")
                .handle("james-clear")
                .biography("Author and speaker focused on habits, decision making, and continuous improvement.")
                .image("https://images.gr-assets.com/authors/1536773539p8/18260467.jpg")
                .status(Author.Status.ACTIVE)
                .build();

        Author harari = Author.builder()
                .name("Yuval Noah Harari")
                .handle("yuval-noah-harari")
                .biography("Israeli public intellectual, historian and professor in the Department of History.")
                .image("https://images.gr-assets.com/authors/1706691459p8/395812.jpg")
                .status(Author.Status.ACTIVE)
                .build();

        Author walterIsaacson = Author.builder()
                .name("Walter Isaacson")
                .handle("walter-isaacson")
                .biography("American writer, journalist, and professor famous for biographies of Steve Jobs, Einstein, and Da Vinci.")
                .image("https://images.gr-assets.com/authors/1218671607p8/7116.jpg")
                .status(Author.Status.ACTIVE)
                .build();

        Author agathaChristie = Author.builder()
                .name("Agatha Christie")
                .handle("agatha-christie")
                .biography("English writer known for her 66 detective novels and 14 short story collections.")
                .image("https://images.gr-assets.com/authors/1589196924p8/123715.jpg")
                .status(Author.Status.ACTIVE)
                .build();

        Author frankHerbert = Author.builder()
                .name("Frank Herbert")
                .handle("frank-herbert")
                .biography("Critically acclaimed American science fiction author best known for the novel Dune.")
                .image("https://images.gr-assets.com/authors/1647463583p8/58.jpg")
                .status(Author.Status.ACTIVE)
                .build();

        Author geneKim = Author.builder()
                .name("Gene Kim")
                .handle("gene-kim")
                .biography("Multi-award winning CTO, researcher and author of The Phoenix Project and The DevOps Handbook.")
                .image("https://images.gr-assets.com/authors/1359675276p8/6468641.jpg")
                .status(Author.Status.ACTIVE)
                .build();

        Author ericEvans = Author.builder()
                .name("Eric Evans")
                .handle("eric-evans")
                .biography("Thought leader in domain-driven design and author of the seminal book Domain-Driven Design.")
                .image("https://images.gr-assets.com/authors/1247071723p8/42699.jpg")
                .status(Author.Status.ACTIVE)
                .build();

        Author martinKleppmann = Author.builder()
                .name("Martin Kleppmann")
                .handle("martin-kleppmann")
                .biography("Researcher in distributed systems and security at University of Cambridge, author of DDIA.")
                .image("https://images.gr-assets.com/authors/1487847427p8/14877395.jpg")
                .status(Author.Status.ACTIVE)
                .build();

        Author harukiMurakami = Author.builder()
                .name("Haruki Murakami")
                .handle("haruki-murakami")
                .biography("Best-selling Japanese writer whose books have been translated into 50 languages.")
                .image("https://images.gr-assets.com/authors/1601389447p8/3354.jpg")
                .status(Author.Status.ACTIVE)
                .build();

        Author daleCarnegie = Author.builder()
                .name("Dale Carnegie")
                .handle("dale-carnegie")
                .biography("American writer and lecturer, developer of famous courses in self-improvement and salesmanship.")
                .image("https://images.gr-assets.com/authors/1586524945p8/3317.jpg")
                .status(Author.Status.ACTIVE)
                .build();

        Author arthurConanDoyle = Author.builder()
                .name("Arthur Conan Doyle")
                .handle("arthur-conan-doyle")
                .biography("British writer and physician who created the character Sherlock Holmes in 1887.")
                .image("https://images.gr-assets.com/authors/1495009848p8/466.jpg")
                .status(Author.Status.ACTIVE)
                .build();

        Author stephenHawking = Author.builder()
                .name("Stephen Hawking")
                .handle("stephen-hawking")
                .biography("English theoretical physicist, cosmologist, and author who was director of research at Cambridge.")
                .image("https://images.gr-assets.com/authors/1202863955p8/1401.jpg")
                .status(Author.Status.ACTIVE)
                .build();

        authorRepository.saveAll(List.of(
                uncleBob, rowling, martinFowler, georgeOrwell,
                jamesClear, harari, walterIsaacson, agathaChristie, frankHerbert,
                geneKim, ericEvans, martinKleppmann, harukiMurakami, daleCarnegie,
                arthurConanDoyle, stephenHawking
        ));

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
                .cover("https://images-na.ssl-images-amazon.com/images/P/0132350882.01._SCLZZZZZZZ_SX500_.jpg")
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
                .cover("https://images-na.ssl-images-amazon.com/images/P/059035342X.01._SCLZZZZZZZ_SX500_.jpg")
                .totalCopies(2)
                .availableCopies(0)
                .publisher(penguin)
                .authors(Set.of(rowling))
                .genres(Set.of(fantasyGenre, sciFiGenre))
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
                .cover("https://images-na.ssl-images-amazon.com/images/P/0201633612.01._SCLZZZZZZZ_SX500_.jpg")
                .totalCopies(2)
                .availableCopies(0)
                .publisher(oreilly)
                .authors(Set.of(uncleBob, martinFowler))
                .genres(Set.of(techGenre))
                .status(Book.Status.ACTIVE)
                .build();

        Book refactoring = Book.builder()
                .title("Refactoring: Improving the Design of Existing Code")
                .handle("BK000004")
                .slug("refactoring-improving-the-design-of-existing-code")
                .isbn("9780201485677")
                .publicationYear(2018)
                .edition("2nd Edition")
                .format(Book.Format.HARDCOVER)
                .pageCount(448)
                .language("English")
                .description("A guide to refactoring code safely and effectively for cleaner software design.")
                .cover("https://images-na.ssl-images-amazon.com/images/P/0201485672.01._SCLZZZZZZZ_SX500_.jpg")
                .totalCopies(3)
                .availableCopies(3)
                .publisher(oreilly)
                .authors(Set.of(martinFowler))
                .genres(Set.of(techGenre))
                .status(Book.Status.ACTIVE)
                .build();

        Book nineteenEightyFour = Book.builder()
                .title("1984")
                .handle("BK000005")
                .slug("1984-george-orwell")
                .isbn("9780451524935")
                .publicationYear(1949)
                .edition("Reissue Edition")
                .format(Book.Format.PAPERBACK)
                .pageCount(328)
                .language("English")
                .description("A dystopian social science fiction novel and cautionary tale about totalitarianism.")
                .cover("https://images-na.ssl-images-amazon.com/images/P/0451524934.01._SCLZZZZZZZ_SX500_.jpg")
                .totalCopies(3)
                .availableCopies(3)
                .publisher(penguin)
                .authors(Set.of(georgeOrwell))
                .genres(Set.of(classicGenre, sciFiGenre))
                .status(Book.Status.ACTIVE)
                .build();

        Book dune = Book.builder()
                .title("Dune")
                .handle("BK000006")
                .slug("dune-frank-herbert")
                .isbn("9780441172719")
                .publicationYear(1965)
                .edition("Deluxe Edition")
                .format(Book.Format.PAPERBACK)
                .pageCount(688)
                .language("English")
                .description("Set in the distant future amidst a feudal interstellar society, Dune tells the story of young Paul Atreides.")
                .cover("https://images-na.ssl-images-amazon.com/images/P/0441172717.01._SCLZZZZZZZ_SX500_.jpg")
                .totalCopies(2)
                .availableCopies(2)
                .publisher(penguin)
                .authors(Set.of(frankHerbert))
                .genres(Set.of(sciFiGenre, fantasyGenre))
                .status(Book.Status.ACTIVE)
                .build();

        Book atomicHabits = Book.builder()
                .title("Atomic Habits: An Easy & Proven Way to Build Good Habits & Break Bad Ones")
                .handle("BK000007")
                .slug("atomic-habits-james-clear")
                .isbn("9780735211292")
                .publicationYear(2018)
                .edition("1st Edition")
                .format(Book.Format.HARDCOVER)
                .pageCount(320)
                .language("English")
                .description("No matter your goals, Atomic Habits offers a proven framework for improving every day.")
                .cover("https://images-na.ssl-images-amazon.com/images/P/0735211299.01._SCLZZZZZZZ_SX500_.jpg")
                .totalCopies(3)
                .availableCopies(3)
                .publisher(penguin)
                .authors(Set.of(jamesClear))
                .genres(Set.of(selfHelpGenre))
                .status(Book.Status.ACTIVE)
                .build();

        Book sapiens = Book.builder()
                .title("Sapiens: A Brief History of Humankind")
                .handle("BK000008")
                .slug("sapiens-a-brief-history-of-humankind")
                .isbn("9780062316097")
                .publicationYear(2014)
                .edition("Reprint Edition")
                .format(Book.Format.PAPERBACK)
                .pageCount(443)
                .language("English")
                .description("100,000 years ago, at least six human species inhabited the earth. Today there is just one. Us. Homo sapiens.")
                .cover("https://images-na.ssl-images-amazon.com/images/P/0062316095.01._SCLZZZZZZZ_SX500_.jpg")
                .totalCopies(2)
                .availableCopies(2)
                .publisher(harperCollins)
                .authors(Set.of(harari))
                .genres(Set.of(historyGenre, philosophyGenre))
                .status(Book.Status.ACTIVE)
                .build();

        Book steveJobs = Book.builder()
                .title("Steve Jobs: The Exclusive Biography")
                .handle("BK000009")
                .slug("steve-jobs-the-exclusive-biography")
                .isbn("9781451648539")
                .publicationYear(2011)
                .edition("1st Edition")
                .format(Book.Format.HARDCOVER)
                .pageCount(656)
                .language("English")
                .description("Based on more than forty interviews with Jobs conducted over two years.")
                .cover("https://images-na.ssl-images-amazon.com/images/P/1451648537.01._SCLZZZZZZZ_SX500_.jpg")
                .totalCopies(2)
                .availableCopies(2)
                .publisher(simonSchuster)
                .authors(Set.of(walterIsaacson))
                .genres(Set.of(historyGenre, businessGenre))
                .status(Book.Status.ACTIVE)
                .build();

        Book andThenThereWereNone = Book.builder()
                .title("And Then There Were None")
                .handle("BK000010")
                .slug("and-then-there-were-none")
                .isbn("9780062073488")
                .publicationYear(1939)
                .edition("Special Edition")
                .format(Book.Format.PAPERBACK)
                .pageCount(272)
                .language("English")
                .description("Ten strangers are invited to an isolated island by an absent host and killed off one by one.")
                .cover("https://images-na.ssl-images-amazon.com/images/P/0062073486.01._SCLZZZZZZZ_SX500_.jpg")
                .totalCopies(2)
                .availableCopies(2)
                .publisher(harperCollins)
                .authors(Set.of(agathaChristie))
                .genres(Set.of(mysteryGenre))
                .status(Book.Status.ACTIVE)
                .build();

        Book ddia = Book.builder()
                .title("Designing Data-Intensive Applications: The Big Ideas Behind Reliable, Scalable, and Maintainable Systems")
                .handle("BK000011")
                .slug("designing-data-intensive-applications")
                .isbn("9781449373320")
                .publicationYear(2017)
                .edition("1st Edition")
                .format(Book.Format.PAPERBACK)
                .pageCount(616)
                .language("English")
                .description("Data is at the center of many practical problems in system design today.")
                .cover("https://images-na.ssl-images-amazon.com/images/P/1449373321.01._SCLZZZZZZZ_SX500_.jpg")
                .totalCopies(3)
                .availableCopies(3)
                .publisher(oreilly)
                .authors(Set.of(martinKleppmann))
                .genres(Set.of(techGenre, dataAiGenre, devopsGenre))
                .status(Book.Status.ACTIVE)
                .build();

        Book phoenixProject = Book.builder()
                .title("The Phoenix Project: A Novel about IT, DevOps, and Helping Your Business Win")
                .handle("BK000012")
                .slug("the-phoenix-project")
                .isbn("9780988262591")
                .publicationYear(2013)
                .edition("5th Anniversary Edition")
                .format(Book.Format.PAPERBACK)
                .pageCount(432)
                .language("English")
                .description("A riveting novel about an IT manager thrown into an impossible project.")
                .cover("https://images-na.ssl-images-amazon.com/images/P/0988262592.01._SCLZZZZZZZ_SX500_.jpg")
                .totalCopies(2)
                .availableCopies(2)
                .publisher(packt)
                .authors(Set.of(geneKim))
                .genres(Set.of(devopsGenre, businessGenre, techGenre))
                .status(Book.Status.ACTIVE)
                .build();

        Book ddd = Book.builder()
                .title("Domain-Driven Design: Tackling Complexity in the Heart of Software")
                .handle("BK000013")
                .slug("domain-driven-design")
                .isbn("9780321125217")
                .publicationYear(2003)
                .edition("1st Edition")
                .format(Book.Format.HARDCOVER)
                .pageCount(560)
                .language("English")
                .description("Call it domain modeling, object-oriented analysis, or system architecture: DDD is vital.")
                .cover("https://images-na.ssl-images-amazon.com/images/P/0321125215.01._SCLZZZZZZZ_SX500_.jpg")
                .totalCopies(2)
                .availableCopies(2)
                .publisher(addisonWesley)
                .authors(Set.of(ericEvans))
                .genres(Set.of(techGenre))
                .status(Book.Status.ACTIVE)
                .build();

        Book cleanArch = Book.builder()
                .title("Clean Architecture: A Craftsman's Guide to Software Structure and Design")
                .handle("BK000014")
                .slug("clean-architecture")
                .isbn("9780134494166")
                .publicationYear(2017)
                .edition("1st Edition")
                .format(Book.Format.PAPERBACK)
                .pageCount(432)
                .language("English")
                .description("Practical software architecture solutions from legendary software craftsman Robert C. Martin.")
                .cover("https://images-na.ssl-images-amazon.com/images/P/0134494164.01._SCLZZZZZZZ_SX500_.jpg")
                .totalCopies(3)
                .availableCopies(3)
                .publisher(addisonWesley)
                .authors(Set.of(uncleBob))
                .genres(Set.of(techGenre))
                .status(Book.Status.ACTIVE)
                .build();

        Book winFriends = Book.builder()
                .title("How to Win Friends and Influence People")
                .handle("BK000015")
                .slug("how-to-win-friends-and-influence-people")
                .isbn("9780671027032")
                .publicationYear(1936)
                .edition("Revised Edition")
                .format(Book.Format.PAPERBACK)
                .pageCount(288)
                .language("English")
                .description("You can go after the job you want—and get it! You can take the job you have—and improve it!")
                .cover("https://images-na.ssl-images-amazon.com/images/P/0671027034.01._SCLZZZZZZZ_SX500_.jpg")
                .totalCopies(2)
                .availableCopies(2)
                .publisher(simonSchuster)
                .authors(Set.of(daleCarnegie))
                .genres(Set.of(selfHelpGenre, businessGenre))
                .status(Book.Status.ACTIVE)
                .build();

        Book briefHistoryTime = Book.builder()
                .title("A Brief History of Time")
                .handle("BK000016")
                .slug("a-brief-history-of-time")
                .isbn("9780553380163")
                .publicationYear(1988)
                .edition("10th Anniversary Edition")
                .format(Book.Format.PAPERBACK)
                .pageCount(212)
                .language("English")
                .description("A landmark volume in science writing by one of the great minds of our time.")
                .cover("https://images-na.ssl-images-amazon.com/images/P/0553380168.01._SCLZZZZZZZ_SX500_.jpg")
                .totalCopies(2)
                .availableCopies(2)
                .publisher(penguin)
                .authors(Set.of(stephenHawking))
                .genres(Set.of(historyGenre, sciFiGenre))
                .status(Book.Status.ACTIVE)
                .build();

        Book norwegianWood = Book.builder()
                .title("Norwegian Wood")
                .handle("BK000017")
                .slug("norwegian-wood")
                .isbn("9780375704024")
                .publicationYear(1987)
                .edition("Vintage International Edition")
                .format(Book.Format.PAPERBACK)
                .pageCount(296)
                .language("English")
                .description("A magnificent coming-of-age story of love, loss, and nostalgia.")
                .cover("https://images-na.ssl-images-amazon.com/images/P/0375704027.01._SCLZZZZZZZ_SX500_.jpg")
                .totalCopies(2)
                .availableCopies(2)
                .publisher(vintage)
                .authors(Set.of(harukiMurakami))
                .genres(Set.of(romanceGenre, classicGenre))
                .status(Book.Status.ACTIVE)
                .build();

        Book sherlockHolmes = Book.builder()
                .title("The Adventures of Sherlock Holmes")
                .handle("BK000018")
                .slug("the-adventures-of-sherlock-holmes")
                .isbn("9780486270715")
                .publicationYear(1892)
                .edition("Dover Thrift Edition")
                .format(Book.Format.PAPERBACK)
                .pageCount(240)
                .language("English")
                .description("Twelve thrilling stories featuring detective Sherlock Holmes and Dr. John H. Watson.")
                .cover("https://images-na.ssl-images-amazon.com/images/P/0486270718.01._SCLZZZZZZZ_SX500_.jpg")
                .totalCopies(2)
                .availableCopies(2)
                .publisher(bloomsbury)
                .authors(Set.of(arthurConanDoyle))
                .genres(Set.of(mysteryGenre, classicGenre))
                .status(Book.Status.ACTIVE)
                .build();

        Book richDadPoorDad = Book.builder()
                .title("Rich Dad Poor Dad: What the Rich Teach Their Kids About Money")
                .handle("BK000019")
                .slug("rich-dad-poor-dad")
                .isbn("9781612680194")
                .publicationYear(1997)
                .edition("20th Anniversary Edition")
                .format(Book.Format.PAPERBACK)
                .pageCount(336)
                .language("English")
                .description("Personal finance book that advocates the importance of financial literacy and building wealth.")
                .cover("https://images-na.ssl-images-amazon.com/images/P/1612680194.01._SCLZZZZZZZ_SX500_.jpg")
                .totalCopies(2)
                .availableCopies(2)
                .publisher(simonSchuster)
                .authors(Set.of(daleCarnegie))
                .genres(Set.of(financeGenre, selfHelpGenre))
                .status(Book.Status.ACTIVE)
                .build();

        Book hobbit = Book.builder()
                .title("The Hobbit, or There and Back Again")
                .handle("BK000020")
                .slug("the-hobbit-or-there-and-back-again")
                .isbn("9780547928227")
                .publicationYear(1937)
                .edition("Collector's Edition")
                .format(Book.Format.HARDCOVER)
                .pageCount(320)
                .language("English")
                .description("Bilbo Baggins is a hobbit who enjoys a comfortable, unambitious life, until Gandalf arrives.")
                .cover("https://images-na.ssl-images-amazon.com/images/P/054792822X.01._SCLZZZZZZZ_SX500_.jpg")
                .totalCopies(2)
                .availableCopies(2)
                .publisher(bloomsbury)
                .authors(Set.of(rowling))
                .genres(Set.of(fantasyGenre, classicGenre))
                .status(Book.Status.ACTIVE)
                .build();

        bookRepository.saveAll(List.of(
                cleanCode, harryPotter, designPatterns, refactoring, nineteenEightyFour,
                dune, atomicHabits, sapiens, steveJobs, andThenThereWereNone,
                ddia, phoenixProject, ddd, cleanArch, winFriends, briefHistoryTime,
                norwegianWood, sherlockHolmes, richDadPoorDad, hobbit
        ));

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

        // Refactoring Copies
        BookCopy rf1 = BookCopy.builder().barcode("BC00000008").status(BookCopy.Status.AVAILABLE).location("Shelf A-4").book(refactoring).build();
        BookCopy rf2 = BookCopy.builder().barcode("BC00000009").status(BookCopy.Status.AVAILABLE).location("Shelf A-4").book(refactoring).build();
        BookCopy rf3 = BookCopy.builder().barcode("BC00000010").status(BookCopy.Status.AVAILABLE).location("Shelf A-4").book(refactoring).build();

        // 1984 Copies
        BookCopy ne1 = BookCopy.builder().barcode("BC00000011").status(BookCopy.Status.AVAILABLE).location("Shelf C-1").book(nineteenEightyFour).build();
        BookCopy ne2 = BookCopy.builder().barcode("BC00000012").status(BookCopy.Status.AVAILABLE).location("Shelf C-1").book(nineteenEightyFour).build();
        BookCopy ne3 = BookCopy.builder().barcode("BC00000013").status(BookCopy.Status.AVAILABLE).location("Shelf C-2").book(nineteenEightyFour).build();

        // Dune Copies
        BookCopy dn1 = BookCopy.builder().barcode("BC00000014").status(BookCopy.Status.AVAILABLE).location("Shelf B-3").book(dune).build();
        BookCopy dn2 = BookCopy.builder().barcode("BC00000015").status(BookCopy.Status.AVAILABLE).location("Shelf B-3").book(dune).build();

        // Atomic Habits Copies
        BookCopy ah1 = BookCopy.builder().barcode("BC00000016").status(BookCopy.Status.AVAILABLE).location("Shelf D-1").book(atomicHabits).build();
        BookCopy ah2 = BookCopy.builder().barcode("BC00000017").status(BookCopy.Status.AVAILABLE).location("Shelf D-1").book(atomicHabits).build();
        BookCopy ah3 = BookCopy.builder().barcode("BC00000018").status(BookCopy.Status.AVAILABLE).location("Shelf D-2").book(atomicHabits).build();

        // Sapiens Copies
        BookCopy sp1 = BookCopy.builder().barcode("BC00000019").status(BookCopy.Status.AVAILABLE).location("Shelf E-1").book(sapiens).build();
        BookCopy sp2 = BookCopy.builder().barcode("BC00000020").status(BookCopy.Status.AVAILABLE).location("Shelf E-1").book(sapiens).build();

        // Steve Jobs Copies
        BookCopy sj1 = BookCopy.builder().barcode("BC00000021").status(BookCopy.Status.AVAILABLE).location("Shelf E-2").book(steveJobs).build();
        BookCopy sj2 = BookCopy.builder().barcode("BC00000022").status(BookCopy.Status.AVAILABLE).location("Shelf E-2").book(steveJobs).build();

        // And Then There Were None Copies
        BookCopy an1 = BookCopy.builder().barcode("BC00000023").status(BookCopy.Status.AVAILABLE).location("Shelf F-1").book(andThenThereWereNone).build();
        BookCopy an2 = BookCopy.builder().barcode("BC00000024").status(BookCopy.Status.AVAILABLE).location("Shelf F-1").book(andThenThereWereNone).build();

        // DDIA Copies
        BookCopy dd1 = BookCopy.builder().barcode("BC00000025").status(BookCopy.Status.AVAILABLE).location("Shelf A-5").book(ddia).build();
        BookCopy dd2 = BookCopy.builder().barcode("BC00000026").status(BookCopy.Status.AVAILABLE).location("Shelf A-5").book(ddia).build();
        BookCopy dd3 = BookCopy.builder().barcode("BC00000027").status(BookCopy.Status.AVAILABLE).location("Shelf A-5").book(ddia).build();

        // Phoenix Project Copies
        BookCopy px1 = BookCopy.builder().barcode("BC00000028").status(BookCopy.Status.AVAILABLE).location("Shelf A-6").book(phoenixProject).build();
        BookCopy px2 = BookCopy.builder().barcode("BC00000029").status(BookCopy.Status.AVAILABLE).location("Shelf A-6").book(phoenixProject).build();

        // DDD Copies
        BookCopy d31 = BookCopy.builder().barcode("BC00000030").status(BookCopy.Status.AVAILABLE).location("Shelf A-7").book(ddd).build();
        BookCopy d32 = BookCopy.builder().barcode("BC00000031").status(BookCopy.Status.AVAILABLE).location("Shelf A-7").book(ddd).build();

        // Clean Arch Copies
        BookCopy ca1 = BookCopy.builder().barcode("BC00000032").status(BookCopy.Status.AVAILABLE).location("Shelf A-8").book(cleanArch).build();
        BookCopy ca2 = BookCopy.builder().barcode("BC00000033").status(BookCopy.Status.AVAILABLE).location("Shelf A-8").book(cleanArch).build();
        BookCopy ca3 = BookCopy.builder().barcode("BC00000034").status(BookCopy.Status.AVAILABLE).location("Shelf A-8").book(cleanArch).build();

        // How to Win Friends Copies
        BookCopy wf1 = BookCopy.builder().barcode("BC00000035").status(BookCopy.Status.AVAILABLE).location("Shelf D-3").book(winFriends).build();
        BookCopy wf2 = BookCopy.builder().barcode("BC00000036").status(BookCopy.Status.AVAILABLE).location("Shelf D-3").book(winFriends).build();

        // Brief History Time Copies
        BookCopy bh1 = BookCopy.builder().barcode("BC00000037").status(BookCopy.Status.AVAILABLE).location("Shelf B-4").book(briefHistoryTime).build();
        BookCopy bh2 = BookCopy.builder().barcode("BC00000038").status(BookCopy.Status.AVAILABLE).location("Shelf B-4").book(briefHistoryTime).build();

        // Norwegian Wood Copies
        BookCopy nw1 = BookCopy.builder().barcode("BC00000039").status(BookCopy.Status.AVAILABLE).location("Shelf G-1").book(norwegianWood).build();
        BookCopy nw2 = BookCopy.builder().barcode("BC00000040").status(BookCopy.Status.AVAILABLE).location("Shelf G-1").book(norwegianWood).build();

        // Sherlock Holmes Copies
        BookCopy sh1 = BookCopy.builder().barcode("BC00000041").status(BookCopy.Status.AVAILABLE).location("Shelf F-2").book(sherlockHolmes).build();
        BookCopy sh2 = BookCopy.builder().barcode("BC00000042").status(BookCopy.Status.AVAILABLE).location("Shelf F-2").book(sherlockHolmes).build();

        // Rich Dad Poor Dad Copies
        BookCopy rd1 = BookCopy.builder().barcode("BC00000043").status(BookCopy.Status.AVAILABLE).location("Shelf D-4").book(richDadPoorDad).build();
        BookCopy rd2 = BookCopy.builder().barcode("BC00000044").status(BookCopy.Status.AVAILABLE).location("Shelf D-4").book(richDadPoorDad).build();

        // Hobbit Copies
        BookCopy hb1 = BookCopy.builder().barcode("BC00000045").status(BookCopy.Status.AVAILABLE).location("Shelf B-5").book(hobbit).build();
        BookCopy hb2 = BookCopy.builder().barcode("BC00000046").status(BookCopy.Status.AVAILABLE).location("Shelf B-5").book(hobbit).build();

        bookCopyRepository.saveAll(List.of(
                cc1, cc2, cc3, hp1, hp2, dp1, dp2,
                rf1, rf2, rf3, ne1, ne2, ne3, dn1, dn2,
                ah1, ah2, ah3, sp1, sp2, sj1, sj2, an1, an2,
                dd1, dd2, dd3, px1, px2, d31, d32, ca1, ca2, ca3,
                wf1, wf2, bh1, bh2, nw1, nw2, sh1, sh2, rd1, rd2, hb1, hb2
        ));

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

    private void seedAuditLogs() {
        if (auditLogRepository.count() == 0) {
            auditLogRepository.save(AuditLog.builder()
                    .operatorEmail("admin@libro.com")
                    .action("CHECKOUT_ISSUED")
                    .entityType(AuditLog.EntityType.LOAN)
                    .detail("Issued loan LN-88129 to patron @bin (Barcode: BC-391821)")
                    .ipAddress("127.0.0.1")
                    .createdAt(LocalDateTime.now().minusHours(4))
                    .build());

            auditLogRepository.save(AuditLog.builder()
                    .operatorEmail("lucia@libro.com")
                    .action("BOOK_RETURNED")
                    .entityType(AuditLog.EntityType.LOAN)
                    .detail("Processed return for LN-88104 (Clean Code)")
                    .ipAddress("192.168.1.15")
                    .createdAt(LocalDateTime.now().minusHours(8))
                    .build());

            auditLogRepository.save(AuditLog.builder()
                    .operatorEmail("admin@libro.com")
                    .action("BOOK_CREATED")
                    .entityType(AuditLog.EntityType.BOOK)
                    .detail("Created new title: Refactoring (2nd Edition) [BK992812]")
                    .ipAddress("127.0.0.1")
                    .createdAt(LocalDateTime.now().minusDays(1))
                    .build());

            auditLogRepository.save(AuditLog.builder()
                    .operatorEmail("lucia@libro.com")
                    .action("FINE_COLLECTED")
                    .entityType(AuditLog.EntityType.FINE)
                    .detail("Collected $2.00 overdue fee for ticket FINE-2026-001")
                    .ipAddress("192.168.1.15")
                    .createdAt(LocalDateTime.now().minusDays(2))
                    .build());

            auditLogRepository.save(AuditLog.builder()
                    .operatorEmail("admin@libro.com")
                    .action("POLICIES_UPDATED")
                    .entityType(AuditLog.EntityType.SETTINGS)
                    .detail("Updated default loan period from 10 to 14 days")
                    .ipAddress("127.0.0.1")
                    .createdAt(LocalDateTime.now().minusDays(3))
                    .build());

            auditLogRepository.save(AuditLog.builder()
                    .operatorEmail("admin@libro.com")
                    .action("USER_CREATED")
                    .entityType(AuditLog.EntityType.USER)
                    .detail("Registered patron account @alice (Alice Smith)")
                    .ipAddress("127.0.0.1")
                    .createdAt(LocalDateTime.now().minusDays(4))
                    .build());

            log.info("Seeded initial audit logs");
        }
    }
}

