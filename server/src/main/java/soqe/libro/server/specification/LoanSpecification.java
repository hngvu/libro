package soqe.libro.server.specification;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;
import soqe.libro.server.entity.Book;
import soqe.libro.server.entity.BookCopy;
import soqe.libro.server.entity.Loan;
import soqe.libro.server.entity.User;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class LoanSpecification {

    public static Specification<Loan> filter(
            String keyword,
            Loan.LoanStatus status,
            Long userId,
            Long bookCopyId,
            Boolean isOverdue,
            Boolean hasRenewals) {
        return filterMulti(
                keyword,
                status != null ? List.of(status) : null,
                userId != null ? List.of(userId) : null,
                bookCopyId != null ? List.of(bookCopyId) : null,
                isOverdue,
                hasRenewals
        );
    }

    public static Specification<Loan> filterMulti(
            String keyword,
            List<Loan.LoanStatus> statuses,
            List<Long> userIds,
            List<Long> bookCopyIds,
            Boolean isOverdue,
            Boolean hasRenewals) {

        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (StringUtils.hasText(keyword)) {
                String like = "%" + keyword.toLowerCase() + "%";
                Join<Loan, User> userJoin = root.join("user");
                Join<Loan, BookCopy> copyJoin = root.join("bookCopy");
                Join<BookCopy, Book> bookJoin = copyJoin.join("book");

                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("loanCode")), like),
                        cb.like(cb.lower(userJoin.get("email")), like),
                        cb.like(cb.lower(userJoin.get("fullName")), like),
                        cb.like(cb.lower(copyJoin.get("barcode")), like),
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

            if (userIds != null && !userIds.isEmpty()) {
                if (userIds.size() == 1) {
                    predicates.add(cb.equal(root.get("user").get("id"), userIds.get(0)));
                } else {
                    predicates.add(root.get("user").get("id").in(userIds));
                }
            }

            if (bookCopyIds != null && !bookCopyIds.isEmpty()) {
                if (bookCopyIds.size() == 1) {
                    predicates.add(cb.equal(root.get("bookCopy").get("id"), bookCopyIds.get(0)));
                } else {
                    predicates.add(root.get("bookCopy").get("id").in(bookCopyIds));
                }
            }

            if (Boolean.TRUE.equals(isOverdue)) {
                predicates.add(cb.equal(root.get("status"), Loan.LoanStatus.ONGOING));
                predicates.add(cb.lessThan(root.get("dueDate"), LocalDate.now()));
            }

            if (Boolean.TRUE.equals(hasRenewals)) {
                predicates.add(cb.greaterThan(root.get("renewalCount"), 0));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
