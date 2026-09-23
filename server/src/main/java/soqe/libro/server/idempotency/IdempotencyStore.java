package soqe.libro.server.idempotency;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

@Slf4j
@Component
public class IdempotencyStore {

    @Value("${idempotency.ttl-minutes:1440}")
    private long ttlMinutes;

    private final Map<String, IdempotencyRecord> cache = new ConcurrentHashMap<>();

    @Getter
    @Setter
    @AllArgsConstructor
    public static class IdempotencyRecord {
        private int statusCode;
        private String contentType;
        private byte[] body;
        private long createdAtMillis;
        private boolean inProgress;
    }

    public enum ClaimStatus {
        NEWLY_CLAIMED,
        IN_PROGRESS,
        COMPLETED
    }

    @Getter
    @AllArgsConstructor
    public static class ClaimResult {
        private final ClaimStatus status;
        private final IdempotencyRecord record;

        public static ClaimResult newlyClaimed() {
            return new ClaimResult(ClaimStatus.NEWLY_CLAIMED, null);
        }

        public static ClaimResult inProgress(IdempotencyRecord record) {
            return new ClaimResult(ClaimStatus.IN_PROGRESS, record);
        }

        public static ClaimResult completed(IdempotencyRecord record) {
            return new ClaimResult(ClaimStatus.COMPLETED, record);
        }
    }

    /**
     * Atomically claims a key or returns the existing record status.
     */
    public ClaimResult claimOrGet(String key) {
        long now = System.currentTimeMillis();
        long ttlMillis = TimeUnit.MINUTES.toMillis(ttlMinutes);

        final boolean[] newlyClaimed = new boolean[]{false};

        IdempotencyRecord record = cache.compute(key, (k, existing) -> {
            if (existing != null && (now - existing.getCreatedAtMillis() < ttlMillis)) {
                return existing;
            }
            // Key is new or expired -> claim it
            newlyClaimed[0] = true;
            return new IdempotencyRecord(0, null, null, now, true);
        });

        if (newlyClaimed[0]) {
            return ClaimResult.newlyClaimed();
        }

        if (record.isInProgress()) {
            return ClaimResult.inProgress(record);
        }

        return ClaimResult.completed(record);
    }

    public void complete(String key, int statusCode, String contentType, byte[] body) {
        IdempotencyRecord record = cache.get(key);
        if (record != null) {
            record.setStatusCode(statusCode);
            record.setContentType(contentType);
            record.setBody(body);
            record.setInProgress(false);
            record.setCreatedAtMillis(System.currentTimeMillis());
        }
    }

    public void remove(String key) {
        cache.remove(key);
    }

    @Scheduled(fixedRate = 600000) // Every 10 minutes
    public void cleanupExpired() {
        long now = System.currentTimeMillis();
        long ttlMillis = TimeUnit.MINUTES.toMillis(ttlMinutes);

        int initialSize = cache.size();
        cache.entrySet().removeIf(entry -> (now - entry.getValue().getCreatedAtMillis()) > ttlMillis);
        int removed = initialSize - cache.size();
        if (removed > 0) {
            log.info("IdempotencyStore: Cleaned up {} expired idempotency keys.", removed);
        }
    }
}
