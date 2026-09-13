package soqe.libro.server.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;
import soqe.libro.server.entity.User;
import soqe.libro.server.entity.UserSubscription;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserSubscriptionRepository extends JpaRepository<UserSubscription, Long>, JpaSpecificationExecutor<UserSubscription> {
    Optional<UserSubscription> findByStripeSubscriptionId(String stripeSubscriptionId);
    Optional<UserSubscription> findTopByUserAndStatusOrderByCurrentPeriodEndDesc(User user, UserSubscription.SubscriptionStatus status);
    List<UserSubscription> findByUserOrderByCreatedAtDesc(User user);
    boolean existsByUserAndStatus(User user, UserSubscription.SubscriptionStatus status);

    long countByStatus(UserSubscription.SubscriptionStatus status);

    @org.springframework.data.jpa.repository.Query("""
        SELECT s.plan.code, s.plan.name, COALESCE(s.planPrice.price, 0), COUNT(s) 
        FROM UserSubscription s 
        WHERE s.status = 'ACTIVE' 
        GROUP BY s.plan.code, s.plan.name, s.planPrice.price
    """)
    List<Object[]> countActiveSubscribersPerPlan();
}
