package soqe.libro.server.dto;

import lombok.Builder;
import java.util.Set;

@Builder
public record BookPublicResponse(
        String title,
        String handle,
        String slug,
        String isbn,
        Integer publicationYear,
        String cover,
        String edition,
        String format,
        String description,
        Integer totalCopies,
        Integer availableCopies,
        Set<AuthorPublicResponse> authors,
        Set<GenrePublicResponse> genres,
        PublisherPublicResponse publisher
) {}

