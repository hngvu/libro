package soqe.libro.server.dto;

import jakarta.validation.constraints.NotBlank;

public record SystemSettingUpdateRequest(
        @NotBlank(message = "Setting value cannot be blank")
        String settingValue
) {}
