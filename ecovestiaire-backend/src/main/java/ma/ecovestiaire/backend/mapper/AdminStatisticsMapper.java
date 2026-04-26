package ma.ecovestiaire.backend.mapper;

import ma.ecovestiaire.backend.dto.AdminStatisticsResponse;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Map;

@Component
public class AdminStatisticsMapper {

    public AdminStatisticsResponse toDto(long totalUsers, long totalActiveUsers, long totalItems, long totalOrders, BigDecimal totalRevenue, Map<String, Long> itemsPerCategory, Map<String, Long> newUsersPerDay) {
        AdminStatisticsResponse dto = new AdminStatisticsResponse();
        dto.setTotalUsers(totalUsers);
        dto.setTotalActiveUsers(totalActiveUsers);
        dto.setTotalItems(totalItems);
        dto.setTotalOrders(totalOrders);
        dto.setTotalRevenue(totalRevenue);
        dto.setItemsPerCategory(itemsPerCategory);
        dto.setNewUsersPerDay(newUsersPerDay);
        return dto;
    }
}
