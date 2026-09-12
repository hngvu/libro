package soqe.libro.server.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import soqe.libro.server.dto.CirculationTrendResponse;
import soqe.libro.server.dto.DashboardSummaryResponse;
import soqe.libro.server.dto.OperationalAlertsResponse;
import soqe.libro.server.service.AnalyticsService;

@RestController
@RequestMapping("/admin/dashboard")
@RequiredArgsConstructor
public class AdminDashboardController {

    private final AnalyticsService analyticsService;

    @GetMapping("/summary")
    public ResponseEntity<DashboardSummaryResponse> getDashboardSummary() {
        return ResponseEntity.ok(analyticsService.getDashboardSummary());
    }

    @GetMapping("/circulation-trends")
    public ResponseEntity<CirculationTrendResponse> getCirculationTrends(
            @RequestParam(defaultValue = "30d") String period) {
        return ResponseEntity.ok(analyticsService.getCirculationTrends(period));
    }

    @GetMapping("/operational-alerts")
    public ResponseEntity<OperationalAlertsResponse> getOperationalAlerts() {
        return ResponseEntity.ok(analyticsService.getOperationalAlerts());
    }
}
