package ma.ecovestiaire.backend.websocket;

import ma.ecovestiaire.backend.security.JwtService;
import ma.ecovestiaire.backend.repository.UserRepository;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;

import java.security.Principal;

/**
 * Intercepteur STOMP : extrait le JWT depuis les headers CONNECT ou le token
 * placé dans les attributes de la session (par JwtHandshakeInterceptor),
 * puis enregistre le Principal pour que convertAndSendToUser() fonctionne.
 */
@Component
public class WebSocketChannelInterceptor implements ChannelInterceptor {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    public WebSocketChannelInterceptor(JwtService jwtService,
                                       UserRepository userRepository) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor =
                MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor == null) return message;

        // Cas 1 : frame STOMP CONNECT → lire le token depuis les headers STOMP
        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            String authHeader = accessor.getFirstNativeHeader("Authorization");
            String token = null;

            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                token = authHeader.substring(7);
            }

            // Cas 2 : token déjà placé par JwtHandshakeInterceptor dans les attributes
            if (token == null) {
                Object principalFromAttr = accessor.getSessionAttributes() != null
                        ? accessor.getSessionAttributes().get("principal")
                        : null;
                if (principalFromAttr instanceof Principal p) {
                    accessor.setUser(p);
                    return message;
                }
            }

            if (token != null) {
                try {
                    String email = jwtService.extractUsername(token);
                    if (email != null && jwtService.isTokenValid(token, email)
                            && userRepository.findByEmail(email).isPresent()) {
                        Principal principal = () -> email;
                        accessor.setUser(principal);
                    }
                } catch (Exception ignored) {
                }
            }
        }

        // Pour les frames non-CONNECT : récupérer le principal depuis les attributes de session
        if (accessor.getUser() == null && accessor.getSessionAttributes() != null) {
            Object principalFromAttr = accessor.getSessionAttributes().get("principal");
            if (principalFromAttr instanceof Principal p) {
                accessor.setUser(p);
            }
        }

        return message;
    }
}
