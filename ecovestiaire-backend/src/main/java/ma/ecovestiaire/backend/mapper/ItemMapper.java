package ma.ecovestiaire.backend.mapper;

import java.util.List;
import ma.ecovestiaire.backend.dto.ItemRequest;
import ma.ecovestiaire.backend.dto.ItemResponse;
import ma.ecovestiaire.backend.entity.Category;
import ma.ecovestiaire.backend.entity.Item;
import ma.ecovestiaire.backend.entity.User;
import ma.ecovestiaire.backend.enums.ItemStatus;
import org.springframework.stereotype.Component;

@Component
public class ItemMapper {

    public Item toEntity(ItemRequest request, List<String> photoPaths, Category category, User seller) {
        if (request == null) {
            return null;
        }
        return Item.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .price(request.getPrice())
                .size(request.getSize())
                .conditionLabel(request.getConditionLabel())
                .category(category)
                .seller(seller)
                .photos(photoPaths)
                .status(ItemStatus.AVAILABLE)
                .build();
    }

    public void updateFromDto(ItemRequest request, List<String> photoPaths, Category category, Item item) {
        if (request == null || item == null) {
            return;
        }
        item.setTitle(request.getTitle());
        item.setDescription(request.getDescription());
        item.setPrice(request.getPrice());
        item.setSize(request.getSize());
        item.setConditionLabel(request.getConditionLabel());
        item.setCategory(category);
        if (photoPaths != null && !photoPaths.isEmpty()) {
            item.setPhotos(photoPaths);
        }
    }

    public ItemResponse toDto(Item item, long likesCount) {
        if (item == null) {
            return null;
        }
        ItemResponse dto = new ItemResponse();
        dto.setId(item.getId());
        dto.setTitle(item.getTitle());
        dto.setDescription(item.getDescription());
        dto.setPrice(item.getPrice());
        dto.setLikesCount(likesCount);
        dto.setSize(item.getSize());
        dto.setConditionLabel(item.getConditionLabel());
        dto.setStatus(item.getStatus().name());
        dto.setPhotos(item.getPhotos());
        
        if (item.getCategory() != null) {
            dto.setCategoryId(item.getCategory().getId());
            dto.setCategoryName(item.getCategory().getName());
        }
        
        if (item.getSeller() != null) {
            dto.setSellerId(item.getSeller().getId());
            dto.setSellerFirstName(item.getSeller().getFirstName());
            dto.setSellerLastName(item.getSeller().getLastName());
            dto.setSellerProfilePhotoUrl(item.getSeller().getProfilePhotoUrl());
        }
        
        dto.setCreatedAt(item.getCreatedAt());
        dto.setUpdatedAt(item.getUpdatedAt());
        return dto;
    }
}
