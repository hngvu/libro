package soqe.libro.server.dto;
import lombok.Builder;
@Builder
public record PublisherPublicResponse(String name, String handle, String address, String website) {}
