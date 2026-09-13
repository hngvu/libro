package soqe.libro.server.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import soqe.libro.server.entity.Book;
import java.util.Set;

public record BookUpdateRequest(
        @NotBlank(message = "Title cannot be empty")
        @Size(max = 255, message = "Title is too long")
        String title,

        @Size(max = 255)
        String slug,

        @Size(max = 50, message = "ISBN is too long")
        String isbn,

        Integer publicationYear,
        String cover,
        String edition,
        Book.Format format,
        Integer pageCount,
        String language,
        String work,
        String description,
        Book.Status status,
        Long publisherId,
        Set<Long> authorIds,
        Set<Long> genreIds
) {
}

