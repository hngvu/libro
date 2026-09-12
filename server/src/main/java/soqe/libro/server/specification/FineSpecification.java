package soqe.libro.server.specification;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;
import soqe.libro.server.entity.Book;
import soqe.libro.server.entity.Fine;
import soqe.libro.server.entity.User;

import java.util.ArrayList;
import java.util.List;

public class FineSpecification {

    public static Specification<Fine> filter(
            String keyword,
            Fine.FineStatus status,
            Fine.FineReason reason,
            Long userId) {
        return filterMulti(
                keyword,
                status != null ? List.of(status) : null,
                reason != null ? List.of(reason) : null,
                userId != null ? List.of(userId) : null
        );
    }

    public static Specification<Fine> filterMulti(
            String keyword,
            List<Fine.FineStatus> statuses,
            List<Fine.FineReason> reasons,
            List<Long> userIds) {

        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (StringUtils.hasText(keyword)) {
                String like = "%" + keyword.toLowerCase() + "%";
                Join<Fine, User> userJoin = root.join("user", JoinType.LEFT);
                Join<Fine, Book> bookJoin = root.join("book", JoinType.LEFT);

                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("fineCode")), like),
                        cb.like(cb.lower(userJoin.get("email")), like),
                        cb.like(cb.lower(userJoin.get("fullName")), like),
                        cb.like(cb.lower(bookJoin.get("title")), like)
                ));
            }

            if (statuses != null && !statuses.isEmpty()) {
                if (statuses.size() == 1) {
                    predicates.add(cb.equal(root.get("status"), statuses.get(0)));
                } else {
                    predicates.add(root.get("status").in(statuses));
                }
            }

            if (reasons != null && !reasons.isEmpty()) {
                if (reasons.size() == 1) {
                    predicates.add(cb.equal(root.get("reason"), reasons.get(0)));
                } else {
                    predicates.add(root.get("reason").in(reasons));
                }
            }

            if (userIds != null && !userIds.isEmpty()) {
                Join<Fine, User> userJoin = root.join("user", JoinType.LEFT);
                if (userIds.size() == 1) {
                    predicates.add(cb.equal(userJoin.get("id"), userIds.get(0)));
                } else {
                    predicates.add(userJoin.get("id").in(userIds));
                }
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
