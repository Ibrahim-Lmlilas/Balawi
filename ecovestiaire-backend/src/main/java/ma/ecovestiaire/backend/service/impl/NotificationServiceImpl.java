package ma.ecovestiaire.backend.service.impl;

import ma.ecovestiaire.backend.dto.NotificationResponse;
import ma.ecovestiaire.backend.entity.Notification;
import ma.ecovestiaire.backend.entity.User;
import ma.ecovestiaire.backend.enums.NotificationType;
import ma.ecovestiaire.backend.mapper.NotificationMapper;
import ma.ecovestiaire.backend.repository.NotificationRepository;
import ma.ecovestiaire.backend.repository.UserRepository;
import ma.ecovestiaire.backend.service.NotificationService;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationMapper notificationMapper;

    public NotificationServiceImpl(NotificationRepository notificationRepository,
            UserRepository userRepository,
            SimpMessagingTemplate messagingTemplate,
            NotificationMapper notificationMapper) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.messagingTemplate = messagingTemplate;
        this.notificationMapper = notificationMapper;
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Utilisateur introuvable"));
    }

    private NotificationResponse toResponse(Notification notification) {
        return notificationMapper.toDto(notification);
    }

    @Override
    @Transactional
    public List<NotificationResponse> getMyNotifications(boolean markAsRead) {
        User currentUser = getCurrentUser();

        if (markAsRead) {
            notificationRepository.markAllAsReadForUser(currentUser);
            notificationRepository.flush();
        }

        List<Notification> notifications = notificationRepository.findByUserOrderByCreatedAtDesc(currentUser);

        return notifications.stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public void createNotification(User targetUser, NotificationType type, String message, String link) {
        Notification notification = notificationMapper.toEntity(targetUser, type, message, link);

        Notification saved = notificationRepository.save(notification);

        // Envoi temps réel sur WebSocket si le user est connecté
        NotificationResponse payload = toResponse(saved);

        String userDest = targetUser.getEmail();

        messagingTemplate.convertAndSendToUser(
                userDest,
                "/queue/notifications",
                payload);
    }

    @Override
    @Transactional
    public void markAsRead(Long id) {
        User currentUser = getCurrentUser();
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification introuvable"));

        if (!notification.getUser().getId().equals(currentUser.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Accès refusé");
        }

        notification.setRead(true);
        notificationRepository.save(notification);
    }
}