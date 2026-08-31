package soqe.libro.server.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import soqe.libro.server.repository.AuthorRepository;
import soqe.libro.server.entity.Author;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthorService {
    private final AuthorRepository repository;

    public List<Author> findAll() {
        return repository.findAll();
    }

    public Optional<Author> findById(Long id) {
        return repository.findById(id);
    }

    public Author save(Author entity) {
        return repository.save(entity);
    }

    public Author update(Long id, Author entity) {
        // TODO: Thêm logic kiểm tra tồn tại và map fields trước khi save
        entity.setId(id); // Basic mapping
        return repository.save(entity);
    }

    public void deleteById(Long id) {
        repository.deleteById(id);
    }
}
