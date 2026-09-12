package soqe.libro.server.dto;

import lombok.Builder;
import java.util.List;

@Builder
public record CirculationTrendResponse(
    String period,
    List<TrendDataPoint> dataPoints
) {
    @Builder
    public record TrendDataPoint(
        String label,
        long checkouts,
        long returns,
        long overdues
    ) {}
}
