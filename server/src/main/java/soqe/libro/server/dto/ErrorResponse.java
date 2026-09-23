package soqe.libro.server.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.Map;

@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ErrorResponse {
    @Builder.Default
    private boolean success = false;
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();
    
    private String message;
    private String path;
    private String requestId;
    
    private Map<String, String> validationErrors;
}
