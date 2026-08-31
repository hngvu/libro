package soqe.libro.server.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import soqe.libro.server.repository.PublisherRepository;
import soqe.libro.server.entity.Publisher;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PublisherService {
    private final PublisherRepository repository;

    public List<Publisher> findAll() {
        return repository.findAll();
    }

    public Optional<Publisher> findById(Long id) {
        return repository.findById(id);
    }

    public Publisher save(Publisher entity) {
        return repository.save(entity);
    }

    public Publisher update(Long id, Publisher entity) {
        // TODO: Thêm logic kiểm tra tồn tại và map fields trước khi save
        entity.setId(id); // Basic mapping
        return repository.save(entity);
    }

    public void deleteById(Long id) {
        repository.deleteById(id);
    }
}
