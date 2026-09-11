package soqe.libro.server.dto;
import lombok.Builder;
import java.time.LocalDate;

@Builder
public record BookCopyResponse(
        Long id,
        String barcode,
        String status,
        String location,
        Long bookId,
        String bookTitle,
        LocalDate lastLoanDate
) {}
