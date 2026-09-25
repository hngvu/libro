package soqe.libro.server.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import soqe.libro.server.entity.Collection;
import soqe.libro.server.entity.User;

import java.util.List;
import java.util.Optional;

@Repository
public interface CollectionRepository extends JpaRepository<Collection, Long> {

    List<Collection> findByTypeOrderByDisplayOrderAscCreatedAtDesc(Collection.CollectionType type);

    List<Collection> findByTypeAndPinnedTrueOrderByDisplayOrderAsc(Collection.CollectionType type);

    List<Collection> findByOwnerOrderByIsDefaultDescUpdatedAtDesc(User owner);

    Optional<Collection> findByOwnerAndIsDefaultTrue(User owner);

    Optional<Collection> findBySlug(String slug);

    boolean existsBySlug(String slug);

    long countByOwner(User owner);
}
