package ma.ecovestiaire.backend.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Data
public class ItemResponse {

    private Long id;
    private String title;
    private String description;
    private BigDecimal price;
    private Long likesCount;
    private String size;
    private String conditionLabel;
    private String status;
    private Long categoryId;
    private String categoryName;
    private Long sellerId;
    private String sellerFirstName;
    private String sellerLastName;
    private String sellerProfilePhotoUrl;
    private List<String> photos;
    private Instant createdAt;
    private Instant updatedAt;
}