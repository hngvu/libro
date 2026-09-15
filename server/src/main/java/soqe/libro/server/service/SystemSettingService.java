package soqe.libro.server.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import soqe.libro.server.dto.SystemSettingResponse;
import soqe.libro.server.entity.SystemSetting;
import soqe.libro.server.exception.ResourceNotFoundException;
import soqe.libro.server.repository.SystemSettingRepository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class SystemSettingService {

    private final SystemSettingRepository repository;

    @Transactional(readOnly = true)
    public List<SystemSettingResponse> getAllSettings() {
        return repository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<SystemSettingResponse> getSettingsByCategory(String category) {
        return repository.findByCategoryOrderBySettingKeyAsc(category)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public Optional<String> getValue(String key) {
        return repository.findBySettingKey(key).map(SystemSetting::getSettingValue);
    }

    @Transactional(readOnly = true)
    public BigDecimal getBigDecimal(String key, BigDecimal defaultValue) {
        return getValue(key)
                .map(v -> {
                    try {
                        return new BigDecimal(v.trim());
                    } catch (Exception e) {
                        log.warn("Invalid BigDecimal setting value for key {}: {}", key, v);
                        return defaultValue;
                    }
                })
                .orElse(defaultValue);
    }

    @Transactional(readOnly = true)
    public int getInteger(String key, int defaultValue) {
        return getValue(key)
                .map(v -> {
                    try {
                        return Integer.parseInt(v.trim());
                    } catch (Exception e) {
                        log.warn("Invalid Integer setting value for key {}: {}", key, v);
                        return defaultValue;
                    }
                })
                .orElse(defaultValue);
    }

    @Transactional(readOnly = true)
    public String getString(String key, String defaultValue) {
        return getValue(key).orElse(defaultValue);
    }

    @Transactional
    public SystemSettingResponse updateSetting(String key, String value) {
        SystemSetting setting = repository.findBySettingKey(key)
                .orElseThrow(() -> new ResourceNotFoundException("System setting not found with key: " + key));

        setting.setSettingValue(value != null ? value.trim() : "");
        setting = repository.save(setting);
        log.info("Updated system setting {} to {}", key, value);
        return toResponse(setting);
    }

    @Transactional
    public List<SystemSettingResponse> bulkUpdate(Map<String, String> keyValues) {
        if (keyValues == null || keyValues.isEmpty()) {
            return getAllSettings();
        }

        for (Map.Entry<String, String> entry : keyValues.entrySet()) {
            repository.findBySettingKey(entry.getKey()).ifPresent(setting -> {
                setting.setSettingValue(entry.getValue() != null ? entry.getValue().trim() : "");
                repository.save(setting);
                log.info("Bulk updated setting {} = {}", entry.getKey(), entry.getValue());
            });
        }

        return getAllSettings();
    }

    private SystemSettingResponse toResponse(SystemSetting s) {
        return SystemSettingResponse.builder()
                .id(s.getId())
                .settingKey(s.getSettingKey())
                .settingValue(s.getSettingValue())
                .description(s.getDescription())
                .category(s.getCategory())
                .dataType(s.getDataType() != null ? s.getDataType().name() : "STRING")
                .updatedAt(s.getUpdatedAt())
                .updatedBy(s.getUpdatedBy())
                .build();
    }
}
