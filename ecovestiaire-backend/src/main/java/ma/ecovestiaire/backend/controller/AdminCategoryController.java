package ma.ecovestiaire.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import ma.ecovestiaire.backend.dto.CategoryRequest;
import ma.ecovestiaire.backend.dto.CategoryResponse;
import ma.ecovestiaire.backend.service.CategoryService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/api/admin/categories")
public class AdminCategoryController {

    private final CategoryService categoryService;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private static final String UPLOAD_DIR = "uploads/categories";

    public AdminCategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    private String saveIcon(MultipartFile icon) throws IOException {
        if (icon == null || icon.isEmpty()) {
            return null;
        }

        Path uploadPath = Paths.get(UPLOAD_DIR);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        String fileName = System.currentTimeMillis() + "_" + icon.getOriginalFilename();
        Path filePath = uploadPath.resolve(fileName);
        Files.copy(icon.getInputStream(), filePath);

        return UPLOAD_DIR + "/" + fileName;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<CategoryResponse> createCategory(
            @RequestPart("data") CategoryRequest request,
            @RequestPart(value = "icon", required = false) MultipartFile icon
    ) throws IOException {
        String iconPath = saveIcon(icon);
        CategoryResponse response = categoryService.createCategory(request, iconPath);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<CategoryResponse> updateCategory(
            @PathVariable Long id,
            @RequestPart("data") CategoryRequest request,
            @RequestPart(value = "icon", required = false) MultipartFile icon
    ) throws IOException {
        String iconPath = saveIcon(icon);
        CategoryResponse response = categoryService.updateCategory(id, request, iconPath);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable Long id) {
        categoryService.deleteCategory(id);
        return ResponseEntity.noContent().build();
    }
}