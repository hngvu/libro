package soqe.libro.server.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;
import soqe.libro.server.entity.Loan;
import soqe.libro.server.entity.User;

import java.util.Optional;

@Repository
public interface LoanRepository extends JpaRepository<Loan, Long>, JpaSpecificationExecutor<Loan> {
    Optional<Loan> findByLoanCode(String loanCode);
    Optional<Loan> findByLoanCodeAndUser(String loanCode, User user);
    Page<Loan> findByUser(User user, Pageable pageable);
    Page<Loan> findByUserAndStatus(User user, Loan.LoanStatus status, Pageable pageable);
    long countByUserAndStatus(User user, Loan.LoanStatus status);
}
