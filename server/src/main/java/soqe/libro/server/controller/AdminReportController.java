package soqe.libro.server.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import soqe.libro.server.dto.CategoryDistributionResponse;
import soqe.libro.server.dto.RevenueReportResponse;
import soqe.libro.server.dto.TopBorrowedBookResponse;
import soqe.libro.server.service.AnalyticsService;

import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/admin/reports")
@RequiredArgsConstructor
public class AdminReportController {

    private final AnalyticsService analyticsService;

    @GetMapping("/top-books")
    public ResponseEntity<List<TopBorrowedBookResponse>> getTopBorrowedBooks(
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(analyticsService.getTopBorrowedBooks(limit));
    }

    @GetMapping("/category-distribution")
    public ResponseEntity<CategoryDistributionResponse> getCategoryDistribution() {
        return ResponseEntity.ok(analyticsService.getCategoryDistribution());
    }

    @GetMapping("/revenue")
    public ResponseEntity<RevenueReportResponse> getRevenueReport() {
        return ResponseEntity.ok(analyticsService.getRevenueReport());
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> exportReport(
            @RequestParam(defaultValue = "top-books") String type) {
        String csvContent = analyticsService.exportCsvReport(type);
        byte[] bytes = csvContent.getBytes(StandardCharsets.UTF_8);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"libro_report_" + type + "_" + System.currentTimeMillis() + ".csv\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(bytes);
    }
}
