package soqe.libro.server.specification;

import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;
import soqe.libro.server.entity.Book;

import java.util.ArrayList;
import java.util.List;

public class BookSpecification {

    public static Specification<Book> filter(String keyword, Book.Format format, Book.Status status, String genreHandle) {
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
                jakarta.persistence.criteria.Join<Object, Object> genreJoin = root.join("genres");
                predicates.add(criteriaBuilder.equal(genreJoin.get("handle"), genreHandle));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}
