package soqe.libro.server.dto;

public record StripeCheckoutResponse(
        String checkoutUrl,
        String sessionId
) {}
