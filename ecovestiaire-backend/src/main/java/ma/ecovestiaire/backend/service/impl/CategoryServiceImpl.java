package ma.ecovestiaire.backend.service.impl;

import ma.ecovestiaire.backend.dto.CategoryRequest;
import ma.ecovestiaire.backend.dto.CategoryResponse;
import ma.ecovestiaire.backend.entity.Category;
import ma.ecovestiaire.backend.mapper.CategoryMapper;
import ma.ecovestiaire.backend.repository.CategoryRepository;
import ma.ecovestiaire.backend.service.CategoryService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;
    private final CategoryMapper categoryMapper;

    public CategoryServiceImpl(CategoryRepository categoryRepository, CategoryMapper categoryMapper) {
        this.categoryRepository = categoryRepository;
        this.categoryMapper = categoryMapper;
    }

    @Override
    public CategoryResponse createCategory(CategoryRequest request, String iconPath) {
        if (categoryRepository.existsByName(request.getName())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Une catégorie avec ce nom existe déjà"
            );
        }

        Category category = categoryMapper.toEntity(request);
        category.setIcon(iconPath);

        Category saved = categoryRepository.save(category);
        return categoryMapper.toDto(saved);
    }

    @Override
    public CategoryResponse updateCategory(Long id, CategoryRequest request, String iconPath) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Catégorie introuvable"
                ));

        // si le nom change, vérifier l'unicité
        if (request.getName() != null && !request.getName().equals(category.getName())) {
            if (categoryRepository.existsByName(request.getName())) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Une autre catégorie possède déjà ce nom"
                );
            }
            category.setName(request.getName());
        }

        if (request.getDescription() != null) {
            category.setDescription(request.getDescription());
        }

        if (iconPath != null) {
            category.setIcon(iconPath);
        }

        Category saved = categoryRepository.save(category);
        return categoryMapper.toDto(saved);
    }

    @Override
    public void deleteCategory(Long id) {
        if (!categoryRepository.existsById(id)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Catégorie introuvable"
            );
        }
        categoryRepository.deleteById(id);
    }

    @Override
    public List<CategoryResponse> getAllCategories() {
        return categoryRepository.findAllCategoriesWithItemCount()
                .stream()
                .map(categoryMapper::toDto)
                .toList();
    }
}