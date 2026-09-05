package soqe.libro.server.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import soqe.libro.server.entity.Book;

public record BookCreateRequest(
        @NotBlank(message = "Title cannot be empty")
        @Size(max = 255, message = "Title is too long")
        String title,

        @NotBlank(message = "Handle cannot be empty")
        @Size(min = 8, max = 8, message = "Handle must be exactly 8 characters")
        String handle,

        @NotBlank(message = "Slug cannot be empty")
        String slug,

        @Pattern(regexp = "^(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}$|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[- ]){4})[- 0-9]{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]$", message = "Invalid ISBN format")
        String isbn,

        Integer publicationYear,
        String cover,
        String edition,
        Book.Format format,
        String work,
        String description
) {
}
