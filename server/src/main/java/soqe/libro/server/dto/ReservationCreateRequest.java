package soqe.libro.server.dto;

public record ReservationCreateRequest(
        Long bookId,
        String bookHandle
) {}
