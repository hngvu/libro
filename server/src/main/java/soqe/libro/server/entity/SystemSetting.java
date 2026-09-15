package soqe.libro.server.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "system_settings", indexes = {
        @Index(name = "idx_system_setting_key", columnList = "setting_key", unique = true),
        @Index(name = "idx_system_setting_category", columnList = "category")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SystemSetting extends BaseEntity {

    @Column(name = "setting_key", nullable = false, unique = true, length = 100)
    private String settingKey;

    @Column(name = "setting_value", columnDefinition = "TEXT")
    private String settingValue;

    @Column(name = "description", length = 255)
    private String description;

    @Column(name = "category", nullable = false, length = 50)
    private String category;

    @Enumerated(EnumType.STRING)
    @Column(name = "data_type", nullable = false, length = 20)
    private DataType dataType;

    public enum DataType {
        STRING, NUMBER, BOOLEAN, JSON
    }
}
