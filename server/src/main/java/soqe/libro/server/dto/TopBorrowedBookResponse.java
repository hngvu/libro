package soqe.libro.server.dto;

import lombok.Builder;
import java.util.List;

@Builder
public record TopBorrowedBookResponse(
    Long bookId,
    String bookHandle,
    String title,
    String cover,
    List<String> authors,
    long totalCheckouts,
    int totalCopies,
    int availableCopies
) {}
