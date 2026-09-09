package soqe.libro.server.dto;

import lombok.Builder;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Builder
public record LoanResponse(
        Long id,
        String loanCode,
        Long userId,
        String userEmail,
        String userFullName,
        Long bookCopyId,
        String barcode,
        Long bookId,
        String bookTitle,
        String bookHandle,
        LocalDate borrowDate,
        LocalDate dueDate,
        LocalDate returnDate,
        String status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        String createdBy,
        String updatedBy
) {}
