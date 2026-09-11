package soqe.libro.server.specification;

import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;
import soqe.libro.server.entity.BookCopy;
import java.util.ArrayList;
import java.util.List;

public class BookCopySpecification {
    public static Specification<BookCopy> filter(String keyword, BookCopy.Status status, Long bookId, BookCopy.Status excludeStatus) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (StringUtils.hasText(keyword)) {
                String kw = "%" + keyword.toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("barcode")), kw),
                        cb.like(cb.lower(root.get("book").get("title")), kw)
                ));
            }
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (bookId != null) {
                predicates.add(cb.equal(root.get("book").get("id"), bookId));
            }
            if (excludeStatus != null) {
                predicates.add(cb.notEqual(root.get("status"), excludeStatus));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
