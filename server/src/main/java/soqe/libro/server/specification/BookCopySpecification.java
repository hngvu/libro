package soqe.libro.server.specification;

import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;
import soqe.libro.server.entity.BookCopy;
import java.util.ArrayList;
import java.util.List;

public class BookCopySpecification {
    public static Specification<BookCopy> filter(String keyword, BookCopy.Status status, Long bookId, BookCopy.Status excludeStatus) {
        return filterMulti(
                keyword,
                status != null ? List.of(status) : null,
                bookId != null ? List.of(bookId) : null,
                excludeStatus != null ? List.of(excludeStatus) : null
        );
    }

    public static Specification<BookCopy> filterMulti(String keyword, List<BookCopy.Status> statuses, List<Long> bookIds, List<BookCopy.Status> excludeStatuses) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (StringUtils.hasText(keyword)) {
                String kw = "%" + keyword.toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("barcode")), kw),
                        cb.like(cb.lower(root.get("book").get("title")), kw)
                ));
            }
            if (statuses != null && !statuses.isEmpty()) {
                if (statuses.size() == 1) {
                    predicates.add(cb.equal(root.get("status"), statuses.get(0)));
                } else {
                    predicates.add(root.get("status").in(statuses));
                }
            }
            if (bookIds != null && !bookIds.isEmpty()) {
                if (bookIds.size() == 1) {
                    predicates.add(cb.equal(root.get("book").get("id"), bookIds.get(0)));
                } else {
                    predicates.add(root.get("book").get("id").in(bookIds));
                }
            }
            if (excludeStatuses != null && !excludeStatuses.isEmpty()) {
                if (excludeStatuses.size() == 1) {
                    predicates.add(cb.notEqual(root.get("status"), excludeStatuses.get(0)));
                } else {
                    predicates.add(cb.not(root.get("status").in(excludeStatuses)));
                }
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
