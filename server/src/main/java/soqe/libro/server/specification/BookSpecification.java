package soqe.libro.server.specification;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;
import soqe.libro.server.entity.Book;

import java.util.ArrayList;
import java.util.List;

public class BookSpecification {

    public static Specification<Book> filter(String keyword, Book.Format format, Book.Status status, String genreHandle) {
        return filter(keyword, format, status, genreHandle, null, null, null);
    }

    public static Specification<Book> filter(
            String keyword,
            Book.Format format,
            Book.Status status,
            String genreHandle,
            Long authorId,
            Long genreId,
            String authorHandle) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (StringUtils.hasText(keyword)) {
                String likePattern = "%" + keyword.toLowerCase() + "%";
                predicates.add(criteriaBuilder.or(
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("title")), likePattern),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("isbn")), likePattern),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("handle")), likePattern)
                ));
            }

            if (format != null) {
                predicates.add(criteriaBuilder.equal(root.get("format"), format));
            }

            if (status != null) {
                predicates.add(criteriaBuilder.equal(root.get("status"), status));
            }

            if (StringUtils.hasText(genreHandle)) {
                query.distinct(true);
                Join<Object, Object> genreJoin = root.join("genres");
                predicates.add(criteriaBuilder.equal(genreJoin.get("handle"), genreHandle));
            }

            if (genreId != null) {
                query.distinct(true);
                Join<Object, Object> genreJoin = root.join("genres");
                predicates.add(criteriaBuilder.equal(genreJoin.get("id"), genreId));
            }

            if (authorId != null) {
                query.distinct(true);
                Join<Object, Object> authorJoin = root.join("authors");
                predicates.add(criteriaBuilder.equal(authorJoin.get("id"), authorId));
            }

            if (StringUtils.hasText(authorHandle)) {
                query.distinct(true);
                Join<Object, Object> authorJoin = root.join("authors");
                predicates.add(criteriaBuilder.equal(authorJoin.get("handle"), authorHandle));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}
