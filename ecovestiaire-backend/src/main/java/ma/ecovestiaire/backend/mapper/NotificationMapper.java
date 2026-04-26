package ma.ecovestiaire.backend.mapper;

import ma.ecovestiaire.backend.dto.NotificationResponse;
import ma.ecovestiaire.backend.entity.Notification;
import ma.ecovestiaire.backend.entity.User;
import ma.ecovestiaire.backend.enums.NotificationType;
import org.springframework.stereotype.Component;

@Component
public class NotificationMapper {

    public Notification toEntity(User user, NotificationType type, String message, String link) {
        if (user == null) {
            return null;
        }
        return Notification.builder()
                .user(user)
                .type(type)
                .message(message)
                .link(link)
                .read(false)
                .build();
    }

    public NotificationResponse toDto(Notification notification) {
        if (notification == null) {
            return null;
        }
        NotificationResponse dto = new NotificationResponse();
        dto.setId(notification.getId());
        dto.setType(notification.getType());
        dto.setMessage(notification.getMessage());
        dto.setLink(notification.getLink());
        dto.setRead(notification.isRead());
        dto.setCreatedAt(notification.getCreatedAt());
        return dto;
    }
}
