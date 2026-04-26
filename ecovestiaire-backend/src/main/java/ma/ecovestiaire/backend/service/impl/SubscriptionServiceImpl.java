package ma.ecovestiaire.backend.service.impl;

import ma.ecovestiaire.backend.dto.UserSummaryResponse;
import ma.ecovestiaire.backend.entity.Subscription;
import ma.ecovestiaire.backend.entity.User;
import ma.ecovestiaire.backend.enums.NotificationType;
import ma.ecovestiaire.backend.mapper.SubscriptionMapper;
import ma.ecovestiaire.backend.mapper.UserMapper;
import ma.ecovestiaire.backend.repository.SubscriptionRepository;
import ma.ecovestiaire.backend.repository.UserRepository;
import ma.ecovestiaire.backend.service.NotificationService;
import ma.ecovestiaire.backend.service.SubscriptionService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class SubscriptionServiceImpl implements SubscriptionService {

    private final SubscriptionRepository subscriptionRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final UserMapper userMapper;
    private final SubscriptionMapper subscriptionMapper;

    public SubscriptionServiceImpl(SubscriptionRepository subscriptionRepository,
                                   UserRepository userRepository,
                                   NotificationService notificationService,
                                   UserMapper userMapper,
                                   SubscriptionMapper subscriptionMapper) {
        this.subscriptionRepository = subscriptionRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.userMapper = userMapper;
        this.subscriptionMapper = subscriptionMapper;
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Utilisateur introuvable"
                ));
    }

    private User getTargetUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Utilisateur à suivre introuvable"
                ));
    }

    private UserSummaryResponse toUserSummary(User user) {
        return userMapper.toUserSummaryResponse(user);
    }

    @Override
    public void followUser(Long userIdToFollow) {
        User current = getCurrentUser();
        User target = getTargetUser(userIdToFollow);

        if (current.getId().equals(target.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Vous ne pouvez pas vous suivre vous-même"
            );
        }

        if (subscriptionRepository.existsByFollowerAndFollowing(current, target)) {
            return;
        }

        Subscription subscription = subscriptionMapper.toEntity(current, target);

        subscriptionRepository.save(subscription);

        // Notification pour l'utilisateur suivi
        String message = current.getFirstName() + " a commencé à vous suivre";
        String link = "/users/" + current.getId();

        notificationService.createNotification(
                target,
                NotificationType.NEW_FOLLOW,
                message,
                link
        );
    }

    @Override
    public void unfollowUser(Long userIdToUnfollow) {
        User current = getCurrentUser();
        User target = getTargetUser(userIdToUnfollow);

        subscriptionRepository.findByFollowerAndFollowing(current, target)
                .ifPresent(subscriptionRepository::delete);
    }

    @Override
    public List<UserSummaryResponse> getFollowers(Long userId) {
        User target = getTargetUser(userId);
        return subscriptionRepository.findByFollowing(target)
                .stream()
                .map(Subscription::getFollower)
                .map(this::toUserSummary)
                .toList();
    }

    @Override
    public List<UserSummaryResponse> getFollowing(Long userId) {
        User target = getTargetUser(userId);
        return subscriptionRepository.findByFollower(target)
                .stream()
                .map(Subscription::getFollowing)
                .map(this::toUserSummary)
                .toList();
    }
}