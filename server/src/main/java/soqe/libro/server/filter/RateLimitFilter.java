package soqe.libro.server.filter;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;
import soqe.libro.server.dto.ErrorResponse;
import soqe.libro.server.service.MetricsService;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 1)
public class RateLimitFilter extends OncePerRequestFilter {

    @Value("${rate-limit.enabled:true}")
    private boolean enabled;

    @Value("${rate-limit.public-capacity:120}")
    private int publicCapacity;

    @Value("${rate-limit.public-refill-seconds:60}")
    private int publicRefillSeconds;

    @Value("${rate-limit.auth-capacity:20}")
    private int authCapacity;

    @Value("${rate-limit.auth-refill-seconds:60}")
    private int authRefillSeconds;

    private final MetricsService metricsService;
    private final ObjectMapper objectMapper;
    private final Map<String, Bucket> bucketCache = new ConcurrentHashMap<>();

    public RateLimitFilter(MetricsService metricsService, ObjectMapper objectMapper) {
        this.metricsService = metricsService;
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        if (!enabled) {
            filterChain.doFilter(request, response);
            return;
        }

        String path = request.getRequestURI();

        // Bypass system, actuator, docs and console endpoints
        if (path.contains("/actuator") || path.contains("/swagger-ui") || path.contains("/v3/api-docs") || path.contains("/h2-console")) {
            filterChain.doFilter(request, response);
            return;
        }

        String clientIp = resolveClientIp(request);
        boolean isAuthRoute = path.contains("/auth/");

        String bucketKey = (isAuthRoute ? "auth:" : "pub:") + clientIp;
        Bucket bucket = bucketCache.computeIfAbsent(bucketKey, k -> createBucket(isAuthRoute));

        if (bucket.tryConsume(1)) {
            filterChain.doFilter(request, response);
        } else {
            metricsService.incrementRateLimitRejected();
            int retryAfter = isAuthRoute ? authRefillSeconds : publicRefillSeconds;
            log.warn("Rate limit exceeded for IP: {} on path: {}. Retry after {}s", clientIp, path, retryAfter);

            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setHeader("Retry-After", String.valueOf(retryAfter));
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);

            String requestId = MDC.get(RequestIdFilter.MDC_REQUEST_ID_KEY);
            ErrorResponse error = ErrorResponse.builder()
                    .message("Too many requests. Please slow down and try again in " + retryAfter + " seconds.")
                    .path(path)
                    .requestId(requestId)
                    .build();

            response.getWriter().write(objectMapper.writeValueAsString(error));
        }
    }

    private Bucket createBucket(boolean isAuth) {
        int capacity = isAuth ? authCapacity : publicCapacity;
        int refillSeconds = isAuth ? authRefillSeconds : publicRefillSeconds;

        Bandwidth limit = Bandwidth.classic(
                capacity,
                Refill.greedy(capacity, Duration.ofSeconds(refillSeconds))
        );

        return Bucket.builder()
                .addLimit(limit)
                .build();
    }

    private String resolveClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (StringUtils.hasText(xForwardedFor)) {
            return xForwardedFor.split(",")[0].trim();
        }
        String xRealIp = request.getHeader("X-Real-IP");
        if (StringUtils.hasText(xRealIp)) {
            return xRealIp.trim();
        }
        return request.getRemoteAddr() != null ? request.getRemoteAddr() : "unknown";
    }
}
