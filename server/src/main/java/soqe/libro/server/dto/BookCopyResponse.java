package soqe.libro.server.dto;
import lombok.Builder;
@Builder
public record BookCopyResponse(
        Long id,
        String barcode,
        String status,
        Long bookId
) {}
