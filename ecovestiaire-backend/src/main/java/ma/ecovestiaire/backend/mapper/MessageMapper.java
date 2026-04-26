package ma.ecovestiaire.backend.mapper;

import ma.ecovestiaire.backend.dto.MessageResponse;
import ma.ecovestiaire.backend.entity.Conversation;
import ma.ecovestiaire.backend.entity.Message;
import ma.ecovestiaire.backend.entity.User;
import org.springframework.stereotype.Component;

@Component
public class MessageMapper {

    public Message toEntity(String content, Conversation conversation, User sender) {
        return Message.builder()
                .content(content)
                .conversation(conversation)
                .sender(sender)
                .read(false)
                .build();
    }

    public MessageResponse toDto(Message message) {
        if (message == null) {
            return null;
        }
        MessageResponse dto = new MessageResponse();
        dto.setId(message.getId());
        
        if (message.getConversation() != null) {
            dto.setConversationId(message.getConversation().getId());
        }

        User sender = message.getSender();
        if (sender != null) {
            dto.setSenderId(sender.getId());
            dto.setSenderFirstName(sender.getFirstName());
            dto.setSenderLastName(sender.getLastName());
            dto.setSenderProfilePhotoUrl(sender.getProfilePhotoUrl());
        }

        dto.setContent(message.getContent());
        dto.setCreatedAt(message.getCreatedAt());
        dto.setEditedAt(message.getEditedAt());
        dto.setRead(message.isRead());

        return dto;
    }
}
