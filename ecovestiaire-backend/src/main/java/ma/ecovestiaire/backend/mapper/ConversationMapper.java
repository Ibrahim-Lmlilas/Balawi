package ma.ecovestiaire.backend.mapper;

import ma.ecovestiaire.backend.dto.ConversationDetailResponse;
import ma.ecovestiaire.backend.dto.ConversationSummaryResponse;
import ma.ecovestiaire.backend.entity.Conversation;
import ma.ecovestiaire.backend.entity.Item;
import ma.ecovestiaire.backend.entity.Message;
import ma.ecovestiaire.backend.entity.User;
import org.springframework.stereotype.Component;

@Component
public class ConversationMapper {

    public Conversation toEntity(User user1, User user2, Item item) {
        return Conversation.builder()
                .user1(user1)
                .user2(user2)
                .item(item)
                .build();
    }

    public ConversationSummaryResponse toSummaryDto(Conversation conversation, User current, Message lastMessage, long unreadCount) {
        if (conversation == null) {
            return null;
        }
        ConversationSummaryResponse dto = new ConversationSummaryResponse();
        dto.setId(conversation.getId());

        // déterminer l'autre utilisateur
        User other = conversation.getUser1().getId().equals(current.getId())
                ? conversation.getUser2()
                : conversation.getUser1();

        dto.setOtherUserId(other.getId());
        dto.setOtherUserFirstName(other.getFirstName());
        dto.setOtherUserLastName(other.getLastName());
        dto.setOtherUserProfilePhotoUrl(other.getProfilePhotoUrl());

        if (conversation.getItem() != null) {
            dto.setItemId(conversation.getItem().getId());
            dto.setItemTitle(conversation.getItem().getTitle());
        }

        if (lastMessage != null) {
            dto.setLastMessageContent(lastMessage.getContent());
            dto.setLastMessageAt(lastMessage.getCreatedAt());
            dto.setLastMessageFromMe(lastMessage.getSender().getId().equals(current.getId()));
        }

        dto.setUnreadCount(unreadCount);

        return dto;
    }

    public ConversationDetailResponse toDetailDto(Conversation conversation) {
        if (conversation == null) {
            return null;
        }
        ConversationDetailResponse dto = new ConversationDetailResponse();
        dto.setId(conversation.getId());

        User u1 = conversation.getUser1();
        User u2 = conversation.getUser2();

        if (u1 != null) {
            dto.setUser1Id(u1.getId());
            dto.setUser1FirstName(u1.getFirstName());
            dto.setUser1LastName(u1.getLastName());
        }

        if (u2 != null) {
            dto.setUser2Id(u2.getId());
            dto.setUser2FirstName(u2.getFirstName());
            dto.setUser2LastName(u2.getLastName());
        }

        if (conversation.getItem() != null) {
            dto.setItemId(conversation.getItem().getId());
            dto.setItemTitle(conversation.getItem().getTitle());
        }

        return dto;
    }
}
