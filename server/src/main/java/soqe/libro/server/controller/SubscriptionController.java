package soqe.libro.server.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.web.bind.annotation.*;
import soqe.libro.server.dto.StripeCheckoutResponse;
import soqe.libro.server.dto.UserSubscriptionResponse;
import soqe.libro.server.service.SubscriptionService;

import java.security.Principal;

@RestController
@RequestMapping("/subscriptions")
@RequiredArgsConstructor
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    @GetMapping("/my-subscription")
    public ResponseEntity<UserSubscriptionResponse> getMySubscription(Principal principal) {
        if (principal == null) {
            throw new AuthenticationCredentialsNotFoundException("Not authenticated");
        }
        return ResponseEntity.ok(subscriptionService.getMySubscription(principal.getName()));
    }

    @PostMapping("/checkout-session")
    public ResponseEntity<StripeCheckoutResponse> createSubscriptionCheckoutSession(
            Principal principal,
            @RequestParam String planCode,
            @RequestParam(required = false, defaultValue = "MONTHLY") String billingCycle,
            @RequestParam(required = false) String clientBaseUrl) {
        if (principal == null) {
            throw new AuthenticationCredentialsNotFoundException("Not authenticated");
        }
        return ResponseEntity.ok(subscriptionService.createSubscriptionCheckoutSession(planCode, billingCycle, principal.getName(), clientBaseUrl));
    }

    @PostMapping("/portal-session")
    public ResponseEntity<StripeCheckoutResponse> createCustomerPortalSession(
            Principal principal,
            @RequestParam(required = false) String returnUrl) {
        if (principal == null) {
            throw new AuthenticationCredentialsNotFoundException("Not authenticated");
        }
        return ResponseEntity.ok(subscriptionService.createCustomerPortalSession(principal.getName(), returnUrl));
    }
}
