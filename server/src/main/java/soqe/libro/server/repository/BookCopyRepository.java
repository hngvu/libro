package soqe.libro.server.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;
import soqe.libro.server.entity.BookCopy;
import java.util.Optional;

@Repository
public interface BookCopyRepository extends JpaRepository<BookCopy, Long>, JpaSpecificationExecutor<BookCopy> {
    Optional<BookCopy> findByBarcode(String barcode);
    java.util.List<BookCopy> findByBookAndStatus(soqe.libro.server.entity.Book book, BookCopy.Status status);
    long countByBookAndStatus(soqe.libro.server.entity.Book book, BookCopy.Status status);
    boolean existsByBookAndStatus(soqe.libro.server.entity.Book book, BookCopy.Status status);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("UPDATE BookCopy c SET c.status = :newStatus WHERE c.id = :copyId AND c.status = :expectedStatus")
    int updateStatusAtomic(
            @org.springframework.data.repository.query.Param("copyId") Long copyId,
            @org.springframework.data.repository.query.Param("newStatus") BookCopy.Status newStatus,
            @org.springframework.data.repository.query.Param("expectedStatus") BookCopy.Status expectedStatus
    );
}
