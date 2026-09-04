package soqe.libro.server.dto;

import lombok.Builder;

@Builder
public record LoginRequest(
    String email,
    String password
) {}
