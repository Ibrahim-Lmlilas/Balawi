package ma.ecovestiaire.backend.mapper;

import ma.ecovestiaire.backend.entity.Subscription;
import ma.ecovestiaire.backend.entity.User;
import org.springframework.stereotype.Component;

@Component
public class SubscriptionMapper {

    public Subscription toEntity(User follower, User followed) {
        if (follower == null || followed == null) {
            return null;
        }
        return Subscription.builder()
                .follower(follower)
                .following(followed)
                .build();
    }
}
