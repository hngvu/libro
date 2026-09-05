package soqe.libro.server.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import soqe.libro.server.dto.ErrorResponse;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // 1. Lá»—i Validation (khi dÃ¹ng @Valid á»Ÿ Controller)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(MethodArgumentNotValidException ex, HttpServletRequest request) {
        Map<String, String> errors = new HashMap<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            errors.put(error.getField(), error.getDefaultMessage());
        }

        ErrorResponse errorResponse = ErrorResponse.builder()
                .message("Dá»¯ liá»‡u Ä‘áº§u vÃ o khÃ´ng há»£p lá»‡")
                .path(request.getRequestURI())
                .validationErrors(errors)
                .build();
                
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    // 2. Lá»—i khÃ´ng tÃ¬m tháº¥y tÃ i nguyÃªn (404)
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFoundException(ResourceNotFoundException ex, HttpServletRequest request) {
        ErrorResponse errorResponse = ErrorResponse.builder()
                .message(ex.getMessage())
                .path(request.getRequestURI())
                .build();
                
        return new ResponseEntity<>(errorResponse, HttpStatus.NOT_FOUND);
    }

    // 3. Lá»—i trÃ¹ng láº·p dá»¯ liá»‡u hoáº·c quy táº¯c nghiá»‡p vá»¥ (409 Conflict)
    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<ErrorResponse> handleDuplicateResourceException(DuplicateResourceException ex, HttpServletRequest request) {
        ErrorResponse errorResponse = ErrorResponse.builder()
                .message(ex.getMessage())
                .path(request.getRequestURI())
                .build();
                
        return new ResponseEntity<>(errorResponse, HttpStatus.CONFLICT);
    }

    @ExceptionHandler(BusinessValidationException.class)
    public ResponseEntity<ErrorResponse> handleBusinessValidationException(BusinessValidationException ex, HttpServletRequest request) {
        ErrorResponse errorResponse = ErrorResponse.builder()
                .message(ex.getMessage())
                .path(request.getRequestURI())
                .validationErrors(ex.getErrors())
                .build();
                
        return new ResponseEntity<>(errorResponse, HttpStatus.CONFLICT);
    }

    // 4. Lá»—i Request chung chung (400)
    @ExceptionHandler({BadRequestException.class, IllegalArgumentException.class})
    public ResponseEntity<ErrorResponse> handleBadRequestException(RuntimeException ex, HttpServletRequest request) {
        ErrorResponse errorResponse = ErrorResponse.builder()
                .message(ex.getMessage())
                .path(request.getRequestURI())
                .build();
                
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }
    
    // 5. Catch-all: Lá»—i há»‡ thá»‘ng báº¥t ngá» (500)
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGlobalException(Exception ex, HttpServletRequest request) {
        // In log ra console Ä‘á»ƒ dev debug
        ex.printStackTrace(); 
        
        ErrorResponse errorResponse = ErrorResponse.builder()
                .message("ÄÃ£ xáº£y ra lá»—i há»‡ thá»‘ng. Vui lÃ²ng thá»­ láº¡i sau.")
                .path(request.getRequestURI())
                .build();
                
        return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    // 6. Lỗi xác thực (401 Unauthorized) từ Spring Security Filter
    @ExceptionHandler(org.springframework.security.core.AuthenticationException.class)
    public ResponseEntity<soqe.libro.server.dto.ErrorResponse> handleAuthenticationException(org.springframework.security.core.AuthenticationException ex, HttpServletRequest request) {
        soqe.libro.server.dto.ErrorResponse errorResponse = soqe.libro.server.dto.ErrorResponse.builder()
                .message("Xác thực thất bại. Token không hợp lệ, không có hoặc đã hết hạn.")
                .path(request.getRequestURI())
                .build();
        return new ResponseEntity<>(errorResponse, HttpStatus.UNAUTHORIZED);
    }

    // 7. Lỗi phân quyền (403 Forbidden) từ Spring Security Filter
    @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
    public ResponseEntity<soqe.libro.server.dto.ErrorResponse> handleAccessDeniedException(org.springframework.security.access.AccessDeniedException ex, HttpServletRequest request) {
        soqe.libro.server.dto.ErrorResponse errorResponse = soqe.libro.server.dto.ErrorResponse.builder()
                .message("Từ chối truy cập. Bạn không có quyền thực hiện hành động này.")
                .path(request.getRequestURI())
                .build();
        return new ResponseEntity<>(errorResponse, HttpStatus.FORBIDDEN);
    }
}
