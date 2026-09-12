package soqe.libro.server.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.web.bind.annotation.*;
import soqe.libro.server.dto.FinePublicResponse;
import soqe.libro.server.dto.StripeCheckoutResponse;
import soqe.libro.server.entity.Fine;
import soqe.libro.server.service.FineService;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/fines")
@RequiredArgsConstructor
public class FineController {

    private final FineService fineService;

    @GetMapping("/my-fines")
    public ResponseEntity<Page<FinePublicResponse>> getMyFines(
            Principal principal,
            @RequestParam(required = false) List<Fine.FineStatus> status,
            Pageable pageable) {
        if (principal == null) {
            throw new AuthenticationCredentialsNotFoundException("Not authenticated");
        }
        return ResponseEntity.ok(fineService.getMyFinesByEmail(principal.getName(), status, pageable));
    }

    @PostMapping("/{codeOrId}/checkout-session")
    public ResponseEntity<StripeCheckoutResponse> createCheckoutSession(
            Principal principal,
            @PathVariable String codeOrId,
            @RequestParam(required = false) String clientBaseUrl) {
        if (principal == null) {
            throw new AuthenticationCredentialsNotFoundException("Not authenticated");
        }
        if (codeOrId.matches("\\d+")) {
            return ResponseEntity.ok(fineService.createStripeCheckoutSession(Long.parseLong(codeOrId), principal.getName(), clientBaseUrl));
        }
        return ResponseEntity.ok(fineService.createStripeCheckoutSessionByCode(codeOrId, principal.getName(), clientBaseUrl));
    }
}
