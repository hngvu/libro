package soqe.libro.server.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import soqe.libro.server.dto.UserCreateRequest;
import soqe.libro.server.dto.UserResponse;
import soqe.libro.server.dto.UserUpdateRequest;
import soqe.libro.server.entity.User;
import soqe.libro.server.service.UserService;

@RestController
@RequestMapping("/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<Page<UserResponse>> searchUsers(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) User.Role role,
            @RequestParam(required = false) User.Status status,
            Pageable pageable) {
        return ResponseEntity.ok(userService.searchUsers(keyword, role, status, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserForAdmin(id));
    }

    @PostMapping
    public ResponseEntity<UserResponse> createUser(@jakarta.validation.Valid @RequestBody UserCreateRequest request) {
        return ResponseEntity.ok(userService.createUserByAdmin(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserResponse> updateUser(@PathVariable Long id, @jakarta.validation.Valid @RequestBody UserUpdateRequest request) {
        return ResponseEntity.ok(userService.updateUserByAdmin(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUserByAdmin(id);
        return ResponseEntity.noContent().build();
    }
}
