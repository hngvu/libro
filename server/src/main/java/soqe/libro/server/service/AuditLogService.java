package soqe.libro.server.service;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import soqe.libro.server.dto.ActivityLogResponse;
import soqe.libro.server.entity.AuditLog;
import soqe.libro.server.repository.AuditLogRepository;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditLogService {

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final AuditLogRepository auditLogRepository;

    @Transactional
    public AuditLog record(AuditLog.EntityType entityType, String action, Long entityId, String detail) {
        String operator = resolveCurrentOperator();
        String ip = resolveCurrentIp();
        return record(operator, action, entityType, entityId, detail, ip);
    }

    @Transactional
    public AuditLog record(String operator, String action, AuditLog.EntityType entityType, Long entityId, String detail, String ipAddress) {
        try {
            AuditLog auditLog = AuditLog.builder()
                    .operatorEmail(StringUtils.hasText(operator) ? operator : resolveCurrentOperator())
                    .action(action)
                    .entityType(entityType)
                    .entityId(entityId)
                    .detail(detail)
                    .ipAddress(StringUtils.hasText(ipAddress) ? ipAddress : resolveCurrentIp())
                    .createdAt(LocalDateTime.now())
                    .build();

            AuditLog saved = auditLogRepository.save(auditLog);
            log.info("[AUDIT] {} by {} on {}({}) - {}", action, saved.getOperatorEmail(), entityType, entityId, detail);
            return saved;
        } catch (Exception e) {
            log.error("Failed to persist audit log: action={}, entityType={}, detail={}", action, entityType, detail, e);
            return null;
        }
    }

    @Transactional(readOnly = true)
    public Page<ActivityLogResponse> searchLogs(String keyword, AuditLog.EntityType entityType, Pageable pageable) {
        String cleanKeyword = (keyword != null && !keyword.isBlank()) ? keyword.trim() : null;
        return auditLogRepository.searchLogs(cleanKeyword, entityType, pageable)
                .map(this::toResponse);
    }

    public ActivityLogResponse toResponse(AuditLog log) {
        String formattedTime = log.getCreatedAt() != null ? log.getCreatedAt().format(FORMATTER) : "";
        return ActivityLogResponse.builder()
                .id(log.getId())
                .timestamp(formattedTime)
                .createdAt(log.getCreatedAt())
                .operator(log.getOperatorEmail())
                .action(log.getAction())
                .entityType(log.getEntityType() != null ? log.getEntityType().name() : "OTHER")
                .entityId(log.getEntityId())
                .detail(log.getDetail())
                .ipAddress(log.getIpAddress())
                .build();
    }

    private String resolveCurrentOperator() {
        try {
            SecurityContext context = SecurityContextHolder.getContext();
            if (context != null) {
                Authentication auth = context.getAuthentication();
                if (auth != null && auth.isAuthenticated() && !"anonymousUser".equalsIgnoreCase(auth.getName())) {
                    return auth.getName();
                }
            }
        } catch (Exception ignored) {
        }
        return "system";
    }

    private String resolveCurrentIp() {
        try {
            if (RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attrs) {
                HttpServletRequest request = attrs.getRequest();
                if (request != null) {
                    String xForwardedFor = request.getHeader("X-Forwarded-For");
                    if (StringUtils.hasText(xForwardedFor) && !"unknown".equalsIgnoreCase(xForwardedFor)) {
                        return xForwardedFor.split(",")[0].trim();
                    }
                    String xRealIp = request.getHeader("X-Real-IP");
                    if (StringUtils.hasText(xRealIp) && !"unknown".equalsIgnoreCase(xRealIp)) {
                        return xRealIp.trim();
                    }
                    String remote = request.getRemoteAddr();
                    if ("0:0:0:0:0:0:0:1".equals(remote) || "localhost".equalsIgnoreCase(remote)) {
                        return "127.0.0.1";
                    }
                    return StringUtils.hasText(remote) ? remote : "127.0.0.1";
                }
            }
        } catch (Exception ignored) {
        }
        return "127.0.0.1";
    }
}
