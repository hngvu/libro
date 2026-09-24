package soqe.libro.server.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import soqe.libro.server.entity.AuditLog;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    @Query("SELECT a FROM AuditLog a WHERE " +
           "(:keyword IS NULL OR :keyword = '' OR " +
           " LOWER(a.operatorEmail) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           " LOWER(a.detail) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           " LOWER(a.action) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "AND (:entityType IS NULL OR a.entityType = :entityType)")
    Page<AuditLog> searchLogs(
            @Param("keyword") String keyword,
            @Param("entityType") AuditLog.EntityType entityType,
            Pageable pageable
    );
}
