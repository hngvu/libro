package soqe.libro.server.dto;

import lombok.Builder;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Builder
public record ReservationResponse(
        Long id,
        String reservationCode,
        Long userId,
        String userEmail,
        String userFullName,
        String userPhone,
        Long bookId,
        String bookTitle,
        String bookHandle,
        String bookCover,
        Long bookCopyId,
        String barcode,
        String location,
        String status,
        LocalDateTime reservedAt,
        LocalDate pickupDeadline,
        LocalDateTime fulfilledAt,
        Integer queuePosition,
        String cancellationReason,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
