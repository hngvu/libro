package soqe.libro.server.dto;

import lombok.Builder;
import java.util.List;

@Builder
public record CategoryDistributionResponse(
    List<CategoryShare> categories
) {
    @Builder
    public record CategoryShare(
        Long genreId,
        String name,
        String handle,
        long bookCount,
        long loanCount,
        double percentage
    ) {}
}
