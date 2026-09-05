package soqe.libro.server.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import soqe.libro.server.dto.UserResponse;
import soqe.libro.server.dto.UserUpdateRequest;
import soqe.libro.server.service.UserService;

import java.security.Principal;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(Principal principal) {
        // Fallback for testing if security context is not fully set up
        String username = (principal != null) ? principal.getName() : "test_user";
        return ResponseEntity.ok(userService.getCurrentUser(username));
    }

    @PutMapping("/me")
    public ResponseEntity<UserResponse> updateCurrentUser(
            Principal principal,
            @jakarta.validation.Valid @RequestBody UserUpdateRequest request) {
        // Fallback for testing if security context is not fully set up
        String username = (principal != null) ? principal.getName() : "test_user";
        return ResponseEntity.ok(userService.updateCurrentUser(username, request));
    }
}
