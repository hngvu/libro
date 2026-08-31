package soqe.libro.server.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.Map;

@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ErrorResponseDto {
    @Builder.Default
    private boolean success = false;
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();
    
    private String message;
    private String path;
    
    // Bỏ qua status/error name vì trùng lặp với HTTP status code
    // Lưu các lỗi validation cụ thể (Ví dụ: {"email": "Không đúng định dạng"})
    private Map<String, String> validationErrors;
}
