package ma.ecovestiaire.backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import ma.ecovestiaire.backend.entity.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Date;
import java.util.function.Function;

@Service
public class JwtService {

    @Value("${JWT_SECRET}")
    private String secretKey;

    @Value("${JWT_EXPIRATION}")
    private long expirationMs;

    public String generateToken(User user) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expirationMs);

        return Jwts.builder()
                .setSubject(user.getEmail())
                .claim("role", user.getRole().name())
                .claim("userId", user.getId())
                .claim("firstName", user.getFirstName())
                .claim("lastName", user.getLastName())
                .claim("profilePhotoUrl", user.getProfilePhotoUrl())
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject); // email
    }

    public boolean isTokenValid(String token, String userEmail) {
    try {
        final String username = extractUsername(token);
        return username.equals(userEmail) && !isTokenExpired(token);
    } catch (JwtException | IllegalArgumentException ex) {
        return false;  // Token invalide ou expiré
    }
}

    private boolean isTokenExpired(String token) {
        Date expiration = extractClaim(token, Claims::getExpiration);
        return expiration.before(new Date());
    }

    private <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
    final Claims claims = Jwts.parserBuilder()
            .setSigningKey(getSigningKey())     // Clé pour vérifier la signature
            .build()
            .parseClaimsJws(token)              // Parse et vérifie la signature
            .getBody();                         // Récupère le payload
    return claimsResolver.apply(claims);
}

    private Key getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}