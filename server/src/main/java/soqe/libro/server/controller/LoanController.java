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
        String username = (principal != null) ? principal.getName() : "test_user";
        return ResponseEntity.ok(loanService.getMyLoans(username, status, pageable));
    }

    @GetMapping("/{loanCode}")
    public ResponseEntity<LoanPublicResponse> getMyLoanDetail(
            Principal principal,
            @PathVariable String loanCode) {
        String username = (principal != null) ? principal.getName() : "test_user";
        return ResponseEntity.ok(loanService.getMyLoanDetail(username, loanCode));
    }
}
