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
    
    // Bá» qua status/error name vÃ¬ trÃ¹ng láº·p vá»›i HTTP status code
    // LÆ°u cÃ¡c lá»—i validation cá»¥ thá»ƒ (VÃ­ dá»¥: {"email": "KhÃ´ng Ä‘Ãºng Ä‘á»‹nh dáº¡ng"})
    private Map<String, String> validationErrors;
}
