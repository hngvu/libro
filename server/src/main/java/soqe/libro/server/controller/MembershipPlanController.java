package soqe.libro.server.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import soqe.libro.server.dto.MembershipPlanResponse;
import soqe.libro.server.service.SubscriptionService;

import java.util.List;

@RestController
@RequestMapping("/membership-plans")
@RequiredArgsConstructor
public class MembershipPlanController {

    private final SubscriptionService subscriptionService;

    @GetMapping
    public ResponseEntity<List<MembershipPlanResponse>> getPlans() {
        return ResponseEntity.ok(subscriptionService.getPublicPlans());
    }

    @GetMapping("/{code}")
    public ResponseEntity<MembershipPlanResponse> getPlanByCode(@PathVariable String code) {
        return ResponseEntity.ok(subscriptionService.getPlanByCode(code));
    }
}
