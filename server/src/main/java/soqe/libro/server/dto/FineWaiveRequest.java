package soqe.libro.server.dto;

import jakarta.validation.constraints.NotBlank;

public record FineWaiveRequest(
        @NotBlank(message = "Reason for waiving fine is required")
        String reason
) {}
