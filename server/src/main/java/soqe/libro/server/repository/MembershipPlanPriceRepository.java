package soqe.libro.server.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import soqe.libro.server.entity.MembershipPlanPrice;

import java.util.List;
import java.util.Optional;

@Repository
public interface MembershipPlanPriceRepository extends JpaRepository<MembershipPlanPrice, Long> {
    Optional<MembershipPlanPrice> findByStripePriceId(String stripePriceId);
    List<MembershipPlanPrice> findByPlanId(Long planId);
    Optional<MembershipPlanPrice> findByPlanIdAndBillingCycle(Long planId, MembershipPlanPrice.BillingCycle billingCycle);
}
