package soqe.libro.server.specification;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;
import soqe.libro.server.entity.Book;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class BookSpecification {

    public static Specification<Book> filter(String keyword, Book.Format format, Book.Status status, String genreHandle) {
        return filterMulti(
                keyword,
                format != null ? List.of(format) : null,
                status != null ? List.of(status) : null,
                StringUtils.hasText(genreHandle) ? List.of(genreHandle) : null,
                null, null, null
        );
    }

    public static Specification<Book> filter(
            String keyword,
            Book.Format format,
            Book.Status status,
            String genreHandle,
            Long authorId,
            Long genreId,
            String authorHandle) {
        return filterMulti(
                keyword,
                format != null ? List.of(format) : null,
                status != null ? List.of(status) : null,
                StringUtils.hasText(genreHandle) ? List.of(genreHandle) : null,
                authorId != null ? List.of(authorId) : null,
                genreId != null ? List.of(genreId) : null,
                StringUtils.hasText(authorHandle) ? List.of(authorHandle) : null
        );
    }

    public static Specification<Book> filterMulti(
            String keyword,
            List<Book.Format> formats,
            List<Book.Status> statuses,
            List<String> genreHandles,
            List<Long> authorIds,
            List<Long> genreIds,
            List<String> authorHandles) {
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

            if (formats != null && !formats.isEmpty()) {
                if (formats.size() == 1) {
                    predicates.add(criteriaBuilder.equal(root.get("format"), formats.get(0)));
                } else {
                    predicates.add(root.get("format").in(formats));
                }
            }

            if (statuses != null && !statuses.isEmpty()) {
                if (statuses.size() == 1) {
                    predicates.add(criteriaBuilder.equal(root.get("status"), statuses.get(0)));
                } else {
                    predicates.add(root.get("status").in(statuses));
                }
            }

            if (genreHandles != null && !genreHandles.isEmpty()) {
                query.distinct(true);
                Join<Object, Object> genreJoin = root.join("genres");
                if (genreHandles.size() == 1) {
                    predicates.add(criteriaBuilder.equal(genreJoin.get("handle"), genreHandles.get(0)));
                } else {
                    predicates.add(genreJoin.get("handle").in(genreHandles));
                }
            }

            if (genreIds != null && !genreIds.isEmpty()) {
                query.distinct(true);
                Join<Object, Object> genreJoin = root.join("genres");
                if (genreIds.size() == 1) {
                    predicates.add(criteriaBuilder.equal(genreJoin.get("id"), genreIds.get(0)));
                } else {
                    predicates.add(genreJoin.get("id").in(genreIds));
                }
            }

            if (authorIds != null && !authorIds.isEmpty()) {
                query.distinct(true);
                Join<Object, Object> authorJoin = root.join("authors");
                if (authorIds.size() == 1) {
                    predicates.add(criteriaBuilder.equal(authorJoin.get("id"), authorIds.get(0)));
                } else {
                    predicates.add(authorJoin.get("id").in(authorIds));
                }
            }

            if (authorHandles != null && !authorHandles.isEmpty()) {
                query.distinct(true);
                Join<Object, Object> authorJoin = root.join("authors");
                if (authorHandles.size() == 1) {
                    predicates.add(criteriaBuilder.equal(authorJoin.get("handle"), authorHandles.get(0)));
                } else {
                    predicates.add(authorJoin.get("handle").in(authorHandles));
                }
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}
