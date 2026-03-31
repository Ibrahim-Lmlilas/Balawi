package ma.ecovestiaire.backend.websocket;

import ma.ecovestiaire.backend.entity.User;
import ma.ecovestiaire.backend.repository.UserRepository;
import ma.ecovestiaire.backend.security.JwtService; // adapte si ton service JWT a un autre nom
import org.springframework.http.HttpHeaders;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.security.Principal;
import java.util.Map;
import java.util.Optional;

@Component
public class JwtHandshakeInterceptor implements HandshakeInterceptor {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    public JwtHandshakeInterceptor(JwtService jwtService,
                                   UserRepository userRepository) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    @Override
    public boolean beforeHandshake(ServerHttpRequest request,
                                   ServerHttpResponse response,
                                   WebSocketHandler wsHandler,
                                   Map<String, Object> attributes) {
        String token = null;

        // 1. Essayer de lire depuis l'en-tête (pour les requêtes REST ou clients hors navigateur)
        HttpHeaders headers = request.getHeaders();
        String authHeader = headers.getFirst(HttpHeaders.AUTHORIZATION);
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
        }

        // 2. Si absent, essayer de lire depuis l'URL (?token=...) pour les WebSockets du navigateur
        if (token == null) {
            String query = request.getURI().getQuery();
            if (query != null && query.contains("token=")) {
                String[] params = query.split("&");
                for (String param : params) {
                    if (param.startsWith("token=")) {
                        token = param.substring(6);
                        break;
                    }
                }
            }
        }

        // 3. Validation du token
        if (token != null) {
            try {
                String email = jwtService.extractUsername(token);

                if (email != null && jwtService.isTokenValid(token, email)) {
                    Optional<User> userOpt = userRepository.findByEmail(email);
                    if (userOpt.isPresent()) {
                        // Principal basé sur l'email utilisateur
                        Principal principal = () -> email;
                        attributes.put("principal", principal);
                        return true;
                    }
                }
            } catch (Exception e) {
                return false;
            }
        }

        return false;
    }

    @Override
    public void afterHandshake(ServerHttpRequest request,
                               ServerHttpResponse response,
                               WebSocketHandler wsHandler,
                               Exception exception) {
        
    }
}