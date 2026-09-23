package soqe.libro.server.service;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.stereotype.Service;

@Service
public class MetricsService {

    private final Counter loansCreatedCounter;
    private final Counter reservationsCreatedCounter;
    private final Counter rateLimitRejectedCounter;
    private final Counter idempotencyReplayedCounter;

    public MetricsService(MeterRegistry registry) {
        this.loansCreatedCounter = Counter.builder("libro.loans.created")
                .description("Total number of loans successfully issued")
                .register(registry);

        this.reservationsCreatedCounter = Counter.builder("libro.reservations.created")
                .description("Total number of book reservations placed")
                .register(registry);

        this.rateLimitRejectedCounter = Counter.builder("libro.rate_limit.rejected")
                .description("Total number of requests rejected by rate limiting")
                .register(registry);

        this.idempotencyReplayedCounter = Counter.builder("libro.idempotency.replayed")
                .description("Total number of mutating requests served from idempotency cache")
                .register(registry);
    }

    public void incrementLoansCreated() {
        loansCreatedCounter.increment();
    }

    public void incrementReservationsCreated() {
        reservationsCreatedCounter.increment();
    }

    public void incrementRateLimitRejected() {
        rateLimitRejectedCounter.increment();
    }

    public void incrementIdempotencyReplayed() {
        idempotencyReplayedCounter.increment();
    }
}
