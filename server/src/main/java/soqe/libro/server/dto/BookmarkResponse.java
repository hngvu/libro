package soqe.libro.server.dto;

import lombok.Builder;
import java.time.LocalDateTime;
import java.util.List;

@Builder
public record BookmarkResponse(
        Long id,
        Long bookId,
        String bookTitle,
        String bookHandle,
        String bookSlug,
        String bookCover,
        String isbn,
        Integer publicationYear,
        Integer totalCopies,
        Integer availableCopies,
        List<String> authors,
        List<String> genres,
        LocalDateTime createdAt
) {}
