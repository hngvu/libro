package soqe.libro.server.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import soqe.libro.server.service.FineService;

@Slf4j
@RestController
@RequestMapping("/webhooks/stripe")
@RequiredArgsConstructor
public class StripeWebhookController {

    private final FineService fineService;
    private final soqe.libro.server.service.SubscriptionService subscriptionService;

    @PostMapping
    public ResponseEntity<String> handleStripeWebhook(
            @RequestBody String payload,
            @RequestHeader(value = "Stripe-Signature", required = false) String sigHeader) {
        log.info("Received Stripe Webhook callback");
        com.stripe.model.Event event = fineService.constructEvent(payload, sigHeader);
        fineService.processFineWebhook(event);
        subscriptionService.processSubscriptionWebhook(event);
        return ResponseEntity.ok("Webhook processed");
    }
}
