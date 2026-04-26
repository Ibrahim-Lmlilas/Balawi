package ma.ecovestiaire.backend.service.impl;

import ma.ecovestiaire.backend.dto.UpdateUserProfileRequest;
import ma.ecovestiaire.backend.dto.UserProfileResponse;
import ma.ecovestiaire.backend.dto.UserSummaryResponse;
import ma.ecovestiaire.backend.entity.User;
import ma.ecovestiaire.backend.mapper.UserMapper;
import ma.ecovestiaire.backend.repository.UserRepository;
import ma.ecovestiaire.backend.service.UserService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final String uploadDir = "uploads/profiles/";

    public UserServiceImpl(UserRepository userRepository, UserMapper userMapper) {
        this.userRepository = userRepository;
        this.userMapper = userMapper;
        
        try {
            Files.createDirectories(Paths.get(uploadDir));
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize storage", e);
        }
    }

    private User getCurrentUserEntity() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Utilisateur non authentifié");
        }

        String email = auth.getName();

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Utilisateur courant introuvable"
                ));
    }

    @Override
    public UserProfileResponse getCurrentUserProfile() {
        User user = getCurrentUserEntity();
        return userMapper.toUserProfileResponse(user, true); // profil courant → email inclus
    }

    @Override
    public UserProfileResponse updateCurrentUserProfile(UpdateUserProfileRequest request) {
        User user = getCurrentUserEntity();

        userMapper.updateFromDto(request, user);

        User saved = userRepository.save(user);
        return userMapper.toUserProfileResponse(saved, true);
    }

    @Override
    public UserProfileResponse getPublicUserProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Utilisateur introuvable"
                ));

        // profil public → pas d'email
        return userMapper.toUserProfileResponse(user, false);
    }

    @Override
    public Page<UserSummaryResponse> searchUsers(String query, Pageable pageable) {
        return userRepository.findByDeletedFalseAndFirstNameContainingIgnoreCaseOrDeletedFalseAndLastNameContainingIgnoreCase(
                query, query, pageable
        ).map(userMapper::toUserSummaryResponse);
    }

    @Override
    public UserProfileResponse uploadProfilePhoto(MultipartFile file) {
        User user = getCurrentUserEntity();
        
        try {
            String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
            Path path = Paths.get(uploadDir + fileName);
            Files.copy(file.getInputStream(), path);
            
            String photoUrl = "uploads/profiles/" + fileName;
            user.setProfilePhotoUrl(photoUrl);
            User saved = userRepository.save(user);
            
            return userMapper.toUserProfileResponse(saved, true);
        } catch (IOException e) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR, "Erreur lors de la sauvegarde de la photo"
            );
        }
    }
}