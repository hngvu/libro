package soqe.libro.server.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import soqe.libro.server.entity.Genre;

public record GenreUpdateRequest(
        @NotBlank(message = "Name cannot be empty")
        @Size(max = 255)
        String name,
        
        @Size(max = 255)
        String handle,
        
        String description,
        
        Genre.Status status
) {}
