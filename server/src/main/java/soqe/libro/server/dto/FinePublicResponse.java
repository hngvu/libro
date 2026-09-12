package soqe.libro.server.dto;

import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Builder
public record FinePublicResponse(
        String fineCode,
        String loanCode,
        String bookTitle,
        String bookHandle,
        String bookCover,
        BigDecimal amount,
        String reason,
        Integer daysOverdue,
        String status,
        String paymentMethod,
        LocalDateTime paidAt,
        LocalDateTime createdAt
) {}
