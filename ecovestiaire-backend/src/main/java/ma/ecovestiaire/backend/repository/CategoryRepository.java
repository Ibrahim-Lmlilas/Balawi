package ma.ecovestiaire.backend.repository;

import ma.ecovestiaire.backend.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, Long> {

    boolean existsByName(String name);

    Optional<Category> findByName(String name);

    @Query("SELECT c.id, c.name, c.description, c.icon, COUNT(i.id), c.createdAt, c.updatedAt " +
           "FROM Category c LEFT JOIN Item i ON i.category.id = c.id " +
           "GROUP BY c.id, c.name, c.description, c.icon, c.createdAt, c.updatedAt")
    List<Object[]> findAllCategoriesWithItemCount();
}