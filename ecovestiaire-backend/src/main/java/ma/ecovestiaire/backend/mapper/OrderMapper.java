package ma.ecovestiaire.backend.mapper;

import ma.ecovestiaire.backend.dto.CreateOrderRequest;
import ma.ecovestiaire.backend.dto.OrderResponse;
import ma.ecovestiaire.backend.entity.Item;
import ma.ecovestiaire.backend.entity.Order;
import ma.ecovestiaire.backend.entity.User;
import ma.ecovestiaire.backend.enums.OrderStatus;
import org.springframework.stereotype.Component;

@Component
public class OrderMapper {

    private final ShippingMapper shippingMapper;

    public OrderMapper(ShippingMapper shippingMapper) {
        this.shippingMapper = shippingMapper;
    }

    public Order toEntity(CreateOrderRequest request, Item item, User buyer) {
        return Order.builder()
                .item(item)
                .buyer(buyer)
                .amount(item.getPrice())
                .status(OrderStatus.PENDING_PAYMENT)
                .shipping(shippingMapper.toEntity(request.getShipping()))
                .build();
    }

    public OrderResponse toDto(Order order) {
        if (order == null) {
            return null;
        }
        OrderResponse dto = new OrderResponse();
        dto.setId(order.getId());
        
        if (order.getItem() != null) {
            dto.setItemId(order.getItem().getId());
            dto.setItemTitle(order.getItem().getTitle());
            if (order.getItem().getPhotos() != null && !order.getItem().getPhotos().isEmpty()) {
                dto.setItemImageUrl(order.getItem().getPhotos().get(0));
            }
            if (order.getItem().getSeller() != null) {
                dto.setSellerId(order.getItem().getSeller().getId());
                dto.setSellerName(order.getItem().getSeller().getFirstName() + " " + order.getItem().getSeller().getLastName());
            }
        }
        
        dto.setAmount(order.getAmount());
        dto.setStatus(order.getStatus());
        dto.setStripePaymentIntentId(order.getStripePaymentIntentId());
        dto.setStripePaymentId(order.getStripePaymentId());
        
        if (order.getShipping() != null) {
            dto.setShipping(shippingMapper.toDto(order.getShipping()));
        }
        
        if (order.getBuyer() != null) {
            dto.setBuyerId(order.getBuyer().getId());
            dto.setBuyerName(order.getBuyer().getFirstName() + " " + order.getBuyer().getLastName());
        }
        
        dto.setCreatedAt(order.getCreatedAt());
        return dto;
    }
}
