package soqe.libro.server.dto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
public record PublisherCreateRequest(
        @NotBlank(message = "Name cannot be empty")
        @Size(max = 255)
        String name,
        @NotBlank(message = "Handle cannot be empty")
        @Size(max = 255)
        String handle,
        String address,
        String website
) {}
