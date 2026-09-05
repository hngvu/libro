package soqe.libro.server.exception;

import java.util.Map;

public class BusinessValidationException extends RuntimeException {
    private final Map<String, String> errors;

    public BusinessValidationException(String message, Map<String, String> errors) {
        super(message);
        this.errors = errors;
    }

    public Map<String, String> getErrors() {
        return errors;
    }
}
