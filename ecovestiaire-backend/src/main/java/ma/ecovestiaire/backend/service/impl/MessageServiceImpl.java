package ma.ecovestiaire.backend.service.impl;

import ma.ecovestiaire.backend.dto.MessageResponse;
import ma.ecovestiaire.backend.dto.SendMessageRequest;
import ma.ecovestiaire.backend.entity.Conversation;
import ma.ecovestiaire.backend.entity.Message;
import ma.ecovestiaire.backend.entity.User;
import ma.ecovestiaire.backend.enums.NotificationType;
import ma.ecovestiaire.backend.mapper.MessageMapper;
import ma.ecovestiaire.backend.repository.ConversationRepository;
import ma.ecovestiaire.backend.repository.MessageRepository;
import ma.ecovestiaire.backend.repository.UserRepository;
import ma.ecovestiaire.backend.service.MessageService;
import ma.ecovestiaire.backend.service.NotificationService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;

@Service
public class MessageServiceImpl implements MessageService {

    private final MessageRepository messageRepository;
    private final ConversationRepository conversationRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationService notificationService;
    private final MessageMapper messageMapper;

    public MessageServiceImpl(MessageRepository messageRepository,
                              ConversationRepository conversationRepository,
                              UserRepository userRepository,
                              SimpMessagingTemplate messagingTemplate,
                              NotificationService notificationService,
                              MessageMapper messageMapper) {
        this.messageRepository = messageRepository;
        this.conversationRepository = conversationRepository;
        this.userRepository = userRepository;
        this.messagingTemplate = messagingTemplate;
        this.notificationService = notificationService;
        this.messageMapper = messageMapper;
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Utilisateur introuvable"
                ));
    }

    private Conversation getConversationForCurrentUserOrThrow(Long conversationId) {
        User current = getCurrentUser();

        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Conversation introuvable"
                ));

        if (!conversation.getUser1().getId().equals(current.getId())
                && !conversation.getUser2().getId().equals(current.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Vous n'êtes pas participant de cette conversation"
            );
        }

        return conversation;
    }

    private MessageResponse toResponse(Message message) {
        return messageMapper.toDto(message);
    }

    @Override
    @Transactional
    public MessageResponse sendMessage(Long conversationId, SendMessageRequest request) {
        Conversation conversation = getConversationForCurrentUserOrThrow(conversationId);
        User current = getCurrentUser();

        try {
            Message message = messageMapper.toEntity(request.getContent(), conversation, current);
            Message saved = messageRepository.save(message);

            MessageResponse payload = toResponse(saved);

            // Déterminer l'autre participant
            User other = conversation.getUser1().getId().equals(current.getId())
                    ? conversation.getUser2()
                    : conversation.getUser1();

            // 1) Envoi temps réel au destinataire uniquement
            // (le sender reçoit déjà le message via la réponse HTTP — pas besoin de WS ici)
            messagingTemplate.convertAndSendToUser(
                    other.getEmail(),
                    "/queue/chat",
                    payload
            );

            // 2) Notification NEW_MESSAGE
            String notifMessage = "Nouveau message de " + current.getFirstName();
            String link = "/conversations/" + conversation.getId();

            notificationService.createNotification(
                    other,
                    NotificationType.NEW_MESSAGE,
                    notifMessage,
                    link
            );

            return payload;
        } catch (Exception e) {
            System.err.println("ERROR: Failed to send message: " + e.getMessage());
            e.printStackTrace();
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Erreur lors de l'enregistrement du message");
        }
    }

    @Override
    @Transactional
    public Page<MessageResponse> getMessages(Long conversationId, Pageable pageable) {
        Conversation conversation = getConversationForCurrentUserOrThrow(conversationId);
        User current = getCurrentUser();

        // Récupérer tous les messages non lus envoyés par l'autre user
        var unreadMessages = messageRepository
                .findByConversationAndSenderNotAndReadIsFalse(conversation, current);

        if (!unreadMessages.isEmpty()) {
            Instant now = Instant.now();
            unreadMessages.forEach(m -> {
                m.setRead(true);
                m.setReadAt(now);
            });
            messageRepository.saveAll(unreadMessages);
        }

        // Retourner l'historique paginé
        return messageRepository
                .findByConversationOrderByCreatedAtAsc(conversation, pageable)
                .map(this::toResponse);
    }

    @Override
    @Transactional
    public MessageResponse editMessage(Long messageId, String newContent) {
        User current = getCurrentUser();

        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Message introuvable"));

        if (!message.getSender().getId().equals(current.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Vous ne pouvez pas modifier ce message");
        }

        message.setContent(newContent);
        message.setEditedAt(Instant.now());
        Message saved = messageRepository.save(message);

        MessageResponse payload = toResponse(saved);

        // Notifier les deux participants en temps réel
        Conversation conversation = message.getConversation();
        User other = conversation.getUser1().getId().equals(current.getId())
                ? conversation.getUser2()
                : conversation.getUser1();

        messagingTemplate.convertAndSendToUser(other.getEmail(), "/queue/chat", payload);
        messagingTemplate.convertAndSendToUser(current.getEmail(), "/queue/chat", payload);

        return payload;
    }

    @Override
    @Transactional
    public void deleteMessage(Long messageId) {
        User current = getCurrentUser();

        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Message introuvable"));

        if (!message.getSender().getId().equals(current.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Vous ne pouvez pas supprimer ce message");
        }

        Conversation conversation = message.getConversation();
        User other = conversation.getUser1().getId().equals(current.getId())
                ? conversation.getUser2()
                : conversation.getUser1();

        messageRepository.delete(message);

        // Notifier via WS (content = null = signal de suppression)
        MessageResponse deletedPayload = new MessageResponse();
        deletedPayload.setId(messageId);
        deletedPayload.setConversationId(conversation.getId());
        deletedPayload.setContent(null);

        messagingTemplate.convertAndSendToUser(other.getEmail(), "/queue/chat", deletedPayload);
        messagingTemplate.convertAndSendToUser(current.getEmail(), "/queue/chat", deletedPayload);
    }
}