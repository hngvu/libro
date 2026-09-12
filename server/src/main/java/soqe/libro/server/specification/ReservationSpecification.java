package soqe.libro.server.specification;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;
import soqe.libro.server.entity.Book;
import soqe.libro.server.entity.Reservation;
import soqe.libro.server.entity.User;

import java.util.ArrayList;
import java.util.List;

public class ReservationSpecification {

    public static Specification<Reservation> filter(
            String keyword,
            Reservation.ReservationStatus status,
            Long userId,
            Long bookId) {
        return filterMulti(
                keyword,
                status != null ? List.of(status) : null,
                userId != null ? List.of(userId) : null,
                bookId != null ? List.of(bookId) : null
        );
    }

    public static Specification<Reservation> filterMulti(
            String keyword,
            List<Reservation.ReservationStatus> statuses,
            List<Long> userIds,
            List<Long> bookIds) {

        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (StringUtils.hasText(keyword)) {
                String like = "%" + keyword.toLowerCase() + "%";
                Join<Reservation, User> userJoin = root.join("user", JoinType.LEFT);
                Join<Reservation, Book> bookJoin = root.join("book", JoinType.LEFT);

                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("reservationCode")), like),
                        cb.like(cb.lower(userJoin.get("email")), like),
                        cb.like(cb.lower(userJoin.get("fullName")), like),
                        cb.like(cb.lower(bookJoin.get("title")), like),
                        cb.like(cb.lower(bookJoin.get("isbn")), like)
                ));
            }

            if (statuses != null && !statuses.isEmpty()) {
                if (statuses.size() == 1) {
                    predicates.add(cb.equal(root.get("status"), statuses.get(0)));
                } else {
                    predicates.add(root.get("status").in(statuses));
                }
            }

            if (userIds != null && !userIds.isEmpty()) {
                Join<Reservation, User> userJoin = root.join("user", JoinType.LEFT);
                if (userIds.size() == 1) {
                    predicates.add(cb.equal(userJoin.get("id"), userIds.get(0)));
                } else {
                    predicates.add(userJoin.get("id").in(userIds));
                }
            }

            if (bookIds != null && !bookIds.isEmpty()) {
                Join<Reservation, Book> bookJoin = root.join("book", JoinType.LEFT);
                if (bookIds.size() == 1) {
                    predicates.add(cb.equal(bookJoin.get("id"), bookIds.get(0)));
                } else {
                    predicates.add(bookJoin.get("id").in(bookIds));
                }
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
