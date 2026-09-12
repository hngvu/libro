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
    boolean existsByUserAndBookCopy_BookAndStatus(User user, soqe.libro.server.entity.Book book, Loan.LoanStatus status);
    boolean existsByUserAndBookCopy_Book_WorkAndStatus(User user, String work, Loan.LoanStatus status);
    boolean existsByUserAndStatus(User user, Loan.LoanStatus status);
    boolean existsByUserAndStatusAndDueDateBefore(User user, Loan.LoanStatus status, java.time.LocalDate date);

    long countByStatus(Loan.LoanStatus status);
    long countByStatusAndDueDateBefore(Loan.LoanStatus status, java.time.LocalDate date);
    java.util.List<Loan> findByStatusAndDueDateBeforeOrderByDueDateAsc(Loan.LoanStatus status, java.time.LocalDate date, Pageable pageable);

    @org.springframework.data.jpa.repository.Query("""
        SELECT l.borrowDate, COUNT(l) 
        FROM Loan l 
        WHERE l.borrowDate >= :startDate 
        GROUP BY l.borrowDate 
        ORDER BY l.borrowDate ASC
    """)
    java.util.List<Object[]> countCheckoutsByDateAfter(@org.springframework.data.repository.query.Param("startDate") java.time.LocalDate startDate);

    @org.springframework.data.jpa.repository.Query("""
        SELECT l.returnDate, COUNT(l) 
        FROM Loan l 
        WHERE l.returnDate IS NOT NULL AND l.returnDate >= :startDate 
        GROUP BY l.returnDate 
        ORDER BY l.returnDate ASC
    """)
    java.util.List<Object[]> countReturnsByDateAfter(@org.springframework.data.repository.query.Param("startDate") java.time.LocalDate startDate);

    @org.springframework.data.jpa.repository.Query("""
        SELECT l.bookCopy.book.id, COUNT(l) 
        FROM Loan l 
        WHERE l.bookCopy.book IS NOT NULL 
        GROUP BY l.bookCopy.book.id 
        ORDER BY COUNT(l) DESC
    """)
    java.util.List<Object[]> findTopBorrowedBookIds(Pageable pageable);

    @org.springframework.data.jpa.repository.Query("""
        SELECT g.id, COUNT(l) 
        FROM Loan l 
        JOIN l.bookCopy.book.genres g 
        GROUP BY g.id
    """)
    java.util.List<Object[]> countLoansByGenre();
}
