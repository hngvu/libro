package soqe.libro.server.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;
import soqe.libro.server.entity.Fine;
import soqe.libro.server.entity.Loan;
import soqe.libro.server.entity.User;

import java.util.Optional;

@Repository
public interface FineRepository extends JpaRepository<Fine, Long>, JpaSpecificationExecutor<Fine> {
    Optional<Fine> findByFineCode(String fineCode);
    Optional<Fine> findByStripeSessionId(String stripeSessionId);
    Optional<Fine> findByLoan(Loan loan);
    Page<Fine> findByUser(User user, Pageable pageable);
    Page<Fine> findByUserAndStatus(User user, Fine.FineStatus status, Pageable pageable);
    boolean existsByUserAndStatus(User user, Fine.FineStatus status);

    long countByStatus(Fine.FineStatus status);

    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(f.amount), 0) FROM Fine f WHERE f.status = :status")
    java.math.BigDecimal sumAmountByStatus(@org.springframework.data.repository.query.Param("status") Fine.FineStatus status);

    @org.springframework.data.jpa.repository.Query("""
        SELECT f.paymentMethod, COALESCE(SUM(f.amount), 0) 
        FROM Fine f 
        WHERE f.status = 'PAID' AND f.paymentMethod IS NOT NULL 
        GROUP BY f.paymentMethod
    """)
    java.util.List<Object[]> sumAmountByPaymentMethod();

    @org.springframework.data.jpa.repository.Query("""
        SELECT f.reason, COALESCE(SUM(f.amount), 0) 
        FROM Fine f 
        WHERE f.status = 'PAID' 
        GROUP BY f.reason
    """)
    java.util.List<Object[]> sumAmountByReason();
}
