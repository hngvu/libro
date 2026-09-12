package soqe.libro.server.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import soqe.libro.server.dto.MembershipPlanCreateRequest;
import soqe.libro.server.dto.MembershipPlanResponse;
import soqe.libro.server.dto.UserSubscriptionResponse;
import soqe.libro.server.service.SubscriptionService;

import java.util.List;

@RestController
@RequestMapping("/admin/membership-plans")
@RequiredArgsConstructor
public class AdminMembershipPlanController {

    private final SubscriptionService subscriptionService;

    @GetMapping
    public ResponseEntity<List<MembershipPlanResponse>> getAllPlans() {
        return ResponseEntity.ok(subscriptionService.getAllPlansAdmin());
    }

    @PostMapping
    public ResponseEntity<MembershipPlanResponse> createPlan(@Valid @RequestBody MembershipPlanCreateRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(subscriptionService.createPlan(req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<MembershipPlanResponse> updatePlan(@PathVariable Long id, @Valid @RequestBody MembershipPlanCreateRequest req) {
        return ResponseEntity.ok(subscriptionService.updatePlan(id, req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePlan(@PathVariable Long id) {
        subscriptionService.deletePlan(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/user-subscriptions")
    public ResponseEntity<List<UserSubscriptionResponse>> getUserSubscriptions() {
        return ResponseEntity.ok(subscriptionService.getAllUserSubscriptionsAdmin());
    }

    @PostMapping("/user-subscriptions/{id}/cancel")
    public ResponseEntity<UserSubscriptionResponse> cancelUserSubscription(@PathVariable Long id) {
        return ResponseEntity.ok(subscriptionService.cancelUserSubscriptionAdmin(id));
    }
}
