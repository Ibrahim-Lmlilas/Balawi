package ma.ecovestiaire.backend.mapper;

import ma.ecovestiaire.backend.dto.OrderShippingDto;
import ma.ecovestiaire.backend.entity.OrderShipping;
import org.springframework.stereotype.Component;

@Component
public class ShippingMapper {

    public OrderShippingDto toDto(OrderShipping shipping) {
        if (shipping == null) {
            return null;
        }
        OrderShippingDto dto = new OrderShippingDto();
        dto.setFirstName(shipping.getFirstName());
        dto.setLastName(shipping.getLastName());
        dto.setAddress1(shipping.getAddress1());
        dto.setCity(shipping.getCity());
        dto.setZip(shipping.getZip());
        dto.setCountry(shipping.getCountry());
        dto.setPhone(shipping.getPhone());
        return dto;
    }

    public OrderShipping toEntity(OrderShippingDto dto) {
        if (dto == null) {
            return null;
        }
        return OrderShipping.builder()
                .firstName(dto.getFirstName())
                .lastName(dto.getLastName())
                .address1(dto.getAddress1())
                .city(dto.getCity())
                .zip(dto.getZip())
                .country(dto.getCountry())
                .phone(dto.getPhone())
                .build();
    }
}
