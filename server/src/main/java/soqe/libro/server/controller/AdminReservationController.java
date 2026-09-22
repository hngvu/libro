package soqe.libro.server.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import soqe.libro.server.dto.ReservationResponse;
import soqe.libro.server.entity.Reservation;
import soqe.libro.server.service.ReservationService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/reservations")
@RequiredArgsConstructor
public class AdminReservationController {

    private final ReservationService reservationService;

    @GetMapping
    public ResponseEntity<Page<ReservationResponse>> searchReservations(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) List<Reservation.ReservationStatus> status,
            @RequestParam(required = false) List<Long> userId,
            @RequestParam(required = false) List<Long> bookId,
            Pageable pageable) {
        return ResponseEntity.ok(reservationService.getReservationsForAdmin(keyword, status, userId, bookId, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReservationResponse> getReservationById(@PathVariable Long id) {
        return ResponseEntity.ok(reservationService.getReservationDetail(id));
    }

    @PostMapping("/{id}/ready")
    public ResponseEntity<ReservationResponse> markReadyForPickup(
            @PathVariable Long id,
            @RequestParam(required = false) Long bookCopyId) {
        return ResponseEntity.ok(reservationService.markReadyForPickupManual(id, bookCopyId));
    }

    @PostMapping("/{id}/fulfill")
    public ResponseEntity<ReservationResponse> fulfillReservation(
            @PathVariable Long id,
            @RequestParam(required = false) String barcode,
            @RequestParam(required = false) Long bookCopyId) {
        return ResponseEntity.ok(reservationService.fulfillReservation(id, barcode, bookCopyId));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<ReservationResponse> cancelReservation(
            @PathVariable Long id,
            @RequestParam(required = false) String reason) {
        return ResponseEntity.ok(reservationService.cancelReservationByAdmin(id, reason));
    }

    @PostMapping("/process-expired")
    public ResponseEntity<Map<String, Object>> processExpired() {
        int count = reservationService.processExpiredReservations();
        return ResponseEntity.ok(Map.of(
                "message", "Expired reservations processed successfully",
                "expiredCount", count
        ));
    }
}
