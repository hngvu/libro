package soqe.libro.server.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;
import soqe.libro.server.entity.User;
import soqe.libro.server.repository.UserRepository;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import soqe.libro.server.dto.RegisterRequest;

import soqe.libro.server.exception.ResourceNotFoundException;
import soqe.libro.server.exception.BadRequestException;
import soqe.libro.server.exception.DuplicateResourceException;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final JwtEncoder jwtEncoder;

    public void register(RegisterRequest request) {
        userService.validateUniqueConstraints(request.username(), request.email());

        User user = User.builder()
                .username(request.username())
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .fullName(request.fullName())
                .phone(request.phone())
                .role(User.Role.MEMBER)
                .status(User.Status.ACTIVE)
                .build();
        
        userRepository.save(user);
    }

    public String login(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
                
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new org.springframework.security.authentication.BadCredentialsException("Invalid credentials");
        }
        
        if (user.getStatus() != User.Status.ACTIVE) {
            throw new org.springframework.security.authentication.DisabledException("Account is not active");
        }
        
        return generateToken(user);
    }
    
    private String generateToken(User user) {
        return jwtEncoder.encode(
                JwtEncoderParameters.from(
                        JwsHeader.with(MacAlgorithm.HS256)
                                .type("JWT")
                                .build(),
                        JwtClaimsSet.builder()
                                .id(UUID.randomUUID().toString())
                                .subject(user.getEmail())
                                .claim("scope", user.getRole().name())
                                .issuedAt(Instant.now())
                                .expiresAt(Instant.now().plus(1, ChronoUnit.DAYS)) // 24 hours
                                .build()
                )
        ).getTokenValue();
    }
}
