package soqe.libro.server.dto;
import lombok.Builder;
@Builder
public record PublisherResponse(Long id, String name, String handle, String address, String website, String status) {}
