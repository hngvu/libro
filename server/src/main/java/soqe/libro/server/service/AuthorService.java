package soqe.libro.server.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import soqe.libro.server.dto.*;
import soqe.libro.server.entity.Author;
import soqe.libro.server.repository.AuthorRepository;
import soqe.libro.server.specification.AuthorSpecification;
import soqe.libro.server.exception.BusinessValidationException;
import soqe.libro.server.exception.ResourceNotFoundException;
import org.springframework.util.StringUtils;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthorService {
    private final AuthorRepository repository;

    @Transactional(readOnly = true)
    public Page<AuthorResponse> searchForAdmin(String keyword, Author.Status status, Pageable pageable) {
        return repository.findAll(AuthorSpecification.filter(keyword, status), pageable)
                .map(a -> AuthorResponse.builder()
                        .id(a.getId())
                        .name(a.getName())
                        .handle(a.getHandle())
                        .biography(a.getBiography())
                        .image(a.getImage())
                        .status(a.getStatus() != null ? a.getStatus().name() : null)
                        .bookCount(a.getBooks() != null ? a.getBooks().size() : 0)
                        .build());
    }

    @Transactional(readOnly = true)
    public AuthorResponse getForAdmin(Long id) {
        Author a = repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Author not found"));
        return AuthorResponse.builder()
                .id(a.getId())
                .name(a.getName())
                .handle(a.getHandle())
                .biography(a.getBiography())
                .image(a.getImage())
                .status(a.getStatus() != null ? a.getStatus().name() : null)
                .bookCount(a.getBooks() != null ? a.getBooks().size() : 0)
                .build();
    }

    @Transactional
    public AuthorResponse createByAdmin(AuthorCreateRequest req) {
        validateUnique(req.handle(), null);
        Author a = Author.builder().name(req.name()).handle(req.handle()).biography(req.biography()).image(req.image()).status(Author.Status.ACTIVE).build();
        a = repository.save(a);
        return AuthorResponse.builder().id(a.getId()).name(a.getName()).handle(a.getHandle()).biography(a.getBiography()).image(a.getImage()).status(a.getStatus().name()).bookCount(0).build();
    }

    @Transactional
    public AuthorResponse updateByAdmin(Long id, AuthorUpdateRequest req) {
        Author a = repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Author not found"));
        if (StringUtils.hasText(req.handle()) && !req.handle().equals(a.getHandle())) {
            validateUnique(req.handle(), id);
            a.setHandle(req.handle().trim());
        }
        a.setName(req.name());
        a.setBiography(req.biography());
        a.setImage(req.image());
        if (req.status() != null) a.setStatus(req.status());
        a = repository.save(a);
        return AuthorResponse.builder()
                .id(a.getId())
                .name(a.getName())
                .handle(a.getHandle())
                .biography(a.getBiography())
                .image(a.getImage())
                .status(a.getStatus() != null ? a.getStatus().name() : null)
                .bookCount(a.getBooks() != null ? a.getBooks().size() : 0)
                .build();
    }

    @Transactional
    public void deleteByAdmin(Long id) {
        Author a = repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Author not found"));
        a.setStatus(Author.Status.INACTIVE);
        repository.save(a);
    }

    @Transactional(readOnly = true)
    public Page<AuthorPublicResponse> searchPublic(String keyword, Pageable pageable) {
        return repository.findAll(AuthorSpecification.filter(keyword, Author.Status.ACTIVE), pageable)
                .map(a -> AuthorPublicResponse.builder().name(a.getName()).handle(a.getHandle()).biography(a.getBiography()).image(a.getImage()).build());
    }

    @Transactional(readOnly = true)
    public AuthorPublicResponse getByHandle(String handle) {
        Author a = repository.findByHandle(handle).filter(x -> x.getStatus() == Author.Status.ACTIVE).orElseThrow(() -> new ResourceNotFoundException("Author not found"));
        return AuthorPublicResponse.builder().name(a.getName()).handle(a.getHandle()).biography(a.getBiography()).image(a.getImage()).build();
    }

    private void validateUnique(String handle, Long excludeId) {
        Map<String, String> errors = new HashMap<>();
        if (StringUtils.hasText(handle)) {
            repository.findByHandle(handle).ifPresent(a -> { if (excludeId == null || !a.getId().equals(excludeId)) errors.put("handle", "Handle is taken"); });
        }
        if (!errors.isEmpty()) throw new BusinessValidationException("Validation failed", errors);
    }
}
