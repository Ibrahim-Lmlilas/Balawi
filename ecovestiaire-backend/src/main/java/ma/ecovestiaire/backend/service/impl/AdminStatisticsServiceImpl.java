package ma.ecovestiaire.backend.service.impl;

import ma.ecovestiaire.backend.dto.AdminStatisticsResponse;
import ma.ecovestiaire.backend.enums.UserStatus;
import ma.ecovestiaire.backend.mapper.AdminStatisticsMapper;
import ma.ecovestiaire.backend.repository.ItemRepository;
import ma.ecovestiaire.backend.repository.OrderRepository;
import ma.ecovestiaire.backend.repository.UserRepository;
import ma.ecovestiaire.backend.service.AdminStatisticsService;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AdminStatisticsServiceImpl implements AdminStatisticsService {

    private final UserRepository userRepository;
    private final ItemRepository itemRepository;
    private final OrderRepository orderRepository;
    private final AdminStatisticsMapper adminStatisticsMapper;

    public AdminStatisticsServiceImpl(UserRepository userRepository,
                                      ItemRepository itemRepository,
                                      OrderRepository orderRepository,
                                      AdminStatisticsMapper adminStatisticsMapper) {
        this.userRepository = userRepository;
        this.itemRepository = itemRepository;
        this.orderRepository = orderRepository;
        this.adminStatisticsMapper = adminStatisticsMapper;
    }

    @Override
    public AdminStatisticsResponse getStatistics() {
        long totalUsers = userRepository.countByDeletedFalse();
        long totalActiveUsers = userRepository.countByDeletedFalseAndStatus(UserStatus.ACTIVE);
        long totalItems = itemRepository.count();
        long totalOrders = orderRepository.count();
        BigDecimal totalRevenue = BigDecimal.ZERO;

        // Articles par catégorie
        List<Object[]> rows = itemRepository.countItemsPerCategory();
        Map<String, Long> perCategory = new HashMap<>();
        for (Object[] row : rows) {
            String categoryName = (String) row[0];
            Long count = (Long) row[1];
            perCategory.put(categoryName, count);
        }

        // Nouveaux inscrits par jour
        List<Object[]> userRows = userRepository.countNewUsersPerDay();
        Map<String, Long> newUsersPerDay = new HashMap<>();
        for (Object[] row : userRows) {
            String dateStr = (String) row[0];
            Long count = ((Number) row[1]).longValue();
            newUsersPerDay.put(dateStr, count);
        }

        return adminStatisticsMapper.toDto(totalUsers, totalActiveUsers, totalItems, totalOrders, totalRevenue, perCategory, newUsersPerDay);
    }
}