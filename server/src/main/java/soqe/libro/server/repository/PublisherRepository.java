package soqe.libro.server.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import soqe.libro.server.entity.Publisher;

@Repository
public interface PublisherRepository extends JpaRepository<Publisher, Long> {
}
