package soqe.libro.server.filter;

import com.fasterxml.jackson.databind.ObjectMapper;
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
import org.springframework.web.util.ContentCachingResponseWrapper;
import soqe.libro.server.dto.ErrorResponse;
import soqe.libro.server.idempotency.IdempotencyStore;
import soqe.libro.server.service.MetricsService;

import java.io.IOException;

@Slf4j
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 3)
public class IdempotencyFilter extends OncePerRequestFilter {

    public static final String HEADER_IDEMPOTENCY_KEY = "X-Idempotency-Key";
    public static final String HEADER_REPLAYED = "X-Idempotency-Replayed";

    @Value("${idempotency.enabled:true}")
    private boolean enabled;

    private final IdempotencyStore store;
    private final MetricsService metricsService;
    private final ObjectMapper objectMapper;

    public IdempotencyFilter(IdempotencyStore store, MetricsService metricsService, ObjectMapper objectMapper) {
        this.store = store;
        this.metricsService = metricsService;
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String method = request.getMethod();

        // Idempotency applies only to mutating methods
        if (!enabled || (!"POST".equalsIgnoreCase(method) && !"PUT".equalsIgnoreCase(method) && !"PATCH".equalsIgnoreCase(method) && !"DELETE".equalsIgnoreCase(method))) {
            filterChain.doFilter(request, response);
            return;
        }

        String key = request.getHeader(HEADER_IDEMPOTENCY_KEY);
        if (!StringUtils.hasText(key)) {
            key = request.getHeader("Idempotency-Key");
        }

        if (!StringUtils.hasText(key)) {
            filterChain.doFilter(request, response);
            return;
        }

        key = key.trim();
        IdempotencyStore.ClaimResult claim = store.claimOrGet(key);

        if (claim.getStatus() == IdempotencyStore.ClaimStatus.COMPLETED) {
            // Already processed -> Replay cached response
            IdempotencyStore.IdempotencyRecord record = claim.getRecord();
            metricsService.incrementIdempotencyReplayed();
            log.info("Replaying response for idempotency key: {}", key);

            response.setStatus(record.getStatusCode());
            if (StringUtils.hasText(record.getContentType())) {
                response.setContentType(record.getContentType());
            }
            response.setHeader(HEADER_REPLAYED, "true");
            if (record.getBody() != null) {
                response.getOutputStream().write(record.getBody());
            }
            return;
        }

        if (claim.getStatus() == IdempotencyStore.ClaimStatus.IN_PROGRESS) {
            // In-flight concurrency collision with the same key
            log.warn("Concurrent request detected with in-progress idempotency key: {}", key);
            response.setStatus(HttpStatus.CONFLICT.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);

            String requestId = MDC.get(RequestIdFilter.MDC_REQUEST_ID_KEY);
            ErrorResponse error = ErrorResponse.builder()
                    .message("A request with this idempotency key is currently being processed. Please wait.")
                    .path(request.getRequestURI())
                    .requestId(requestId)
                    .build();

            response.getWriter().write(objectMapper.writeValueAsString(error));
            return;
        }

        // Newly claimed -> Execute and cache response
        ContentCachingResponseWrapper responseWrapper = new ContentCachingResponseWrapper(response);
        try {
            filterChain.doFilter(request, responseWrapper);

            int status = responseWrapper.getStatus();
            byte[] body = responseWrapper.getContentAsByteArray();
            String contentType = responseWrapper.getContentType();

            // Cache successful or business error responses (2xx, 4xx). Do not cache 5xx server bugs
            if (status < 500) {
                store.complete(key, status, contentType, body);
            } else {
                store.remove(key);
            }
        } catch (Exception ex) {
            store.remove(key);
            throw ex;
        } finally {
            responseWrapper.copyBodyToResponse();
        }
    }
}
