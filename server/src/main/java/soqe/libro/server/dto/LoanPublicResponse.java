package soqe.libro.server.dto;

import lombok.Builder;

import java.time.LocalDate;

@Builder
public record LoanPublicResponse(
        String loanCode,
        String bookTitle,
        String bookHandle,
        String bookCover,
        String barcode,
        LocalDate borrowDate,
        LocalDate dueDate,
        LocalDate returnDate,
        String status
) {}
