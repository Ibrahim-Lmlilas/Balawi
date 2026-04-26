package ma.ecovestiaire.backend.mapper;

import ma.ecovestiaire.backend.dto.CategoryRequest;
import ma.ecovestiaire.backend.dto.CategoryResponse;
import ma.ecovestiaire.backend.entity.Category;
import org.springframework.stereotype.Component;

@Component
public class CategoryMapper {

    public Category toEntity(CategoryRequest request) {
        if (request == null) {
            return null;
        }
        return Category.builder()
                .name(request.getName())
                .description(request.getDescription())
                .icon(request.getIcon())
                .build();
    }

    public CategoryResponse toDto(Category category) {
        if (category == null) {
            return null;
        }
        CategoryResponse dto = new CategoryResponse();
        dto.setId(category.getId());
        dto.setName(category.getName());
        dto.setDescription(category.getDescription());
        dto.setIcon(category.getIcon());
        dto.setCreatedAt(category.getCreatedAt());
        dto.setUpdatedAt(category.getUpdatedAt());
        return dto;
    }

    public CategoryResponse toDto(Object[] result) {
        if (result == null) {
            return null;
        }
        CategoryResponse dto = new CategoryResponse();
        dto.setId((Long) result[0]);
        dto.setName((String) result[1]);
        dto.setDescription((String) result[2]);
        dto.setIcon((String) result[3]);
        dto.setItemCount((Long) result[4]);
        dto.setCreatedAt((java.time.Instant) result[5]);
        dto.setUpdatedAt((java.time.Instant) result[6]);
        return dto;
    }
}
