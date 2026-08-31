package soqe.libro.server.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import soqe.libro.server.repository.GenreRepository;
import soqe.libro.server.entity.Genre;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class GenreService {
    private final GenreRepository repository;

    public List<Genre> findAll() {
        return repository.findAll();
    }

    public Optional<Genre> findById(Long id) {
        return repository.findById(id);
    }

    public Genre save(Genre entity) {
        return repository.save(entity);
    }

    public Genre update(Long id, Genre entity) {
        // TODO: Thêm logic kiểm tra tồn tại và map fields trước khi save
        entity.setId(id); // Basic mapping
        return repository.save(entity);
    }

    public void deleteById(Long id) {
        repository.deleteById(id);
    }
}
