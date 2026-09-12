package soqe.libro.server.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.web.bind.annotation.*;
import soqe.libro.server.dto.ReservationCreateRequest;
import soqe.libro.server.dto.ReservationResponse;
import soqe.libro.server.entity.Reservation;
import soqe.libro.server.service.ReservationService;

import java.security.Principal;

@RestController
@RequestMapping("/reservations")
@RequiredArgsConstructor
public class ReservationController {

    private final ReservationService reservationService;

    @PostMapping
    public ResponseEntity<ReservationResponse> placeReservation(
            Principal principal,
            @Valid @RequestBody ReservationCreateRequest request) {
        if (principal == null) {
            throw new AuthenticationCredentialsNotFoundException("Not authenticated");
        }
        ReservationResponse res = reservationService.createReservation(principal.getName(), request.bookId(), request.bookHandle());
        return ResponseEntity.status(HttpStatus.CREATED).body(res);
    }

    @GetMapping("/my-reservations")
    public ResponseEntity<Page<ReservationResponse>> getMyReservations(
            Principal principal,
            @RequestParam(required = false) Reservation.ReservationStatus status,
            Pageable pageable) {
        if (principal == null) {
            throw new AuthenticationCredentialsNotFoundException("Not authenticated");
        }
        return ResponseEntity.ok(reservationService.getMyReservations(principal.getName(), status, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReservationResponse> getReservationDetail(
            Principal principal,
            @PathVariable Long id) {
        if (principal == null) {
            throw new AuthenticationCredentialsNotFoundException("Not authenticated");
        }
        return ResponseEntity.ok(reservationService.getReservationDetail(id));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<ReservationResponse> cancelMyReservation(
            Principal principal,
            @PathVariable Long id,
            @RequestParam(required = false) String reason) {
        if (principal == null) {
            throw new AuthenticationCredentialsNotFoundException("Not authenticated");
        }
        return ResponseEntity.ok(reservationService.cancelReservationByPatron(principal.getName(), id, reason));
    }
}
