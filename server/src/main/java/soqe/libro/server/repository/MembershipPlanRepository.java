package soqe.libro.server.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;
import soqe.libro.server.entity.MembershipPlan;

import java.util.List;
import java.util.Optional;

@Repository
public interface MembershipPlanRepository extends JpaRepository<MembershipPlan, Long>, JpaSpecificationExecutor<MembershipPlan> {
    Optional<MembershipPlan> findByCode(String code);
    List<MembershipPlan> findByStatus(MembershipPlan.Status status);
}
