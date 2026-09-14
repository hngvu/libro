package soqe.libro.server.dto;
import lombok.Builder;
import java.time.LocalDate;
import java.util.List;

@Builder
public record BookCopyResponse(
        Long id,
        String barcode,
        String status,
        String location,
        Long bookId,
        String bookTitle,
        String bookCover,
        List<String> authors,
        LocalDate lastLoanDate
) {}
