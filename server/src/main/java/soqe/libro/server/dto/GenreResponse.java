package soqe.libro.server.dto;
import lombok.Builder;
@Builder
public record GenreResponse(
        Long id,
        String name,
        String handle,
        String description,
        String status
) {}
