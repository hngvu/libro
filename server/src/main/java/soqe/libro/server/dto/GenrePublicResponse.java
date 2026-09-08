package soqe.libro.server.dto;
import lombok.Builder;
@Builder
public record GenrePublicResponse(
        String name,
        String handle,
        String description
) {}
