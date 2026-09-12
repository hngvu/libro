package soqe.libro.server.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import soqe.libro.server.dto.FineResponse;
import soqe.libro.server.dto.FineWaiveRequest;
import soqe.libro.server.entity.Fine;
import soqe.libro.server.service.FineService;

import java.util.List;

@RestController
@RequestMapping("/admin/fines")
@RequiredArgsConstructor
public class AdminFineController {

    private final FineService fineService;

    @GetMapping
    public ResponseEntity<Page<FineResponse>> searchFines(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) List<Fine.FineStatus> status,
            @RequestParam(required = false) List<Fine.FineReason> reason,
            @RequestParam(required = false) List<Long> userId,
            Pageable pageable) {
        return ResponseEntity.ok(fineService.searchForAdmin(keyword, status, reason, userId, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<FineResponse> getFineById(@PathVariable Long id) {
        return ResponseEntity.ok(fineService.getForAdmin(id));
    }

    @PostMapping("/{id}/pay-cash")
    public ResponseEntity<FineResponse> payWithCash(@PathVariable Long id) {
        return ResponseEntity.ok(fineService.payWithCash(id));
    }

    @PostMapping("/{id}/waive")
    public ResponseEntity<FineResponse> waiveFine(
            @PathVariable Long id,
            @Valid @RequestBody FineWaiveRequest req) {
        return ResponseEntity.ok(fineService.waiveFine(id, req.reason()));
    }
}
