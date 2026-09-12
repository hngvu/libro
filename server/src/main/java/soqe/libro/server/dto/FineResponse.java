package soqe.libro.server.dto;

import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Builder
public record FineResponse(
        Long id,
        String fineCode,
        Long userId,
        String userEmail,
        String userFullName,
        Long loanId,
        String loanCode,
        Long bookId,
        String bookTitle,
        String bookHandle,
        BigDecimal amount,
        String reason,
        Integer daysOverdue,
        String status,
        String paymentMethod,
        String stripeSessionId,
        String stripePaymentIntentId,
        LocalDateTime paidAt,
        LocalDateTime waivedAt,
        String waivedReason,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        String createdBy,
        String updatedBy
) {}
