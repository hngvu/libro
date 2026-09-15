package soqe.libro.server.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import soqe.libro.server.dto.SystemSettingResponse;
import soqe.libro.server.dto.SystemSettingUpdateRequest;
import soqe.libro.server.service.SystemSettingService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/settings")
@RequiredArgsConstructor
public class AdminSystemSettingController {

    private final SystemSettingService systemSettingService;

    @GetMapping
    public ResponseEntity<List<SystemSettingResponse>> getAllSettings() {
        return ResponseEntity.ok(systemSettingService.getAllSettings());
    }

    @GetMapping("/category/{category}")
    public ResponseEntity<List<SystemSettingResponse>> getSettingsByCategory(@PathVariable String category) {
        return ResponseEntity.ok(systemSettingService.getSettingsByCategory(category));
    }

    @PutMapping("/{key}")
    public ResponseEntity<SystemSettingResponse> updateSetting(
            @PathVariable String key,
            @Valid @RequestBody SystemSettingUpdateRequest request) {
        return ResponseEntity.ok(systemSettingService.updateSetting(key, request.settingValue()));
    }

    @PutMapping
    public ResponseEntity<List<SystemSettingResponse>> bulkUpdateSettings(@RequestBody Map<String, String> settings) {
        return ResponseEntity.ok(systemSettingService.bulkUpdate(settings));
    }
}
