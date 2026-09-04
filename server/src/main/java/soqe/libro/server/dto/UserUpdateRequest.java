package soqe.libro.server.dto;

import soqe.libro.server.entity.User;

public record UserUpdateRequest(
        String username,
        String email,
        String fullName,
        String phone,
        User.Role role
) {
}
