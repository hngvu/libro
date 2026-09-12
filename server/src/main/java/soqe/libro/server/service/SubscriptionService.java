package soqe.libro.server.service;

import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.Subscription;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import soqe.libro.server.dto.MembershipPlanCreateRequest;
import soqe.libro.server.dto.MembershipPlanResponse;
import soqe.libro.server.dto.StripeCheckoutResponse;
import soqe.libro.server.dto.UserSubscriptionResponse;
import soqe.libro.server.entity.MembershipPlan;
import soqe.libro.server.entity.User;
import soqe.libro.server.entity.UserSubscription;
import soqe.libro.server.exception.BusinessValidationException;
import soqe.libro.server.exception.ResourceNotFoundException;
import soqe.libro.server.repository.MembershipPlanRepository;
import soqe.libro.server.repository.UserRepository;
import soqe.libro.server.repository.UserSubscriptionRepository;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class SubscriptionService {

    private final MembershipPlanRepository planRepository;
    private final UserSubscriptionRepository subscriptionRepository;
    private final UserRepository userRepository;

    @Value("${stripe.currency:usd}")
    private String stripeCurrency;

    @Transactional(readOnly = true)
    public List<MembershipPlanResponse> getPublicPlans() {
        return planRepository.findByStatus(MembershipPlan.Status.ACTIVE)
                .stream()
                .map(this::toPlanResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MembershipPlanResponse> getAllPlansAdmin() {
        return planRepository.findAll(Sort.by(Sort.Direction.ASC, "id"))
                .stream()
                .map(this::toPlanResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public MembershipPlanResponse getPlanByCode(String code) {
        MembershipPlan plan = planRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Membership plan not found with code: " + code));
        return toPlanResponse(plan);
    }

    @Transactional
    public MembershipPlanResponse createPlan(MembershipPlanCreateRequest req) {
        if (planRepository.findByCode(req.code()).isPresent()) {
            throw new BusinessValidationException("Validation failed", Map.of("code", "Plan code already exists"));
        }

        MembershipPlan plan = MembershipPlan.builder()
                .name(req.name())
                .code(req.code())
                .description(req.description())
                .price(req.price())
                .billingCycle(MembershipPlan.BillingCycle.valueOf(req.billingCycle().toUpperCase()))
                .stripePriceId(req.stripePriceId())
                .stripeProductId(req.stripeProductId())
                .maxActiveLoans(req.maxActiveLoans())
                .loanDurationDays(req.loanDurationDays())
                .maxRenewals(req.maxRenewals())
                .status(MembershipPlan.Status.ACTIVE)
                .build();

        plan = planRepository.save(plan);
        return toPlanResponse(plan);
    }

    @Transactional
    public MembershipPlanResponse updatePlan(Long id, MembershipPlanCreateRequest req) {
        MembershipPlan plan = planRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Plan not found with id: " + id));

        // Check if code changes and conflicts
        if (!plan.getCode().equalsIgnoreCase(req.code())) {
            if (planRepository.findByCode(req.code()).isPresent()) {
                throw new BusinessValidationException("Validation failed", Map.of("code", "Plan code already exists"));
            }
            plan.setCode(req.code());
        }

        plan.setName(req.name());
        plan.setDescription(req.description());
        plan.setPrice(req.price());
        if (StringUtils.hasText(req.billingCycle())) {
            plan.setBillingCycle(MembershipPlan.BillingCycle.valueOf(req.billingCycle().toUpperCase()));
        }
        plan.setStripePriceId(req.stripePriceId());
        plan.setStripeProductId(req.stripeProductId());
        plan.setMaxActiveLoans(req.maxActiveLoans());
        plan.setLoanDurationDays(req.loanDurationDays());
        plan.setMaxRenewals(req.maxRenewals());

        plan = planRepository.save(plan);
        return toPlanResponse(plan);
    }

    @Transactional
    public void deletePlan(Long id) {
        MembershipPlan plan = planRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Plan not found with id: " + id));
        plan.setStatus(MembershipPlan.Status.ARCHIVED);
        planRepository.save(plan);
    }

    @Transactional(readOnly = true)
    public List<UserSubscriptionResponse> getAllUserSubscriptionsAdmin() {
        return subscriptionRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream()
                .map(this::toSubscriptionResponse)
                .toList();
    }

    @Transactional
    public UserSubscriptionResponse cancelUserSubscriptionAdmin(Long id) {
        UserSubscription sub = subscriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Subscription not found with id: " + id));
        sub.setStatus(UserSubscription.SubscriptionStatus.CANCELED);
        sub.setCanceledAt(LocalDateTime.now());
        sub = subscriptionRepository.save(sub);
        return toSubscriptionResponse(sub);
    }

    @Transactional(readOnly = true)
    public Optional<UserSubscription> getActiveSubscriptionForUser(User user) {
        return subscriptionRepository.findTopByUserAndStatusOrderByCurrentPeriodEndDesc(
                user, UserSubscription.SubscriptionStatus.ACTIVE);
    }

    @Transactional(readOnly = true)
    public UserSubscriptionResponse getMySubscription(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Optional<UserSubscription> activeOpt = getActiveSubscriptionForUser(user);

        if (activeOpt.isPresent()) {
            return toSubscriptionResponse(activeOpt.get());
        }

        // Return Free tier defaults
        return UserSubscriptionResponse.builder()
                .userId(user.getId())
                .userEmail(user.getEmail())
                .planName("Free Reader")
                .planCode("FREE")
                .maxActiveLoans(1)
                .loanDurationDays(7)
                .maxRenewals(0)
                .status("FREE_TIER")
                .build();
    }

    @Transactional
    public StripeCheckoutResponse createSubscriptionCheckoutSession(String planCode, String userEmail, String clientBaseUrl) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        MembershipPlan plan = planRepository.findByCode(planCode)
                .orElseThrow(() -> new ResourceNotFoundException("Plan not found with code: " + planCode));

        if (plan.getPrice().compareTo(BigDecimal.ZERO) == 0) {
            throw new BusinessValidationException("Subscription failed", Map.of("plan", "Free plan does not require checkout"));
        }

        String baseUrl = StringUtils.hasText(clientBaseUrl) ? clientBaseUrl : "http://localhost:5173";

        try {
            SessionCreateParams.Builder params = SessionCreateParams.builder()
                    .setMode(SessionCreateParams.Mode.SUBSCRIPTION)
                    .setSuccessUrl(baseUrl + "/my-loans?subscription=success&session_id={CHECKOUT_SESSION_ID}")
                    .setCancelUrl(baseUrl + "/my-loans?subscription=cancelled")
                    .setCustomerEmail(userEmail)
                    .setClientReferenceId(String.valueOf(user.getId()))
                    .putMetadata("userId", String.valueOf(user.getId()))
                    .putMetadata("planCode", plan.getCode())
                    .putMetadata("planId", String.valueOf(plan.getId()));

            if (StringUtils.hasText(plan.getStripePriceId())) {
                params.addLineItem(
                        SessionCreateParams.LineItem.builder()
                                .setQuantity(1L)
                                .setPrice(plan.getStripePriceId())
                                .build()
                );
            } else {
                long unitAmountCents = plan.getPrice().multiply(BigDecimal.valueOf(100)).longValue();
                SessionCreateParams.LineItem.PriceData.Recurring.Interval interval =
                        plan.getBillingCycle() == MembershipPlan.BillingCycle.YEARLY
                                ? SessionCreateParams.LineItem.PriceData.Recurring.Interval.YEAR
                                : SessionCreateParams.LineItem.PriceData.Recurring.Interval.MONTH;

                params.addLineItem(
                        SessionCreateParams.LineItem.builder()
                                .setQuantity(1L)
                                .setPriceData(
                                        SessionCreateParams.LineItem.PriceData.builder()
                                                .setCurrency(stripeCurrency.toLowerCase())
                                                .setUnitAmount(unitAmountCents)
                                                .setRecurring(
                                                        SessionCreateParams.LineItem.PriceData.Recurring.builder()
                                                                .setInterval(interval)
                                                                .build()
                                                )
                                                .setProductData(
                                                        SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                                                .setName("Libro Membership: " + plan.getName())
                                                                .setDescription(plan.getDescription())
                                                                .build()
                                                )
                                                .build()
                                )
                                .build()
                );
            }

            Session session = Session.create(params.build());
            return new StripeCheckoutResponse(session.getUrl(), session.getId());
        } catch (StripeException e) {
            log.error("Failed to create Stripe Subscription session: {}", e.getMessage());
            throw new BusinessValidationException("Stripe error", Map.of("stripe", e.getMessage()));
        }
    }

    @Transactional
    public StripeCheckoutResponse createCustomerPortalSession(String userEmail, String returnUrl) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Optional<UserSubscription> activeSub = getActiveSubscriptionForUser(user);
        if (activeSub.isEmpty() || !StringUtils.hasText(activeSub.get().getStripeCustomerId())) {
            throw new BusinessValidationException("Portal error", Map.of("subscription", "No active Stripe customer account found"));
        }

        try {
            var params = com.stripe.param.billingportal.SessionCreateParams.builder()
                    .setCustomer(activeSub.get().getStripeCustomerId())
                    .setReturnUrl(StringUtils.hasText(returnUrl) ? returnUrl : "http://localhost:5173/my-loans")
                    .build();

            com.stripe.model.billingportal.Session session = com.stripe.model.billingportal.Session.create(params);
            return new StripeCheckoutResponse(session.getUrl(), session.getId());
        } catch (StripeException e) {
            log.error("Failed to create Stripe Portal session: {}", e.getMessage());
            throw new BusinessValidationException("Stripe error", Map.of("portal", e.getMessage()));
        }
    }

    @Transactional
    public void processSubscriptionWebhook(Event event) {
        String type = event.getType();

        if ("checkout.session.completed".equals(type)) {
            var deserializer = event.getDataObjectDeserializer();
            Session session = null;
            if (deserializer.getObject().isPresent() && deserializer.getObject().get() instanceof Session s) {
                session = s;
            } else if (deserializer.getRawJson() != null) {
                session = Event.GSON.fromJson(deserializer.getRawJson(), Session.class);
            }

            if (session != null && "subscription".equals(session.getMode())) {
                handleCheckoutSessionCompleted(session);
            }
        } else if ("customer.subscription.updated".equals(type) || "customer.subscription.deleted".equals(type)) {
            var deserializer = event.getDataObjectDeserializer();
            Subscription sub = null;
            if (deserializer.getObject().isPresent() && deserializer.getObject().get() instanceof Subscription s) {
                sub = s;
            } else if (deserializer.getRawJson() != null) {
                sub = Event.GSON.fromJson(deserializer.getRawJson(), Subscription.class);
            }

            if (sub != null) {
                handleSubscriptionUpdatedOrDeleted(sub, "customer.subscription.deleted".equals(type));
            }
        }
    }

    private void handleCheckoutSessionCompleted(Session session) {
        String userIdStr = session.getMetadata() != null ? session.getMetadata().get("userId") : null;
        String planCode = session.getMetadata() != null ? session.getMetadata().get("planCode") : null;

        if (userIdStr == null || planCode == null) return;

        try {
            Long userId = Long.parseLong(userIdStr);
            User user = userRepository.findById(userId).orElse(null);
            MembershipPlan plan = planRepository.findByCode(planCode).orElse(null);

            if (user != null && plan != null) {
                String stripeSubId = session.getSubscription();
                String stripeCustId = session.getCustomer();

                LocalDateTime periodStart = LocalDateTime.now();
                LocalDateTime periodEnd = plan.getBillingCycle() == MembershipPlan.BillingCycle.YEARLY
                        ? periodStart.plusYears(1)
                        : periodStart.plusMonths(1);

                UserSubscription sub = UserSubscription.builder()
                        .user(user)
                        .plan(plan)
                        .status(UserSubscription.SubscriptionStatus.ACTIVE)
                        .stripeCustomerId(stripeCustId)
                        .stripeSubscriptionId(stripeSubId)
                        .startDate(periodStart)
                        .currentPeriodStart(periodStart)
                        .currentPeriodEnd(periodEnd)
                        .cancelAtPeriodEnd(false)
                        .build();

                subscriptionRepository.save(sub);
                log.info("Activated subscription for user {} with plan {}", user.getEmail(), plan.getCode());
            }
        } catch (Exception e) {
            log.error("Failed to process subscription checkout session: {}", e.getMessage());
        }
    }

    private void handleSubscriptionUpdatedOrDeleted(Subscription sub, boolean isDeleted) {
        subscriptionRepository.findByStripeSubscriptionId(sub.getId()).ifPresent(s -> {
            if (isDeleted) {
                s.setStatus(UserSubscription.SubscriptionStatus.CANCELED);
                s.setCanceledAt(LocalDateTime.now());
            } else {
                if ("active".equalsIgnoreCase(sub.getStatus())) {
                    s.setStatus(UserSubscription.SubscriptionStatus.ACTIVE);
                } else if ("past_due".equalsIgnoreCase(sub.getStatus())) {
                    s.setStatus(UserSubscription.SubscriptionStatus.PAST_DUE);
                } else if ("canceled".equalsIgnoreCase(sub.getStatus())) {
                    s.setStatus(UserSubscription.SubscriptionStatus.CANCELED);
                }
                if (sub.getCurrentPeriodEnd() != null) {
                    s.setCurrentPeriodEnd(LocalDateTime.ofInstant(Instant.ofEpochSecond(sub.getCurrentPeriodEnd()), ZoneId.systemDefault()));
                }
                s.setCancelAtPeriodEnd(Boolean.TRUE.equals(sub.getCancelAtPeriodEnd()));
            }
            subscriptionRepository.save(s);
            log.info("Updated subscription {} status to {}", s.getStripeSubscriptionId(), s.getStatus());
        });
    }

    private MembershipPlanResponse toPlanResponse(MembershipPlan p) {
        return MembershipPlanResponse.builder()
                .id(p.getId())
                .name(p.getName())
                .code(p.getCode())
                .description(p.getDescription())
                .price(p.getPrice())
                .billingCycle(p.getBillingCycle() != null ? p.getBillingCycle().name() : null)
                .stripePriceId(p.getStripePriceId())
                .stripeProductId(p.getStripeProductId())
                .maxActiveLoans(p.getMaxActiveLoans())
                .loanDurationDays(p.getLoanDurationDays())
                .maxRenewals(p.getMaxRenewals())
                .status(p.getStatus() != null ? p.getStatus().name() : null)
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }

    private UserSubscriptionResponse toSubscriptionResponse(UserSubscription s) {
        return UserSubscriptionResponse.builder()
                .id(s.getId())
                .userId(s.getUser() != null ? s.getUser().getId() : null)
                .userEmail(s.getUser() != null ? s.getUser().getEmail() : null)
                .planId(s.getPlan() != null ? s.getPlan().getId() : null)
                .planName(s.getPlan() != null ? s.getPlan().getName() : null)
                .planCode(s.getPlan() != null ? s.getPlan().getCode() : null)
                .maxActiveLoans(s.getPlan() != null ? s.getPlan().getMaxActiveLoans() : 1)
                .loanDurationDays(s.getPlan() != null ? s.getPlan().getLoanDurationDays() : 7)
                .maxRenewals(s.getPlan() != null ? s.getPlan().getMaxRenewals() : 0)
                .status(s.getStatus() != null ? s.getStatus().name() : null)
                .stripeCustomerId(s.getStripeCustomerId())
                .stripeSubscriptionId(s.getStripeSubscriptionId())
                .currentPeriodStart(s.getCurrentPeriodStart())
                .currentPeriodEnd(s.getCurrentPeriodEnd())
                .cancelAtPeriodEnd(s.getCancelAtPeriodEnd())
                .canceledAt(s.getCanceledAt())
                .build();
    }
}
