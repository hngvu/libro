package soqe.libro.server.dto;
import lombok.Builder;
@Builder
public record AuthorPublicResponse(String name, String handle, String biography, String image) {}
