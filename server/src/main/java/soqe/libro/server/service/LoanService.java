package soqe.libro.server.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import soqe.libro.server.repository.LoanRepository;
import soqe.libro.server.entity.Loan;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class LoanService {
    private final LoanRepository repository;

    public List<Loan> findAll() {
        return repository.findAll();
    }

    public Optional<Loan> findById(Long id) {
        return repository.findById(id);
    }

    public Loan save(Loan entity) {
        return repository.save(entity);
    }

    public Loan update(Long id, Loan entity) {
        // TODO: Thêm logic kiểm tra tồn tại và map fields trước khi save
        entity.setId(id); // Basic mapping
        return repository.save(entity);
    }

    public void deleteById(Long id) {
        repository.deleteById(id);
    }
}
