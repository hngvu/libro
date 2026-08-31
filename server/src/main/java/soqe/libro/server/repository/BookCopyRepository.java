package soqe.libro.server.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import soqe.libro.server.entity.BookCopy;

@Repository
public interface BookCopyRepository extends JpaRepository<BookCopy, Long> {
}
