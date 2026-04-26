package ma.ecovestiaire.backend.service;

import ma.ecovestiaire.backend.dto.CategoryRequest;
import ma.ecovestiaire.backend.dto.CategoryResponse;

import java.util.List;

public interface CategoryService {

    CategoryResponse createCategory(CategoryRequest request, String iconPath);

    CategoryResponse updateCategory(Long id, CategoryRequest request, String iconPath);

    void deleteCategory(Long id);

    List<CategoryResponse> getAllCategories();
}