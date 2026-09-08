package soqe.libro.server.dto;
import lombok.Builder;
@Builder
public record AuthorResponse(Long id, String name, String handle, String biography, String status) {}
