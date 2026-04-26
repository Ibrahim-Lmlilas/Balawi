package ma.ecovestiaire.backend.jobs;

import ma.ecovestiaire.backend.entity.Order;
import ma.ecovestiaire.backend.enums.ItemStatus;
import ma.ecovestiaire.backend.enums.OrderStatus;
import ma.ecovestiaire.backend.repository.ItemRepository;
import ma.ecovestiaire.backend.repository.OrderRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Component
public class OrderReservationScheduler {

    private static final long RESERVATION_MINUTES = 10;

    private final OrderRepository orderRepository;
    private final ItemRepository itemRepository;

    public OrderReservationScheduler(OrderRepository orderRepository, ItemRepository itemRepository) {
        this.orderRepository = orderRepository;
        this.itemRepository = itemRepository;
    }

    @Scheduled(fixedDelay = 60_000)
    @Transactional
    public void releaseExpiredReservations() {
        Instant cutoff = Instant.now().minus(RESERVATION_MINUTES, ChronoUnit.MINUTES);

        List<Order> expiredOrders = orderRepository.findByStatusAndCreatedAtBefore(
                OrderStatus.PENDING_PAYMENT,
                cutoff
        );

        for (Order order : expiredOrders) {
            order.setStatus(OrderStatus.CANCELLED);

            if (order.getItem() != null && order.getItem().getStatus() == ItemStatus.RESERVED) {
                order.getItem().setStatus(ItemStatus.AVAILABLE);
                itemRepository.save(order.getItem());
            }

            orderRepository.save(order);
        }
    }
}
