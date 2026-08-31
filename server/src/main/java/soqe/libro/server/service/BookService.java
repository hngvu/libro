package soqe.libro.server.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import soqe.libro.server.repository.BookRepository;
import soqe.libro.server.entity.Book;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class BookService {
    private final BookRepository repository;

    public List<Book> findAll() {
        return repository.findAll();
    }

    public Optional<Book> findById(Long id) {
        return repository.findById(id);
    }

    public Book save(Book entity) {
        return repository.save(entity);
    }

    public Book update(Long id, Book entity) {
        // TODO: Thêm logic kiểm tra tồn tại và map fields trước khi save
        entity.setId(id); // Basic mapping
        return repository.save(entity);
    }

    public void deleteById(Long id) {
        repository.deleteById(id);
    }
}
