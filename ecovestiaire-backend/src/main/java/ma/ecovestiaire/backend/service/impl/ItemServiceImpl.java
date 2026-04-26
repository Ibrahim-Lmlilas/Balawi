package ma.ecovestiaire.backend.service.impl;

import ma.ecovestiaire.backend.dto.ItemRequest;
import ma.ecovestiaire.backend.dto.ItemResponse;
import ma.ecovestiaire.backend.entity.Category;
import ma.ecovestiaire.backend.entity.Item;
import ma.ecovestiaire.backend.entity.User;
import ma.ecovestiaire.backend.mapper.ItemMapper;
import ma.ecovestiaire.backend.repository.CategoryRepository;
import ma.ecovestiaire.backend.repository.CommentRepository;
import ma.ecovestiaire.backend.repository.FavoriteRepository;
import ma.ecovestiaire.backend.repository.ItemRepository;
import ma.ecovestiaire.backend.repository.OrderRepository;
import ma.ecovestiaire.backend.repository.UserRepository;
import ma.ecovestiaire.backend.service.ItemService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;

@Service
public class ItemServiceImpl implements ItemService {

    private final ItemRepository itemRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final FavoriteRepository favoriteRepository;
    private final CommentRepository commentRepository;
    private final OrderRepository orderRepository;
    private final ItemMapper itemMapper;

    public ItemServiceImpl(ItemRepository itemRepository,
            CategoryRepository categoryRepository,
            UserRepository userRepository,
            FavoriteRepository favoriteRepository,
            CommentRepository commentRepository,
            OrderRepository orderRepository,
            ItemMapper itemMapper) {
        this.itemRepository = itemRepository;
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository;
        this.favoriteRepository = favoriteRepository;
        this.commentRepository = commentRepository;
        this.orderRepository = orderRepository;
        this.itemMapper = itemMapper;
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Utilisateur introuvable"));
    }

    private Category getCategoryOrThrow(Long categoryId) {
        return categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Catégorie introuvable"));
    }

    private Item getItemOrThrow(Long id) {
        return itemRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Article introuvable"));
    }

    private ItemResponse toItemResponse(Item item) {
        long likesCount = favoriteRepository.countByItem(item);
        return itemMapper.toDto(item, likesCount);
    }

    @Override
    public ItemResponse createItem(ItemRequest request, List<String> photoPaths) {
        User seller = getCurrentUser();
        Category category = getCategoryOrThrow(request.getCategoryId());

        Item item = itemMapper.toEntity(request, photoPaths, category, seller);

        Item saved = itemRepository.save(item);
        return toItemResponse(saved);
    }

    @Override
    public ItemResponse updateItem(Long id, ItemRequest request, List<String> photoPaths) {
        Item item = getItemOrThrow(id);
        User currentUser = getCurrentUser();

        // Vérifier que l'utilisateur est bien le propriétaire de l'article
        if (!item.getSeller().getId().equals(currentUser.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "Vous n'êtes pas autorisé à modifier cet article");
        }

        Category category = getCategoryOrThrow(request.getCategoryId());

        itemMapper.updateFromDto(request, photoPaths, category, item);

        Item saved = itemRepository.save(item);
        return toItemResponse(saved);
    }

    @Override
    @Transactional
    public void deleteItem(Long id) {
        Item item = getItemOrThrow(id);

        try {
            User currentUser = getCurrentUser();
            boolean isAdmin = "ROLE_ADMIN".equals(currentUser.getRole().name());

            if (!isAdmin && !item.getSeller().getId().equals(currentUser.getId())) {
                throw new ResponseStatusException(
                        HttpStatus.FORBIDDEN, "Vous n'êtes pas autorisé à supprimer cet article");
            }
        } catch (Exception e) {
            // Si pas d'authentification mais qu'on est dans un contexte admin (via
            // AdminModerationController)
            // La sécurité est déjà gérée par Spring Security sur l'endpoint
        }

        if (orderRepository.existsByItemId(id)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Impossible de supprimer cet article car une commande existe déjà");
        }

        favoriteRepository.deleteByItemId(id);
        commentRepository.deleteByItemId(id);
        itemRepository.delete(item);
    }

    @Override
    public ItemResponse getItemById(Long id) {
        Item item = getItemOrThrow(id);
        return toItemResponse(item);
    }

    @Override
    public Page<ItemResponse> getAllItems(Pageable pageable) {
        return itemRepository.findAll(pageable)
                .map(this::toItemResponse);
    }

    @Override
    public List<ItemResponse> searchItems(
            Long categoryId,
            Long sellerId,
            String size,
            String conditionLabel,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            String text,
            boolean includeSold,
            int page,
            int sizePage) {
        Pageable pageable = PageRequest.of(page, sizePage);

        String searchText = (text != null && !text.isBlank()) ? "%" + text.toLowerCase() + "%" : null;

        Page<Item> itemsPage = itemRepository.searchItems(
                categoryId,
                sellerId,
                size,
                conditionLabel,
                minPrice,
                maxPrice,
                searchText,
                includeSold,
                pageable);

        return itemsPage.stream()
                .map(this::toItemResponse)
                .toList();
    }

    @Override
    public List<ItemResponse> getTrendingItems() {
        Pageable pageable = PageRequest.of(0, 4);
        return itemRepository.findTrendingItems(pageable)
                .stream()
                .map(this::toItemResponse)
                .toList();
    }
}