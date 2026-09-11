package soqe.libro.server.dto;

import lombok.Builder;
import java.util.Set;

@Builder
public record BookResponse(
        Long id,
        String title,
        String handle,
        String slug,
        String isbn,
        Integer publicationYear,
        String cover,
        String edition,
        String format,
        Integer pageCount,
        String language,
        String description,
        Integer totalCopies,
        Integer availableCopies,
        String status,
        Set<AuthorResponse> authors,
        Set<GenreResponse> genres,
        PublisherResponse publisher
) {}

