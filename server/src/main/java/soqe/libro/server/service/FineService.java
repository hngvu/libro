package soqe.libro.server.service;

import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import com.stripe.param.checkout.SessionCreateParams;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import soqe.libro.server.dto.FinePublicResponse;
import soqe.libro.server.dto.FineResponse;
import soqe.libro.server.dto.StripeCheckoutResponse;
import soqe.libro.server.entity.Fine;
import soqe.libro.server.entity.Loan;
import soqe.libro.server.entity.User;
import soqe.libro.server.exception.BusinessValidationException;
import soqe.libro.server.exception.ResourceNotFoundException;
import soqe.libro.server.repository.FineRepository;
import soqe.libro.server.specification.FineSpecification;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class FineService {

    private final FineRepository repository;
    private final soqe.libro.server.repository.UserRepository userRepository;
    private final SystemSettingService systemSettingService;

    @Value("${stripe.currency:usd}")
    private String stripeCurrency;

    @Value("${stripe.webhook-secret:}")
    private String stripeWebhookSecret;

    @Value("${fine.daily-rate:0.50}")
    private BigDecimal dailyRate;

    @Value("${fine.default-lost-fee:20.00}")
    private BigDecimal defaultLostFee;

    @Value("${fine.default-damaged-fee:10.00}")
    private BigDecimal defaultDamagedFee;

    private static final String ALPHANUMERIC = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyMMdd");

    @Transactional
    public Fine assessOverdueFineIfAny(Loan loan, LocalDate returnDate) {
        if (loan == null || loan.getDueDate() == null || returnDate == null) {
            return null;
        }

        BigDecimal currentDailyRate = systemSettingService.getBigDecimal("fine.daily_rate", dailyRate != null ? dailyRate : BigDecimal.valueOf(0.50));
        BigDecimal currentLostFee = systemSettingService.getBigDecimal("fine.default_lost_fee", defaultLostFee != null ? defaultLostFee : BigDecimal.valueOf(20.00));

        if (returnDate.isAfter(loan.getDueDate())) {
            int daysOverdue = (int) ChronoUnit.DAYS.between(loan.getDueDate(), returnDate);
            if (daysOverdue > 0) {
                BigDecimal calculated = currentDailyRate.multiply(BigDecimal.valueOf(daysOverdue));
                // Apply cap (cannot exceed defaultLostFee)
                BigDecimal amount = calculated.min(currentLostFee);

                Fine fine = Fine.builder()
                        .fineCode(generateUniqueFineCode())
                        .user(loan.getUser())
                        .loan(loan)
                        .book(loan.getBookCopy() != null ? loan.getBookCopy().getBook() : null)
                        .amount(amount)
                        .reason(Fine.FineReason.OVERDUE)
                        .daysOverdue(daysOverdue)
                        .status(Fine.FineStatus.PENDING)
                        .build();

                return repository.save(fine);
            }
        }
        return null;
    }

    @Transactional
    public Fine createLostBookFine(Loan loan, BigDecimal customAmount) {
        BigDecimal currentLostFee = systemSettingService.getBigDecimal("fine.default_lost_fee", defaultLostFee != null ? defaultLostFee : BigDecimal.valueOf(20.00));
        BigDecimal amount = customAmount != null ? customAmount : currentLostFee;
        Fine fine = Fine.builder()
                .fineCode(generateUniqueFineCode())
                .user(loan.getUser())
                .loan(loan)
                .book(loan.getBookCopy() != null ? loan.getBookCopy().getBook() : null)
                .amount(amount)
                .reason(Fine.FineReason.LOST_BOOK)
                .status(Fine.FineStatus.PENDING)
                .build();
        return repository.save(fine);
    }

    @Transactional
    public Fine createDamagedBookFine(Loan loan, BigDecimal customAmount, String note) {
        BigDecimal currentDamagedFee = systemSettingService.getBigDecimal("fine.default_damaged_fee", defaultDamagedFee != null ? defaultDamagedFee : BigDecimal.valueOf(10.00));
        BigDecimal amount = customAmount != null ? customAmount : currentDamagedFee;
        Fine fine = Fine.builder()
                .fineCode(generateUniqueFineCode())
                .user(loan.getUser())
                .loan(loan)
                .book(loan.getBookCopy() != null ? loan.getBookCopy().getBook() : null)
                .amount(amount)
                .reason(Fine.FineReason.DAMAGED_BOOK)
                .status(Fine.FineStatus.PENDING)
                .waivedReason(note)
                .build();
        return repository.save(fine);
    }

    @Transactional
    public FineResponse payWithCash(Long fineId) {
        Fine fine = repository.findById(fineId)
                .orElseThrow(() -> new ResourceNotFoundException("Fine not found with ID: " + fineId));

        if (fine.getStatus() != Fine.FineStatus.PENDING) {
            throw new BusinessValidationException("Payment failed",
                    Map.of("status", "Fine is already " + fine.getStatus() + " and cannot be paid"));
        }

        fine.setStatus(Fine.FineStatus.PAID);
        fine.setPaymentMethod(Fine.PaymentMethod.CASH);
        fine.setPaidAt(LocalDateTime.now());
        fine = repository.save(fine);

        return toAdminResponse(fine);
    }

    @Transactional
    public FineResponse waiveFine(Long fineId, String reason) {
        Fine fine = repository.findById(fineId)
                .orElseThrow(() -> new ResourceNotFoundException("Fine not found with ID: " + fineId));

        if (fine.getStatus() != Fine.FineStatus.PENDING) {
            throw new BusinessValidationException("Waive failed",
                    Map.of("status", "Fine is already " + fine.getStatus() + " and cannot be waived"));
        }

        fine.setStatus(Fine.FineStatus.WAIVED);
        fine.setPaymentMethod(Fine.PaymentMethod.WAIVED);
        fine.setWaivedAt(LocalDateTime.now());
        fine.setWaivedReason(reason);
        fine = repository.save(fine);

        return toAdminResponse(fine);
    }

    @Transactional
    public StripeCheckoutResponse createStripeCheckoutSession(Long fineId, String userEmail, String clientBaseUrl) {
        Fine fine = repository.findById(fineId)
                .orElseThrow(() -> new ResourceNotFoundException("Fine not found with ID: " + fineId));
        return buildStripeCheckoutSession(fine, userEmail, clientBaseUrl);
    }

    @Transactional
    public StripeCheckoutResponse createStripeCheckoutSessionByCode(String fineCode, String userEmail, String clientBaseUrl) {
        Fine fine = repository.findByFineCode(fineCode)
                .orElseThrow(() -> new ResourceNotFoundException("Fine not found with code: " + fineCode));
        return buildStripeCheckoutSession(fine, userEmail, clientBaseUrl);
    }

    private StripeCheckoutResponse buildStripeCheckoutSession(Fine fine, String userEmail, String clientBaseUrl) {
        if (fine.getStatus() != Fine.FineStatus.PENDING) {
            throw new BusinessValidationException("Checkout failed",
                    Map.of("status", "Fine is already " + fine.getStatus() + " and cannot be paid"));
        }

        if (fine.getUser() != null && !fine.getUser().getEmail().equalsIgnoreCase(userEmail)) {
            throw new BusinessValidationException("Access denied",
                    Map.of("user", "You can only pay for your own fines"));
        }

        try {
            long unitAmountCents;
            if ("vnd".equalsIgnoreCase(stripeCurrency)) {
                unitAmountCents = fine.getAmount().longValue();
            } else {
                unitAmountCents = fine.getAmount().multiply(BigDecimal.valueOf(100)).longValue();
            }

            String baseUrl = StringUtils.hasText(clientBaseUrl) ? clientBaseUrl : "http://localhost:5173";
            String bookTitle = fine.getBook() != null ? fine.getBook().getTitle() : "Library Resource";

            SessionCreateParams params = SessionCreateParams.builder()
                    .setMode(SessionCreateParams.Mode.PAYMENT)
                    .setSuccessUrl(baseUrl + "/my-loans?status=success&session_id={CHECKOUT_SESSION_ID}")
                    .setCancelUrl(baseUrl + "/my-loans?status=cancelled")
                    .setCustomerEmail(userEmail)
                    .setClientReferenceId(String.valueOf(fine.getId()))
                    .putMetadata("fineId", String.valueOf(fine.getId()))
                    .putMetadata("fineCode", fine.getFineCode())
                    .addLineItem(
                            SessionCreateParams.LineItem.builder()
                                    .setQuantity(1L)
                                    .setPriceData(
                                            SessionCreateParams.LineItem.PriceData.builder()
                                                    .setCurrency(stripeCurrency.toLowerCase())
                                                    .setUnitAmount(unitAmountCents)
                                                    .setProductData(
                                                            SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                                                    .setName("Library Fine: " + fine.getFineCode())
                                                                    .setDescription("Reason: " + fine.getReason() + " - Book: " + bookTitle)
                                                                    .build()
                                                    )
                                                    .build()
                                    )
                                    .build()
                    )
                    .build();

            Session session = Session.create(params);
            fine.setStripeSessionId(session.getId());
            repository.save(fine);

            return new StripeCheckoutResponse(session.getUrl(), session.getId());
        } catch (StripeException e) {
            log.error("Failed to create Stripe Checkout Session for fine {}: {}", fine.getFineCode(), e.getMessage());
            throw new BusinessValidationException("Stripe error",
                    Map.of("stripe", "Unable to create Stripe checkout session: " + e.getMessage()));
        }
    }

    public Event constructEvent(String payload, String sigHeader) {
        try {
            if (StringUtils.hasText(stripeWebhookSecret) && !stripeWebhookSecret.startsWith("whsec_placeholder")) {
                return Webhook.constructEvent(payload, sigHeader, stripeWebhookSecret);
            } else {
                return Event.GSON.fromJson(payload, Event.class);
            }
        } catch (SignatureVerificationException e) {
            log.error("Stripe signature verification failed: {}", e.getMessage());
            throw new BusinessValidationException("Webhook error", Map.of("signature", "Invalid signature"));
        } catch (Exception e) {
            log.error("Error parsing webhook payload: {}", e.getMessage());
            throw new BusinessValidationException("Webhook error", Map.of("payload", "Invalid payload"));
        }
    }

    @Transactional
    public void processStripeWebhook(String payload, String sigHeader) {
        Event event = constructEvent(payload, sigHeader);
        processFineWebhook(event);
    }

    @Transactional
    public void processFineWebhook(Event event) {
        if ("checkout.session.completed".equals(event.getType())) {
            var dataObjectDeserializer = event.getDataObjectDeserializer();
            Session session = null;
            if (dataObjectDeserializer.getObject().isPresent() && dataObjectDeserializer.getObject().get() instanceof Session s) {
                session = s;
            } else if (dataObjectDeserializer.getRawJson() != null) {
                session = Event.GSON.fromJson(dataObjectDeserializer.getRawJson(), Session.class);
            }

            if (session != null) {
                final String paymentIntentId = session.getPaymentIntent();
                String fineIdStr = session.getMetadata() != null ? session.getMetadata().get("fineId") : null;
                if (!StringUtils.hasText(fineIdStr)) {
                    fineIdStr = session.getClientReferenceId();
                }

                if (StringUtils.hasText(fineIdStr)) {
                    try {
                        Long fineId = Long.parseLong(fineIdStr);
                        repository.findById(fineId).ifPresent(fine -> {
                            if (fine.getStatus() == Fine.FineStatus.PENDING) {
                                fine.setStatus(Fine.FineStatus.PAID);
                                fine.setPaymentMethod(Fine.PaymentMethod.STRIPE);
                                fine.setStripePaymentIntentId(paymentIntentId);
                                fine.setPaidAt(LocalDateTime.now());
                                repository.save(fine);
                                log.info("Fine {} marked as PAID via Stripe Checkout", fine.getFineCode());
                            }
                        });
                    } catch (NumberFormatException e) {
                        log.warn("Invalid fineId in Stripe Session metadata: {}", fineIdStr);
                    }
                }
            }
        }
    }

    @Transactional(readOnly = true)
    public Page<FineResponse> searchForAdmin(
            String keyword,
            List<Fine.FineStatus> statuses,
            List<Fine.FineReason> reasons,
            List<Long> userIds,
            Pageable pageable) {
        return repository.findAll(FineSpecification.filterMulti(keyword, statuses, reasons, userIds), pageable)
                .map(this::toAdminResponse);
    }

    @Transactional(readOnly = true)
    public Page<FinePublicResponse> getMyFines(User user, List<Fine.FineStatus> statuses, Pageable pageable) {
        return repository.findAll(FineSpecification.filterMulti(null, statuses, null, List.of(user.getId())), pageable)
                .map(this::toPublicResponse);
    }

    @Transactional(readOnly = true)
    public Page<FinePublicResponse> getMyFinesByEmail(String email, List<Fine.FineStatus> statuses, Pageable pageable) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return getMyFines(user, statuses, pageable);
    }

    @Transactional(readOnly = true)
    public FineResponse getForAdmin(Long id) {
        Fine fine = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Fine not found with ID: " + id));
        return toAdminResponse(fine);
    }

    private String generateUniqueFineCode() {
        String datePart = LocalDate.now().format(DATE_FORMATTER);
        String code;
        do {
            StringBuilder sb = new StringBuilder("FN").append(datePart);
            for (int i = 0; i < 4; i++) {
                sb.append(ALPHANUMERIC.charAt(RANDOM.nextInt(ALPHANUMERIC.length())));
            }
            code = sb.toString();
        } while (repository.findByFineCode(code).isPresent());
        return code;
    }

    private FineResponse toAdminResponse(Fine f) {
        return FineResponse.builder()
                .id(f.getId())
                .fineCode(f.getFineCode())
                .userId(f.getUser() != null ? f.getUser().getId() : null)
                .userEmail(f.getUser() != null ? f.getUser().getEmail() : null)
                .userFullName(f.getUser() != null ? f.getUser().getFullName() : null)
                .loanId(f.getLoan() != null ? f.getLoan().getId() : null)
                .loanCode(f.getLoan() != null ? f.getLoan().getLoanCode() : null)
                .bookId(f.getBook() != null ? f.getBook().getId() : null)
                .bookTitle(f.getBook() != null ? f.getBook().getTitle() : null)
                .bookHandle(f.getBook() != null ? f.getBook().getHandle() : null)
                .amount(f.getAmount())
                .reason(f.getReason() != null ? f.getReason().name() : null)
                .daysOverdue(f.getDaysOverdue())
                .status(f.getStatus() != null ? f.getStatus().name() : null)
                .paymentMethod(f.getPaymentMethod() != null ? f.getPaymentMethod().name() : null)
                .stripeSessionId(f.getStripeSessionId())
                .stripePaymentIntentId(f.getStripePaymentIntentId())
                .paidAt(f.getPaidAt())
                .waivedAt(f.getWaivedAt())
                .waivedReason(f.getWaivedReason())
                .createdAt(f.getCreatedAt())
                .updatedAt(f.getUpdatedAt())
                .createdBy(f.getCreatedBy())
                .updatedBy(f.getUpdatedBy())
                .build();
    }

    private FinePublicResponse toPublicResponse(Fine f) {
        return FinePublicResponse.builder()
                .fineCode(f.getFineCode())
                .loanCode(f.getLoan() != null ? f.getLoan().getLoanCode() : null)
                .bookTitle(f.getBook() != null ? f.getBook().getTitle() : null)
                .bookHandle(f.getBook() != null ? f.getBook().getHandle() : null)
                .bookCover(f.getBook() != null ? f.getBook().getCover() : null)
                .amount(f.getAmount())
                .reason(f.getReason() != null ? f.getReason().name() : null)
                .daysOverdue(f.getDaysOverdue())
                .status(f.getStatus() != null ? f.getStatus().name() : null)
                .paymentMethod(f.getPaymentMethod() != null ? f.getPaymentMethod().name() : null)
                .paidAt(f.getPaidAt())
                .createdAt(f.getCreatedAt())
                .build();
    }
}
