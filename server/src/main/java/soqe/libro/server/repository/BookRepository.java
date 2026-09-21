package soqe.libro.server.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import soqe.libro.server.entity.Book;

import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import java.util.Optional;

@Repository
public interface BookRepository extends JpaRepository<Book, Long>, JpaSpecificationExecutor<Book> {
    Optional<Book> findByIsbn(String isbn);
    Optional<Book> findByHandle(String handle);

    long countByAvailableCopies(int availableCopies);
    java.util.List<Book> findByAvailableCopiesLessThanEqual(int copies, org.springframework.data.domain.Pageable pageable);
    org.springframework.data.domain.Page<Book> findByStatus(Book.Status status, org.springframework.data.domain.Pageable pageable);

    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(b.totalCopies), 0) FROM Book b")
    long sumTotalCopies();

    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(b.availableCopies), 0) FROM Book b")
    long sumAvailableCopies();
}
