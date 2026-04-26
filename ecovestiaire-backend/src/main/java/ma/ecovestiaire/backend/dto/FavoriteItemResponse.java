package ma.ecovestiaire.backend.dto;

import lombok.Data;
import ma.ecovestiaire.backend.enums.ItemStatus;

import java.math.BigDecimal;

@Data
public class FavoriteItemResponse {

    private Long itemId;
    private String title;
    private BigDecimal price;
    private String imageUrl;
    private ItemStatus status;
    private Long likesCount;
}