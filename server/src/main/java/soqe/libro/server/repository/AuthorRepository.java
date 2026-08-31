package soqe.libro.server.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import soqe.libro.server.entity.Author;

@Repository
public interface AuthorRepository extends JpaRepository<Author, Long> {
}
