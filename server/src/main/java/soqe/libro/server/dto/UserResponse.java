package soqe.libro.server.dto;

public record UserResponse(
        String username,
        String email,
        String fullName,
        String phone,
        String role
) {
}
