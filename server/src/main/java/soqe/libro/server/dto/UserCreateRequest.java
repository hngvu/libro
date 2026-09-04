package soqe.libro.server.dto;

import soqe.libro.server.entity.User;

public record UserCreateRequest(
        String username,
        String email,
        String password,
        String fullName,
        String phone,
        User.Role role
) {
}
