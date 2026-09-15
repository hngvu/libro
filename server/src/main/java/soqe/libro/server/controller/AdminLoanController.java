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
            @RequestParam(required = false) java.util.List<Loan.LoanStatus> status,
            @RequestParam(required = false) java.util.List<Long> userId,
            @RequestParam(required = false) java.util.List<Long> bookCopyId,
            @RequestParam(required = false) Boolean isOverdue,
            @RequestParam(required = false) Boolean hasRenewals,
            Pageable pageable) {
        return ResponseEntity.ok(loanService.searchLoansForAdminMulti(keyword, status, userId, bookCopyId, isOverdue, hasRenewals, pageable));
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

    @PostMapping("/{id}/report-lost")
    public ResponseEntity<LoanResponse> reportLost(
            @PathVariable Long id,
            @RequestParam(required = false) java.math.BigDecimal amount) {
        return ResponseEntity.ok(loanService.reportLostByAdmin(id, amount));
    }

    @PostMapping("/{id}/report-damaged")
    public ResponseEntity<LoanResponse> reportDamaged(
            @PathVariable Long id,
            @RequestParam(required = false) java.math.BigDecimal amount,
            @RequestParam(required = false) String note) {
        return ResponseEntity.ok(loanService.reportDamagedByAdmin(id, amount, note));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> cancelLoan(@PathVariable Long id) {
        loanService.cancelLoanByAdmin(id);
        return ResponseEntity.noContent().build();
    }
}
