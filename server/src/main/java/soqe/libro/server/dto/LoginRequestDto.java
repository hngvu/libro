package soqe.libro.server.dto;

import lombok.Builder;

@Builder
public record LoginRequestDto(
    String email,
    String password
) {}
