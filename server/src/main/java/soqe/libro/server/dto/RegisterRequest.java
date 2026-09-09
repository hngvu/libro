package soqe.libro.server.dto;

import lombok.Builder;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Builder
public record RegisterRequest(
    @NotBlank(message = "Email cannot be empty")
    @Email(message = "Invalid email format")
    String email,
    
    @NotBlank(message = "Password cannot be empty")
    @Size(min = 6, message = "Password must be at least 6 characters")
    String password,
    
    @NotBlank(message = "Full name cannot be empty")
    String fullName,
    
    String phone
) {}
