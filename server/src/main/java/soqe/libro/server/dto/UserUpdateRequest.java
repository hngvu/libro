package soqe.libro.server.dto;

import soqe.libro.server.entity.User;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UserUpdateRequest(
        @Email(message = "Invalid email format")
        String email,
        
        String fullName,
        
        String phone,
        
        User.Role role,
        User.Status status
) {
}
