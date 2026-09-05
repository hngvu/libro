package soqe.libro.server.dto;

import lombok.Builder;

@Builder
public record UserResponse(
        String username,
        String email,
        String fullName,
        String phone,
        String role,
        String status
) {}
