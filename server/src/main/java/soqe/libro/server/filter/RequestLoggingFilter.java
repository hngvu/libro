package soqe.libro.server.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.security.Principal;

@Slf4j
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 2)
public class RequestLoggingFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String uri = request.getRequestURI();

        // Skip internal/noisy endpoints from verbose logging
        if (uri.contains("/h2-console") || uri.contains("/actuator/health") || uri.contains("/swagger-ui") || uri.contains("/v3/api-docs")) {
            filterChain.doFilter(request, response);
            return;
        }

        long startTime = System.currentTimeMillis();
        String method = request.getMethod();
        String queryString = request.getQueryString();
        String fullPath = StringUtils.hasText(queryString) ? uri + "?" + queryString : uri;

        try {
            filterChain.doFilter(request, response);
        } finally {
            long duration = System.currentTimeMillis() - startTime;
            int status = response.getStatus();
            Principal principal = request.getUserPrincipal();
            String user = principal != null ? principal.getName() : "anonymous";

            if (status >= 500) {
                log.error("[HTTP] {} {} | status={} | duration={}ms | user={}", method, fullPath, status, duration, user);
            } else if (status >= 400) {
                log.warn("[HTTP] {} {} | status={} | duration={}ms | user={}", method, fullPath, status, duration, user);
            } else {
                log.info("[HTTP] {} {} | status={} | duration={}ms | user={}", method, fullPath, status, duration, user);
            }
        }
    }
}
