package soqe.libro.server.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import soqe.libro.server.entity.Loan;

@Repository
public interface LoanRepository extends JpaRepository<Loan, Long> {
}
