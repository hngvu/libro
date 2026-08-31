package soqe.libro.server.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import soqe.libro.server.entity.User;
import soqe.libro.server.service.AuthService;

import soqe.libro.server.dto.LoginRequestDto;
import soqe.libro.server.dto.RegisterRequestDto;
import soqe.libro.server.dto.ApiResponse;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<String>> login(@RequestBody LoginRequestDto request) {
        String token = authService.login(request.email(), request.password());
        return ResponseEntity.ok(ApiResponse.success("Login successful", token));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<String>> register(@RequestBody RegisterRequestDto request) {
        return ResponseEntity.ok(ApiResponse.success(authService.register(request), null));
    }
}
