package soqe.libro.server.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import soqe.libro.server.dto.LoanCreateRequest;
import soqe.libro.server.dto.LoanRenewRequest;
import soqe.libro.server.dto.LoanResponse;
import soqe.libro.server.entity.Loan;
import soqe.libro.server.service.LoanService;

@RestController
@RequestMapping("/admin/loans")
@RequiredArgsConstructor
public class AdminLoanController {

    private final LoanService loanService;

    @GetMapping
    public ResponseEntity<Page<LoanResponse>> searchLoans(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Loan.LoanStatus status,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) Long bookCopyId,
            @RequestParam(required = false) Boolean isOverdue,
            Pageable pageable) {
        return ResponseEntity.ok(loanService.searchLoansForAdmin(keyword, status, userId, bookCopyId, isOverdue, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<LoanResponse> getLoanById(@PathVariable Long id) {
        return ResponseEntity.ok(loanService.getLoanForAdmin(id));
    }

    @PostMapping
    public ResponseEntity<LoanResponse> createLoan(@Valid @RequestBody LoanCreateRequest request) {
        return ResponseEntity.ok(loanService.createLoanByAdmin(request));
    }

    @PostMapping("/{id}/return")
    public ResponseEntity<LoanResponse> returnLoan(@PathVariable Long id) {
        return ResponseEntity.ok(loanService.returnLoanByAdmin(id));
    }

    @PostMapping("/{id}/renew")
    public ResponseEntity<LoanResponse> renewLoan(
            @PathVariable Long id,
            @Valid @RequestBody(required = false) LoanRenewRequest request) {
        return ResponseEntity.ok(loanService.renewLoanByAdmin(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> cancelLoan(@PathVariable Long id) {
        loanService.cancelLoanByAdmin(id);
        return ResponseEntity.noContent().build();
    }
}
