package soqe.libro.server.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import soqe.libro.server.entity.Book;
import soqe.libro.server.entity.Collection;
import soqe.libro.server.entity.CollectionBook;
import soqe.libro.server.entity.User;

import java.util.List;
import java.util.Optional;

@Repository
public interface CollectionBookRepository extends JpaRepository<CollectionBook, Long> {

    Page<CollectionBook> findByCollectionOrderByAddedAtDesc(Collection collection, Pageable pageable);

    List<CollectionBook> findTop4ByCollectionOrderByAddedAtDesc(Collection collection);

    List<CollectionBook> findByCollectionOrderByAddedAtDesc(Collection collection);

    Optional<CollectionBook> findByCollectionAndBook(Collection collection, Book book);

    boolean existsByCollectionAndBook(Collection collection, Book book);

    void deleteByCollectionAndBook(Collection collection, Book book);

    @Query("SELECT cb.collection.id FROM CollectionBook cb WHERE cb.collection.owner = :owner AND cb.book.id = :bookId")
    List<Long> findCollectionIdsByOwnerAndBookId(@Param("owner") User owner, @Param("bookId") Long bookId);

    @Query("SELECT cb.book.id FROM CollectionBook cb WHERE cb.collection = :collection")
    List<Long> findBookIdsByCollection(@Param("collection") Collection collection);

    @Query("SELECT cb.book.id FROM CollectionBook cb WHERE cb.collection.owner = :owner")
    List<Long> findAllBookIdsByOwner(@Param("owner") User owner);

    @Query("SELECT cb FROM CollectionBook cb WHERE cb.collection.owner = :owner ORDER BY cb.addedAt DESC")
    List<CollectionBook> findAllByOwnerOrderByAddedAtDesc(@Param("owner") User owner);
}
