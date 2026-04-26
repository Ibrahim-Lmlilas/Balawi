package ma.ecovestiaire.backend.service.impl;

import ma.ecovestiaire.backend.dto.CreateOrderRequest;
import ma.ecovestiaire.backend.dto.OrderResponse;
import ma.ecovestiaire.backend.entity.Item;
import ma.ecovestiaire.backend.entity.Order;
import ma.ecovestiaire.backend.entity.User;
import ma.ecovestiaire.backend.enums.ItemStatus;
import ma.ecovestiaire.backend.enums.OrderStatus;
import ma.ecovestiaire.backend.mapper.OrderMapper;
import ma.ecovestiaire.backend.repository.ItemRepository;
import ma.ecovestiaire.backend.repository.OrderRepository;
import ma.ecovestiaire.backend.repository.UserRepository;
import ma.ecovestiaire.backend.service.OrderService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final ItemRepository itemRepository;
    private final UserRepository userRepository;
    private final OrderMapper orderMapper;

    public OrderServiceImpl(OrderRepository orderRepository,
                            ItemRepository itemRepository,
                            UserRepository userRepository,
                            OrderMapper orderMapper) {
        this.orderRepository = orderRepository;
        this.itemRepository = itemRepository;
        this.userRepository = userRepository;
        this.orderMapper = orderMapper;
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Utilisateur introuvable"));
    }

    private OrderResponse toDto(Order order) {
        return orderMapper.toDto(order);
    }


    @Override
    @Transactional
    public OrderResponse createOrder(CreateOrderRequest request) {
        User buyer = getCurrentUser();

        Item item = itemRepository.findById(request.getItemId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Article introuvable"
                ));

        if (item.getStatus() != ItemStatus.AVAILABLE) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Cet article n'est pas disponible à l'achat"
            );
        }

        Order order = orderMapper.toEntity(request, item, buyer);

        item.setStatus(ItemStatus.RESERVED);

        Order savedOrder = orderRepository.save(order);
        itemRepository.save(item);

        return toDto(savedOrder);
    }

    @Override
    public OrderResponse getActiveOrderForItem(Long itemId) {
        User buyer = getCurrentUser();
        Order order = orderRepository
                .findFirstByBuyerAndItem_IdAndStatusOrderByCreatedAtDesc(buyer, itemId, OrderStatus.PENDING_PAYMENT)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Aucune commande active"));
        return toDto(order);
    }

    @Override
    @Transactional
    public OrderResponse cancelOrder(Long orderId) {
        User buyer = getCurrentUser();
        Order order = orderRepository.findByIdAndBuyer(orderId, buyer)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Commande introuvable"));

        if (order.getStatus() != OrderStatus.PENDING_PAYMENT) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Commande non annulable");
        }

        order.setStatus(OrderStatus.CANCELLED);

        if (order.getItem() != null && order.getItem().getStatus() == ItemStatus.RESERVED) {
            order.getItem().setStatus(ItemStatus.AVAILABLE);
            itemRepository.save(order.getItem());
        }

        Order saved = orderRepository.save(order);
        return toDto(saved);
    }

    @Override
    public List<OrderResponse> getMyOrders() {
        User buyer = getCurrentUser();
        return orderRepository.findByBuyer(buyer)
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Override
    public Page<OrderResponse> getMyPurchases(int page, int size, String sortDir) {
        User buyer = getCurrentUser();
        Sort.Direction direction = Sort.Direction.fromString(sortDir);
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, "createdAt"));

        Page<Order> ordersPage = orderRepository.findByBuyer(buyer, pageable);
        return ordersPage.map(this::toDto);
    }

    @Override
    public Page<OrderResponse> getMySales(int page, int size, String sortDir) {
        User seller = getCurrentUser();
        Sort.Direction direction = Sort.Direction.fromString(sortDir);
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, "createdAt"));

        Page<Order> ordersPage = orderRepository.findByItem_Seller(seller, pageable);
        return ordersPage.map(this::toDto);
    }

    @Override
    public Page<OrderResponse> getAllOrders(Pageable pageable) {
        Page<Order> ordersPage = orderRepository.findAll(pageable);
        return ordersPage.map(this::toDto);
    }

    @Override
    @Transactional
    public OrderResponse updateOrderStatus(Long orderId, String status) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Commande introuvable"));

        OrderStatus newStatus;
        try {
            newStatus = OrderStatus.valueOf(status);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Statut invalide");
        }

        order.setStatus(newStatus);

        if (newStatus == OrderStatus.CANCELLED && order.getItem() != null && order.getItem().getStatus() == ItemStatus.RESERVED) {
            order.getItem().setStatus(ItemStatus.AVAILABLE);
            itemRepository.save(order.getItem());
        }

        Order saved = orderRepository.save(order);
        return toDto(saved);
    }
}