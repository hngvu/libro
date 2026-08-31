package soqe.libro.server.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import soqe.libro.server.repository.BookCopyRepository;
import soqe.libro.server.entity.BookCopy;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class BookCopyService {
    private final BookCopyRepository repository;

    public List<BookCopy> findAll() {
        return repository.findAll();
    }

    public Optional<BookCopy> findById(Long id) {
        return repository.findById(id);
    }

    public BookCopy save(BookCopy entity) {
        return repository.save(entity);
    }

    public BookCopy update(Long id, BookCopy entity) {
        // TODO: Thêm logic kiểm tra tồn tại và map fields trước khi save
        entity.setId(id); // Basic mapping
        return repository.save(entity);
    }

    public void deleteById(Long id) {
        repository.deleteById(id);
    }
}
