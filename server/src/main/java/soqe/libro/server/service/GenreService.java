package soqe.libro.server.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import soqe.libro.server.dto.*;
import soqe.libro.server.entity.Genre;
import soqe.libro.server.repository.GenreRepository;
import soqe.libro.server.specification.GenreSpecification;
import soqe.libro.server.exception.BusinessValidationException;
import soqe.libro.server.exception.ResourceNotFoundException;
import org.springframework.util.StringUtils;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class GenreService {
    private final GenreRepository repository;

    @Transactional(readOnly = true)
    public Page<GenreResponse> searchGenresForAdmin(String keyword, Genre.Status status, Pageable pageable) {
        return repository.findAll(GenreSpecification.filter(keyword, status), pageable)
                .map(g -> GenreResponse.builder()
                        .id(g.getId())
                        .name(g.getName())
                        .handle(g.getHandle())
                        .description(g.getDescription())
                        .status(g.getStatus() != null ? g.getStatus().name() : null)
                        .bookCount(g.getBooks() != null ? g.getBooks().size() : 0)
                        .build());
    }

    @Transactional(readOnly = true)
    public GenreResponse getGenreForAdmin(Long id) {
        Genre g = repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Genre not found"));
        return GenreResponse.builder()
                .id(g.getId())
                .name(g.getName())
                .handle(g.getHandle())
                .description(g.getDescription())
                .status(g.getStatus() != null ? g.getStatus().name() : null)
                .bookCount(g.getBooks() != null ? g.getBooks().size() : 0)
                .build();
    }

    @Transactional
    public GenreResponse createGenreByAdmin(GenreCreateRequest req) {
        validateUniqueConstraints(req.name(), req.handle(), null);
        Genre g = Genre.builder()
                .name(req.name())
                .handle(req.handle())
                .description(req.description())
                .status(Genre.Status.ACTIVE)
                .build();
        g = repository.save(g);
        return GenreResponse.builder().id(g.getId()).name(g.getName()).handle(g.getHandle()).description(g.getDescription()).status(g.getStatus().name()).bookCount(0).build();
    }

    @Transactional
    public GenreResponse updateGenreByAdmin(Long id, GenreUpdateRequest req) {
        Genre g = repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Genre not found"));
        if (StringUtils.hasText(req.handle()) && !req.handle().equals(g.getHandle())) {
            validateUniqueConstraints(req.name(), req.handle(), id);
            g.setHandle(req.handle().trim());
        } else {
            validateUniqueConstraints(req.name(), null, id);
        }
        g.setName(req.name());
        g.setDescription(req.description());
        if (req.status() != null) g.setStatus(req.status());
        g = repository.save(g);
        return GenreResponse.builder()
                .id(g.getId())
                .name(g.getName())
                .handle(g.getHandle())
                .description(g.getDescription())
                .status(g.getStatus() != null ? g.getStatus().name() : null)
                .bookCount(g.getBooks() != null ? g.getBooks().size() : 0)
                .build();
    }

    @Transactional
    public void deleteGenreByAdmin(Long id) {
        Genre g = repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Genre not found"));
        g.setStatus(Genre.Status.INACTIVE);
        repository.save(g);
    }

    @Transactional(readOnly = true)
    public Page<GenrePublicResponse> searchGenres(String keyword, Pageable pageable) {
        return repository.findAll(GenreSpecification.filter(keyword, Genre.Status.ACTIVE), pageable)
                .map(g -> GenrePublicResponse.builder().name(g.getName()).handle(g.getHandle()).description(g.getDescription()).build());
    }

    @Transactional(readOnly = true)
    public GenrePublicResponse getGenreByHandle(String handle) {
        Genre g = repository.findByHandle(handle)
                .filter(x -> x.getStatus() == Genre.Status.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException("Genre not found"));
        return GenrePublicResponse.builder().name(g.getName()).handle(g.getHandle()).description(g.getDescription()).build();
    }

    private void validateUniqueConstraints(String name, String handle, Long excludeId) {
        Map<String, String> errors = new HashMap<>();
        if (StringUtils.hasText(name)) {
            repository.findByName(name).ifPresent(g -> { if (excludeId == null || !g.getId().equals(excludeId)) errors.put("name", "Name is taken"); });
        }
        if (StringUtils.hasText(handle)) {
            repository.findByHandle(handle).ifPresent(g -> { if (excludeId == null || !g.getId().equals(excludeId)) errors.put("handle", "Handle is taken"); });
        }
        if (!errors.isEmpty()) throw new BusinessValidationException("Validation failed", errors);
    }
}
