package soqe.libro.server.dto;

import lombok.Builder;

import java.time.LocalDate;
import java.util.List;

@Builder
public record LoanPublicResponse(
        String loanCode,
        String bookTitle,
        String bookHandle,
        String bookCover,
        List<String> authors,
        String barcode,
        LocalDate borrowDate,
        LocalDate dueDate,
        LocalDate returnDate,
        String status,
        Integer renewalCount
) {}

