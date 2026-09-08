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
            Boolean isOverdue) {

        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (StringUtils.hasText(keyword)) {
                String like = "%" + keyword.toLowerCase() + "%";
                Join<Loan, User> userJoin = root.join("user");
                Join<Loan, BookCopy> copyJoin = root.join("bookCopy");
                Join<BookCopy, Book> bookJoin = copyJoin.join("book");

                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("loanCode")), like),
                        cb.like(cb.lower(userJoin.get("username")), like),
                        cb.like(cb.lower(userJoin.get("fullName")), like),
                        cb.like(cb.lower(copyJoin.get("barcode")), like),
                        cb.like(cb.lower(bookJoin.get("title")), like)
                ));
            }

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            if (userId != null) {
                predicates.add(cb.equal(root.get("user").get("id"), userId));
            }

            if (bookCopyId != null) {
                predicates.add(cb.equal(root.get("bookCopy").get("id"), bookCopyId));
            }

            if (Boolean.TRUE.equals(isOverdue)) {
                predicates.add(cb.equal(root.get("status"), Loan.LoanStatus.ONGOING));
                predicates.add(cb.lessThan(root.get("dueDate"), LocalDate.now()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
