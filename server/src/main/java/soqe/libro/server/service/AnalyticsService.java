package soqe.libro.server.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import soqe.libro.server.dto.*;
import soqe.libro.server.entity.*;
import soqe.libro.server.repository.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final BookRepository bookRepository;
    private final BookCopyRepository bookCopyRepository;
    private final LoanRepository loanRepository;
    private final FineRepository fineRepository;
    private final UserRepository userRepository;
    private final UserSubscriptionRepository subscriptionRepository;
    private final GenreRepository genreRepository;
    private final MembershipPlanRepository planRepository;

    @Transactional(readOnly = true)
    public DashboardSummaryResponse getDashboardSummary() {
        long totalBooks = bookRepository.count();
        long totalCopies = bookRepository.sumTotalCopies();
        long availableCopies = bookRepository.sumAvailableCopies();
        long activeLoans = loanRepository.countByStatus(Loan.LoanStatus.ONGOING);
        long overdueLoans = loanRepository.countByStatus(Loan.LoanStatus.OVERDUE)
                + loanRepository.countByStatusAndDueDateBefore(Loan.LoanStatus.ONGOING, LocalDate.now());
        long totalMembers = userRepository.count();
        long activeSubscriptions = subscriptionRepository.countByStatus(UserSubscription.SubscriptionStatus.ACTIVE);
        long pendingFinesCount = fineRepository.countByStatus(Fine.FineStatus.PENDING);
        BigDecimal pendingFinesAmount = fineRepository.sumAmountByStatus(Fine.FineStatus.PENDING);
        BigDecimal collectedFinesAmount = fineRepository.sumAmountByStatus(Fine.FineStatus.PAID);

        // Calculate Estimated MRR
        BigDecimal estimatedMRR = BigDecimal.ZERO;
        List<Object[]> planCounts = subscriptionRepository.countActiveSubscribersPerPlan();
        for (Object[] row : planCounts) {
            BigDecimal price = (BigDecimal) row[2];
            Long count = (Long) row[3];
            if (price != null && count != null) {
                estimatedMRR = estimatedMRR.add(price.multiply(BigDecimal.valueOf(count)));
            }
        }

        return DashboardSummaryResponse.builder()
                .totalBooks(totalBooks)
                .totalCopies(totalCopies)
                .availableCopies(availableCopies)
                .activeLoans(activeLoans)
                .overdueLoans(overdueLoans)
                .totalMembers(totalMembers)
                .activeSubscriptions(activeSubscriptions)
                .pendingFinesCount(pendingFinesCount)
                .pendingFinesAmount(pendingFinesAmount)
                .collectedFinesAmount(collectedFinesAmount)
                .estimatedMonthlyRecurringRevenue(estimatedMRR)
                .build();
    }

    @Transactional(readOnly = true)
    public CirculationTrendResponse getCirculationTrends(String period) {
        String cleanPeriod = (period != null && (period.equalsIgnoreCase("7d") || period.equalsIgnoreCase("12m")))
                ? period.toLowerCase() : "30d";

        List<CirculationTrendResponse.TrendDataPoint> points = new ArrayList<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM dd");

        if ("7d".equals(cleanPeriod) || "30d".equals(cleanPeriod)) {
            int days = "7d".equals(cleanPeriod) ? 7 : 30;
            LocalDate startDate = LocalDate.now().minusDays(days - 1);

            Map<LocalDate, Long> checkoutsMap = new HashMap<>();
            for (Object[] row : loanRepository.countCheckoutsByDateAfter(startDate)) {
                if (row[0] instanceof LocalDate d && row[1] instanceof Long cnt) {
                    checkoutsMap.put(d, cnt);
                }
            }

            Map<LocalDate, Long> returnsMap = new HashMap<>();
            for (Object[] row : loanRepository.countReturnsByDateAfter(startDate)) {
                if (row[0] instanceof LocalDate d && row[1] instanceof Long cnt) {
                    returnsMap.put(d, cnt);
                }
            }

            for (int i = 0; i < days; i++) {
                LocalDate date = startDate.plusDays(i);
                points.add(CirculationTrendResponse.TrendDataPoint.builder()
                        .label(date.format(formatter))
                        .checkouts(checkoutsMap.getOrDefault(date, 0L))
                        .returns(returnsMap.getOrDefault(date, 0L))
                        .overdues(0L)
                        .build());
            }
        } else {
            // 12 months
            LocalDate startDate = LocalDate.now().minusMonths(11).withDayOfMonth(1);
            DateTimeFormatter monthFormatter = DateTimeFormatter.ofPattern("MMM yyyy");

            Map<String, Long> checkoutsMap = new HashMap<>();
            for (Object[] row : loanRepository.countCheckoutsByDateAfter(startDate)) {
                if (row[0] instanceof LocalDate d && row[1] instanceof Long cnt) {
                    String mKey = d.format(monthFormatter);
                    checkoutsMap.put(mKey, checkoutsMap.getOrDefault(mKey, 0L) + cnt);
                }
            }

            Map<String, Long> returnsMap = new HashMap<>();
            for (Object[] row : loanRepository.countReturnsByDateAfter(startDate)) {
                if (row[0] instanceof LocalDate d && row[1] instanceof Long cnt) {
                    String mKey = d.format(monthFormatter);
                    returnsMap.put(mKey, returnsMap.getOrDefault(mKey, 0L) + cnt);
                }
            }

            for (int i = 0; i < 12; i++) {
                LocalDate mDate = startDate.plusMonths(i);
                String label = mDate.format(monthFormatter);
                points.add(CirculationTrendResponse.TrendDataPoint.builder()
                        .label(label)
                        .checkouts(checkoutsMap.getOrDefault(label, 0L))
                        .returns(returnsMap.getOrDefault(label, 0L))
                        .overdues(0L)
                        .build());
            }
        }

        return CirculationTrendResponse.builder()
                .period(cleanPeriod)
                .dataPoints(points)
                .build();
    }

    @Transactional(readOnly = true)
    public List<TopBorrowedBookResponse> getTopBorrowedBooks(int limit) {
        int max = limit > 0 ? Math.min(limit, 50) : 10;
        List<Object[]> topBookRows = loanRepository.findTopBorrowedBookIds(PageRequest.of(0, max));

        List<TopBorrowedBookResponse> result = new ArrayList<>();
        if (!topBookRows.isEmpty()) {
            for (Object[] row : topBookRows) {
                Long bookId = (Long) row[0];
                Long checkouts = (Long) row[1];
                bookRepository.findById(bookId).ifPresent(book -> {
                    List<String> authorNames = book.getAuthors() != null
                            ? book.getAuthors().stream().map(Author::getName).toList()
                            : List.of();

                    result.add(TopBorrowedBookResponse.builder()
                            .bookId(book.getId())
                            .bookHandle(book.getHandle())
                            .title(book.getTitle())
                            .cover(book.getCover())
                            .authors(authorNames)
                            .totalCheckouts(checkouts != null ? checkouts : 0L)
                            .totalCopies(book.getTotalCopies() != null ? book.getTotalCopies() : 0)
                            .availableCopies(book.getAvailableCopies() != null ? book.getAvailableCopies() : 0)
                            .build());
                });
            }
        } else {
            // Fallback for initial seeded DB without loans yet
            var books = bookRepository.findAll(PageRequest.of(0, max));
            for (Book book : books) {
                List<String> authorNames = book.getAuthors() != null
                        ? book.getAuthors().stream().map(Author::getName).toList()
                        : List.of();
                result.add(TopBorrowedBookResponse.builder()
                        .bookId(book.getId())
                        .bookHandle(book.getHandle())
                        .title(book.getTitle())
                        .cover(book.getCover())
                        .authors(authorNames)
                        .totalCheckouts(0L)
                        .totalCopies(book.getTotalCopies() != null ? book.getTotalCopies() : 0)
                        .availableCopies(book.getAvailableCopies() != null ? book.getAvailableCopies() : 0)
                        .build());
            }
        }

        return result;
    }

    @Transactional(readOnly = true)
    public CategoryDistributionResponse getCategoryDistribution() {
        List<Genre> allGenres = genreRepository.findAll();
        Map<Long, Long> genreLoansMap = new HashMap<>();

        for (Object[] row : loanRepository.countLoansByGenre()) {
            if (row[0] instanceof Long genreId && row[1] instanceof Long cnt) {
                genreLoansMap.put(genreId, cnt);
            }
        }

        long totalAllLoans = genreLoansMap.values().stream().mapToLong(Long::longValue).sum();

        List<CategoryDistributionResponse.CategoryShare> list = new ArrayList<>();
        for (Genre g : allGenres) {
            long bookCount = g.getBooks() != null ? g.getBooks().size() : 0;
            long loanCount = genreLoansMap.getOrDefault(g.getId(), 0L);
            double pct = totalAllLoans > 0 ? (double) loanCount / totalAllLoans * 100.0 : 0.0;

            list.add(CategoryDistributionResponse.CategoryShare.builder()
                    .genreId(g.getId())
                    .name(g.getName())
                    .handle(g.getHandle())
                    .bookCount(bookCount)
                    .loanCount(loanCount)
                    .percentage(Math.round(pct * 10.0) / 10.0)
                    .build());
        }

        return CategoryDistributionResponse.builder()
                .categories(list)
                .build();
    }

    @Transactional(readOnly = true)
    public RevenueReportResponse getRevenueReport() {
        // Subscription MRR and Plan Breakdown
        List<RevenueReportResponse.PlanRevenueBreakdown> planBreakdowns = new ArrayList<>();
        BigDecimal totalMRR = BigDecimal.ZERO;
        long totalActiveSubs = 0;

        Map<String, Long> planCountMap = new HashMap<>();
        for (Object[] row : subscriptionRepository.countActiveSubscribersPerPlan()) {
            String code = (String) row[0];
            Long cnt = (Long) row[3];
            if (code != null && cnt != null) {
                planCountMap.put(code, cnt);
            }
        }

        for (MembershipPlan plan : planRepository.findByStatus(MembershipPlan.Status.ACTIVE)) {
            long count = planCountMap.getOrDefault(plan.getCode(), 0L);
            totalActiveSubs += count;
            BigDecimal rev = plan.getPrice().multiply(BigDecimal.valueOf(count));
            totalMRR = totalMRR.add(rev);

            planBreakdowns.add(RevenueReportResponse.PlanRevenueBreakdown.builder()
                    .planCode(plan.getCode())
                    .planName(plan.getName())
                    .subscribersCount(count)
                    .price(plan.getPrice())
                    .revenue(rev)
                    .build());
        }

        RevenueReportResponse.SubscriptionRevenueSummary subSummary =
                RevenueReportResponse.SubscriptionRevenueSummary.builder()
                        .totalMRR(totalMRR)
                        .activeSubscribers(totalActiveSubs)
                        .planBreakdown(planBreakdowns)
                        .build();

        // Fines Revenue Breakdown
        BigDecimal totalCollected = fineRepository.sumAmountByStatus(Fine.FineStatus.PAID);
        BigDecimal totalPending = fineRepository.sumAmountByStatus(Fine.FineStatus.PENDING);
        BigDecimal totalWaived = fineRepository.sumAmountByStatus(Fine.FineStatus.WAIVED);

        Map<String, BigDecimal> methodBreakdown = new HashMap<>();
        for (Object[] row : fineRepository.sumAmountByPaymentMethod()) {
            if (row[0] != null && row[1] instanceof BigDecimal amt) {
                methodBreakdown.put(row[0].toString(), amt);
            }
        }

        Map<String, BigDecimal> reasonBreakdown = new HashMap<>();
        for (Object[] row : fineRepository.sumAmountByReason()) {
            if (row[0] != null && row[1] instanceof BigDecimal amt) {
                reasonBreakdown.put(row[0].toString(), amt);
            }
        }

        RevenueReportResponse.FinesRevenueSummary fineSummary =
                RevenueReportResponse.FinesRevenueSummary.builder()
                        .totalCollected(totalCollected)
                        .totalPending(totalPending)
                        .totalWaived(totalWaived)
                        .methodBreakdown(methodBreakdown)
                        .reasonBreakdown(reasonBreakdown)
                        .build();

        return RevenueReportResponse.builder()
                .subscriptionRevenue(subSummary)
                .finesRevenue(fineSummary)
                .build();
    }

    @Transactional(readOnly = true)
    public OperationalAlertsResponse getOperationalAlerts() {
        LocalDate sevenDaysAgo = LocalDate.now().minusDays(7);
        List<Loan> overdueLoans = loanRepository.findByStatusAndDueDateBeforeOrderByDueDateAsc(
                Loan.LoanStatus.ONGOING, sevenDaysAgo, PageRequest.of(0, 20));

        List<OperationalAlertsResponse.SevereOverdueAlert> severeList = new ArrayList<>();
        for (Loan l : overdueLoans) {
            long days = ChronoUnit.DAYS.between(l.getDueDate(), LocalDate.now());
            severeList.add(OperationalAlertsResponse.SevereOverdueAlert.builder()
                    .loanId(l.getId())
                    .loanCode(l.getLoanCode())
                    .bookTitle(l.getBookCopy() != null && l.getBookCopy().getBook() != null ? l.getBookCopy().getBook().getTitle() : "Unknown Book")
                    .bookHandle(l.getBookCopy() != null && l.getBookCopy().getBook() != null ? l.getBookCopy().getBook().getHandle() : null)
                    .borrowerName(l.getUser() != null ? l.getUser().getFullName() : "Unknown User")
                    .borrowerEmail(l.getUser() != null ? l.getUser().getEmail() : null)
                    .dueDate(l.getDueDate())
                    .daysOverdue(days)
                    .estimatedFine(BigDecimal.valueOf(days * 0.50).min(BigDecimal.valueOf(20.00)))
                    .build());
        }

        List<Book> outOfStock = bookRepository.findByAvailableCopiesLessThanEqual(0, PageRequest.of(0, 20));
        List<OperationalAlertsResponse.OutOfStockBookAlert> outOfStockList = outOfStock.stream()
                .map(b -> OperationalAlertsResponse.OutOfStockBookAlert.builder()
                        .bookId(b.getId())
                        .bookHandle(b.getHandle())
                        .title(b.getTitle())
                        .totalCopies(b.getTotalCopies() != null ? b.getTotalCopies() : 0)
                        .build())
                .toList();

        return OperationalAlertsResponse.builder()
                .severeOverdues(severeList)
                .outOfStockBooks(outOfStockList)
                .totalSevereOverdues(severeList.size())
                .totalOutOfStock(bookRepository.countByAvailableCopies(0))
                .build();
    }

    @Transactional(readOnly = true)
    public String exportCsvReport(String type) {
        StringBuilder sb = new StringBuilder();
        String cleanType = type != null ? type.toLowerCase() : "top-books";

        switch (cleanType) {
            case "top-books":
                sb.append("Rank,Book ID,Handle,Title,Authors,Total Checkouts,Total Copies,Available Copies\n");
                List<TopBorrowedBookResponse> topBooks = getTopBorrowedBooks(100);
                for (int i = 0; i < topBooks.size(); i++) {
                    var b = topBooks.get(i);
                    sb.append(i + 1).append(",")
                            .append(b.bookId()).append(",")
                            .append(escapeCsv(b.bookHandle())).append(",")
                            .append(escapeCsv(b.title())).append(",")
                            .append(escapeCsv(String.join("; ", b.authors()))).append(",")
                            .append(b.totalCheckouts()).append(",")
                            .append(b.totalCopies()).append(",")
                            .append(b.availableCopies()).append("\n");
                }
                break;

            case "fines":
                sb.append("Fine Code,Loan Code,Amount,Reason,Status,Payment Method,Paid At\n");
                for (Fine f : fineRepository.findAll()) {
                    sb.append(escapeCsv(f.getFineCode())).append(",")
                            .append(escapeCsv(f.getLoan() != null ? f.getLoan().getLoanCode() : "")).append(",")
                            .append(f.getAmount()).append(",")
                            .append(f.getReason()).append(",")
                            .append(f.getStatus()).append(",")
                            .append(f.getPaymentMethod() != null ? f.getPaymentMethod() : "").append(",")
                            .append(f.getPaidAt() != null ? f.getPaidAt().toString() : "").append("\n");
                }
                break;

            case "subscriptions":
                sb.append("User Email,Plan Code,Plan Name,Price,Status,Start Date,Current Period End\n");
                for (UserSubscription s : subscriptionRepository.findAll()) {
                    sb.append(escapeCsv(s.getUser() != null ? s.getUser().getEmail() : "")).append(",")
                            .append(escapeCsv(s.getPlan() != null ? s.getPlan().getCode() : "")).append(",")
                            .append(escapeCsv(s.getPlan() != null ? s.getPlan().getName() : "")).append(",")
                            .append(s.getPlan() != null ? s.getPlan().getPrice() : 0).append(",")
                            .append(s.getStatus()).append(",")
                            .append(s.getStartDate() != null ? s.getStartDate().toString() : "").append(",")
                            .append(s.getCurrentPeriodEnd() != null ? s.getCurrentPeriodEnd().toString() : "").append("\n");
                }
                break;

            case "categories":
                sb.append("Genre ID,Genre Name,Handle,Book Count,Total Loans,Share (%)\n");
                CategoryDistributionResponse catDist = getCategoryDistribution();
                for (var cat : catDist.categories()) {
                    sb.append(cat.genreId()).append(",")
                            .append(escapeCsv(cat.name())).append(",")
                            .append(escapeCsv(cat.handle())).append(",")
                            .append(cat.bookCount()).append(",")
                            .append(cat.loanCount()).append(",")
                            .append(cat.percentage()).append("%\n");
                }
                break;

            case "circulation":
                sb.append("Time Period,Checkouts,Returns,Overdues\n");
                CirculationTrendResponse trends = getCirculationTrends("12m");
                for (var pt : trends.dataPoints()) {
                    sb.append(escapeCsv(pt.label())).append(",")
                            .append(pt.checkouts()).append(",")
                            .append(pt.returns()).append(",")
                            .append(pt.overdues()).append("\n");
                }
                break;

            default:
                sb.append("Metric,Value\n");
                var summary = getDashboardSummary();
                sb.append("Total Books,").append(summary.totalBooks()).append("\n");
                sb.append("Total Copies,").append(summary.totalCopies()).append("\n");
                sb.append("Active Loans,").append(summary.activeLoans()).append("\n");
                sb.append("Overdue Loans,").append(summary.overdueLoans()).append("\n");
                sb.append("Collected Fines ($),").append(summary.collectedFinesAmount()).append("\n");
                sb.append("Monthly Recurring Revenue ($),").append(summary.estimatedMonthlyRecurringRevenue()).append("\n");
                break;
        }

        return sb.toString();
    }

    private String escapeCsv(String value) {
        if (value == null) return "\"\"";
        return "\"" + value.replace("\"", "\"\"") + "\"";
    }
}
