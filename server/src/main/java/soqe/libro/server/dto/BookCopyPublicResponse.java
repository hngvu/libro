package soqe.libro.server.dto;
import lombok.Builder;
@Builder
public record BookCopyPublicResponse(
        String barcode,
        String status,
        String location
) {}
