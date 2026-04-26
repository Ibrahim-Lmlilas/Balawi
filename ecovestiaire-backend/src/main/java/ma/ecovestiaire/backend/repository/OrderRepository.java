package ma.ecovestiaire.backend.repository;

import ma.ecovestiaire.backend.entity.Order;
import ma.ecovestiaire.backend.entity.User;
import ma.ecovestiaire.backend.enums.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {

    @EntityGraph(attributePaths = {"item", "item.photos", "item.category", "item.seller"})
    List<Order> findByBuyer(User buyer);

    @EntityGraph(attributePaths = {"item", "item.photos", "item.category", "item.seller"})
    Page<Order> findByBuyer(User buyer, Pageable pageable);

    @EntityGraph(attributePaths = {"buyer", "item", "item.photos"})
    Page<Order> findByItem_Seller(User seller, Pageable pageable);

    boolean existsByItemId(Long itemId);

    List<Order> findByStatusAndCreatedAtBefore(OrderStatus status, Instant cutoff);

    Optional<Order> findFirstByBuyerAndItem_IdAndStatusOrderByCreatedAtDesc(User buyer, Long itemId, OrderStatus status);

    Optional<Order> findByIdAndBuyer(Long id, User buyer);
}