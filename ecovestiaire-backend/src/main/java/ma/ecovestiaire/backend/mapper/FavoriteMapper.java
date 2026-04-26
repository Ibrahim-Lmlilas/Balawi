package ma.ecovestiaire.backend.mapper;

import ma.ecovestiaire.backend.dto.FavoriteItemResponse;
import ma.ecovestiaire.backend.entity.Favorite;
import ma.ecovestiaire.backend.entity.Item;
import ma.ecovestiaire.backend.entity.User;
import org.springframework.stereotype.Component;

@Component
public class FavoriteMapper {

    public Favorite toEntity(User user, Item item) {
        if (user == null || item == null) {
            return null;
        }
        return Favorite.builder()
                .user(user)
                .item(item)
                .build();
    }

    public FavoriteItemResponse toFavoriteItemResponse(Item item, long likesCount) {
        if (item == null) {
            return null;
        }
        FavoriteItemResponse dto = new FavoriteItemResponse();
        dto.setItemId(item.getId());
        dto.setTitle(item.getTitle());
        dto.setPrice(item.getPrice());
        
        String firstPhoto = (item.getPhotos() != null && !item.getPhotos().isEmpty())
                ? item.getPhotos().get(0)
                : null;
        dto.setImageUrl(firstPhoto);
        dto.setStatus(item.getStatus());
        dto.setLikesCount(likesCount);
        
        return dto;
    }
}
