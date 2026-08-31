package soqe.libro.server.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import soqe.libro.server.entity.Genre;

@Repository
public interface GenreRepository extends JpaRepository<Genre, Long> {
}
