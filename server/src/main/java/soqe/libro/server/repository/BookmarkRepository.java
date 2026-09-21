package soqe.libro.server.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import soqe.libro.server.entity.Book;
import soqe.libro.server.entity.BookBookmark;
import soqe.libro.server.entity.User;

import java.util.List;
import java.util.Optional;

@Repository
public interface BookmarkRepository extends JpaRepository<BookBookmark, Long> {
    List<BookBookmark> findByUserOrderByCreatedAtDesc(User user);
    Optional<BookBookmark> findByUserAndBook(User user, Book book);
    boolean existsByUserAndBook(User user, Book book);
    void deleteByUserAndBook(User user, Book book);
    long countByUser(User user);

    @Query("SELECT b.book.id FROM BookBookmark b WHERE b.user = :user")
    List<Long> findBookmarkedBookIdsByUser(@Param("user") User user);
}
