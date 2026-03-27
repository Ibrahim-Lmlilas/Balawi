package ma.ecovestiaire.backend.service;

import ma.ecovestiaire.backend.dto.ItemRequest;
import ma.ecovestiaire.backend.dto.ItemResponse;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;

public interface ItemService {

    ItemResponse createItem(ItemRequest request, List<String> photoPaths);

    ItemResponse updateItem(Long id, ItemRequest request, List<String> photoPaths);

    void deleteItem(Long id);

    ItemResponse getItemById(Long id);

    Page<ItemResponse> getAllItems(Pageable pageable);

    List<ItemResponse> searchItems(
            Long categoryId,
            Long sellerId,
            String size,
            String conditionLabel,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            String text,
            boolean includeSold,
            int page,
            int sizePage
    );

    List<ItemResponse> getTrendingItems();
}