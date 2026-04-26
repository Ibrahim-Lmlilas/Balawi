package ma.ecovestiaire.backend.dto;

import lombok.Data;
import ma.ecovestiaire.backend.enums.OrderStatus;

import java.math.BigDecimal;
import java.time.Instant;

@Data
public class OrderResponse {

    private Long id;
    private Long itemId;
    private String itemTitle;
    private String itemImageUrl;
    private BigDecimal amount;
    private OrderStatus status;
    private String stripePaymentIntentId;
    private String stripePaymentId;
    private OrderShippingDto shipping;
    private Long buyerId;
    private String buyerName;
    private Long sellerId;
    private String sellerName;
    private Instant createdAt;
}