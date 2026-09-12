package soqe.libro.server.specification;

import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;
import soqe.libro.server.entity.User;

import java.util.ArrayList;
import java.util.List;

public class UserSpecification {

    public static Specification<User> filter(String keyword, User.Role role, User.Status status) {
        return filterMulti(
                keyword,
                role != null ? List.of(role) : null,
                status != null ? List.of(status) : null
        );
    }

    public static Specification<User> filterMulti(String keyword, List<User.Role> roles, List<User.Status> statuses) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (StringUtils.hasText(keyword)) {
                String likePattern = "%" + keyword.toLowerCase() + "%";
                predicates.add(criteriaBuilder.or(
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("email")), likePattern),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("fullName")), likePattern)
                ));
            }

            if (roles != null && !roles.isEmpty()) {
                if (roles.size() == 1) {
                    predicates.add(criteriaBuilder.equal(root.get("role"), roles.get(0)));
                } else {
                    predicates.add(root.get("role").in(roles));
                }
            }

            if (statuses != null && !statuses.isEmpty()) {
                if (statuses.size() == 1) {
                    predicates.add(criteriaBuilder.equal(root.get("status"), statuses.get(0)));
                } else {
                    predicates.add(root.get("status").in(statuses));
                }
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}
