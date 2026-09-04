package soqe.libro.server.dto;

import lombok.Builder;

@Builder
public record RegisterRequest(
    String username,
    String email,
    String password,
    String fullName,
    String phone
) {}
