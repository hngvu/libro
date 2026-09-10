package soqe.libro.server.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import soqe.libro.server.dto.LoanPublicResponse;
import soqe.libro.server.entity.Loan;
import soqe.libro.server.service.LoanService;

import java.security.Principal;

@RestController
@RequestMapping("/loans")
@RequiredArgsConstructor
public class LoanController {

    private final LoanService loanService;

    @GetMapping("/my-loans")
    public ResponseEntity<Page<LoanPublicResponse>> getMyLoans(
            Principal principal,
            @RequestParam(required = false) Loan.LoanStatus status,
            Pageable pageable) {
        if (principal == null) {
            throw new org.springframework.security.authentication.AuthenticationCredentialsNotFoundException("Not authenticated");
        }
        return ResponseEntity.ok(loanService.getMyLoans(principal.getName(), status, pageable));
    }

    @GetMapping("/{loanCode}")
    public ResponseEntity<LoanPublicResponse> getMyLoanDetail(
            Principal principal,
            @PathVariable String loanCode) {
        if (principal == null) {
            throw new org.springframework.security.authentication.AuthenticationCredentialsNotFoundException("Not authenticated");
        }
        return ResponseEntity.ok(loanService.getMyLoanDetail(principal.getName(), loanCode));
    }

    @PostMapping("/{loanCode}/renew")
    public ResponseEntity<LoanPublicResponse> renewMyLoan(
            Principal principal,
            @PathVariable String loanCode) {
        if (principal == null) {
            throw new org.springframework.security.authentication.AuthenticationCredentialsNotFoundException("Not authenticated");
        }
        return ResponseEntity.ok(loanService.renewMyLoan(principal.getName(), loanCode));
    }
}
