package ma.ecovestiaire.backend.repository;

import ma.ecovestiaire.backend.entity.Comment;
import ma.ecovestiaire.backend.entity.Item;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    List<Comment> findByItemOrderByCreatedAtAsc(Item item);

    @Query(
            value = "select c from Comment c join fetch c.user join fetch c.item",
            countQuery = "select count(c) from Comment c"
    )
    Page<Comment> findAllWithUserAndItem(Pageable pageable);

    @Query(
            value = "select c from Comment c join fetch c.user u join fetch c.item i " +
                    "where (:reportedOnly = false or c.reported = true) " +
                    "and (:query is null or :query = '' or lower(c.content) like lower(concat('%', :query, '%')) " +
                    "or lower(u.firstName) like lower(concat('%', :query, '%')) " +
                    "or lower(u.lastName) like lower(concat('%', :query, '%')) " +
                    "or lower(i.title) like lower(concat('%', :query, '%')))",
            countQuery = "select count(c) from Comment c join c.user u join c.item i " +
                    "where (:reportedOnly = false or c.reported = true) " +
                    "and (:query is null or :query = '' or lower(c.content) like lower(concat('%', :query, '%')) " +
                    "or lower(u.firstName) like lower(concat('%', :query, '%')) " +
                    "or lower(u.lastName) like lower(concat('%', :query, '%')) " +
                    "or lower(i.title) like lower(concat('%', :query, '%')))"
    )
    Page<Comment> findAllWithFilters(
            @Param("reportedOnly") boolean reportedOnly,
            @Param("query") String query,
            Pageable pageable
    );

    void deleteByItemId(Long itemId);
}