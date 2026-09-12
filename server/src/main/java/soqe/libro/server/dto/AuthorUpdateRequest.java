package soqe.libro.server.dto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import soqe.libro.server.entity.Author;
public record AuthorUpdateRequest(
        @NotBlank(message = "Name cannot be empty")
        @Size(max = 255)
        String name,
        @NotBlank(message = "Handle cannot be empty")
        @Size(max = 255)
        String handle,
        String biography,
        String image,
        Author.Status status
) {}
