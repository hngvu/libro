package soqe.libro.server.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import soqe.libro.server.dto.UserCreateRequest;
import soqe.libro.server.dto.UserResponse;
import soqe.libro.server.dto.UserUpdateRequest;
import soqe.libro.server.entity.User;
import soqe.libro.server.repository.UserRepository;
import soqe.libro.server.specification.UserSpecification;

import soqe.libro.server.exception.DuplicateResourceException;
import soqe.libro.server.exception.ResourceNotFoundException;
import soqe.libro.server.exception.BusinessValidationException;
import java.util.HashMap;
import java.util.Map;

import org.springframework.security.crypto.password.PasswordEncoder;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository repository;
    private final PasswordEncoder passwordEncoder;

    // ==========================================
    // BACKOFFICE / ADMIN APIs
    // ==========================================

    @Transactional(readOnly = true)
    public Page<UserResponse> searchUsers(String keyword, User.Role role, User.Status status, Pageable pageable) {
        return searchUsersMulti(
                keyword,
                role != null ? java.util.List.of(role) : null,
                status != null ? java.util.List.of(status) : null,
                pageable
        );
    }

    @Transactional(readOnly = true)
    public Page<UserResponse> searchUsersMulti(String keyword, java.util.List<User.Role> roles, java.util.List<User.Status> statuses, Pageable pageable) {
        return repository.findAll(UserSpecification.filterMulti(keyword, roles, statuses), pageable)
                .map(user -> UserResponse.builder()
                        .email(user.getEmail())
                        .fullName(user.getFullName())
                        .phone(user.getPhone())
                        .role(user.getRole() != null ? user.getRole().name() : null)
                        .status(user.getStatus() != null ? user.getStatus().name() : null)
                        .build());
    }

    @Transactional(readOnly = true)
    public UserResponse getUserForAdmin(Long id) {
        User user = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        return UserResponse.builder()
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .role(user.getRole() != null ? user.getRole().name() : null)
                .status(user.getStatus() != null ? user.getStatus().name() : null)
                .build();
    }

    @Transactional
    public UserResponse createUserByAdmin(UserCreateRequest request) {
        validateEmailUnique(request.email());

        User user = User.builder()
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .fullName(request.fullName())
                .phone(request.phone())
                .role(request.role() != null ? request.role() : User.Role.MEMBER)
                .status(User.Status.ACTIVE)
                .build();

        user = repository.save(user);
        return UserResponse.builder()
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .role(user.getRole() != null ? user.getRole().name() : null)
                .status(user.getStatus() != null ? user.getStatus().name() : null)
                .build();
    }

    @Transactional
    public UserResponse updateUserByAdmin(Long id, UserUpdateRequest request) {
        User user = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        if (!user.getEmail().equals(request.email())) {
            validateEmailUnique(request.email());
            user.setEmail(request.email());
        }

        user.setFullName(request.fullName());
        user.setPhone(request.phone());
        
        if (request.role() != null) user.setRole(request.role());
        if (request.status() != null) user.setStatus(request.status());

        user = repository.save(user);
        return UserResponse.builder()
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .role(user.getRole() != null ? user.getRole().name() : null)
                .status(user.getStatus() != null ? user.getStatus().name() : null)
                .build();
    }

    @Transactional
    public void deleteUserByAdmin(Long id) {
        User user = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        user.setStatus(User.Status.INACTIVE);
        repository.save(user);
    }

    // ==========================================
    // END-USER APIs
    // ==========================================

    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(String email) {
        User user = repository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        return UserResponse.builder()
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .role(user.getRole() != null ? user.getRole().name() : null)
                .status(user.getStatus() != null ? user.getStatus().name() : null)
                .build();
    }

    @Transactional
    public UserResponse updateCurrentUser(String email, UserUpdateRequest request) {
        User user = repository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        if (!user.getEmail().equals(request.email())) {
            validateEmailUnique(request.email());
            user.setEmail(request.email());
        }

        user.setFullName(request.fullName());
        user.setPhone(request.phone());
        // Deliberately ignoring role and status from the request for end-users

        user = repository.save(user);
        return UserResponse.builder()
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .role(user.getRole() != null ? user.getRole().name() : null)
                .status(user.getStatus() != null ? user.getStatus().name() : null)
                .build();
    }

    // ==========================================
    // HELPER METHODS
    // ==========================================

    public void validateEmailUnique(String email) {
        if (repository.findByEmail(email).isPresent()) {
            throw new DuplicateResourceException("Email is already taken");
        }
    }
}
