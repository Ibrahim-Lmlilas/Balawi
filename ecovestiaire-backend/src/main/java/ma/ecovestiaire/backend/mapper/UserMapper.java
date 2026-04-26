package ma.ecovestiaire.backend.mapper;

import ma.ecovestiaire.backend.dto.*;
import ma.ecovestiaire.backend.entity.User;
import ma.ecovestiaire.backend.enums.Role;
import ma.ecovestiaire.backend.enums.UserStatus;
import org.springframework.stereotype.Component;

import java.util.Collections;

@Component
public class UserMapper {

    public User toEntity(RegisterRequest request, String encodedPassword, String profilePhotoUrl) {
        if (request == null) {
            return null;
        }
        return User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .password(encodedPassword)
                .profilePhotoUrl(profilePhotoUrl)
                .role(Role.USER)
                .status(UserStatus.ACTIVE)
                .deleted(false)
                .build();
    }

    public void updateFromDto(UpdateUserProfileRequest request, User user) {
        if (request == null || user == null) {
            return;
        }
        if (request.getFirstName() != null) {
            user.setFirstName(request.getFirstName());
        }
        if (request.getLastName() != null) {
            user.setLastName(request.getLastName());
        }
        if (request.getBio() != null) {
            user.setBio(request.getBio());
        }
        if (request.getLocation() != null) {
            user.setLocation(request.getLocation());
        }
        if (request.getProfilePhotoUrl() != null) {
            user.setProfilePhotoUrl(request.getProfilePhotoUrl());
        }
    }

    public UserProfileResponse toUserProfileResponse(User user, boolean includeEmail) {
        if (user == null) return null;
        UserProfileResponse dto = new UserProfileResponse();
        dto.setId(user.getId());
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        if (includeEmail) {
            dto.setEmail(user.getEmail());
        }
        dto.setBio(user.getBio());
        dto.setLocation(user.getLocation());
        dto.setProfilePhotoUrl(user.getProfilePhotoUrl());
        dto.setRole(user.getRole().name());
        return dto;
    }

    public UserSummaryResponse toUserSummaryResponse(User user) {
        if (user == null) return null;
        UserSummaryResponse dto = new UserSummaryResponse();
        dto.setId(user.getId());
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        dto.setProfilePhotoUrl(user.getProfilePhotoUrl());
        return dto;
    }

    public void updateStatus(UpdateUserStatusRequest request, User user) {
        if (request == null || user == null) {
            return;
        }
        if (request.getStatus() != null) {
            user.setStatus(request.getStatus());
        }
    }

    public void softDelete(User user) {
        if (user != null) {
            user.setDeleted(true);
        }
    }

    public AdminUserResponse toAdminUserResponse(User user) {
        if (user == null) return null;
        AdminUserResponse dto = new AdminUserResponse();
        dto.setId(user.getId());
        dto.setEmail(user.getEmail());
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        dto.setDeleted(user.isDeleted());
        dto.setStatus(user.getStatus());
        dto.setProfilePhotoUrl(user.getProfilePhotoUrl());
        dto.setCreatedAt(user.getCreatedAt());

        if (user.getRole() != null) {
            dto.setRoles(Collections.singleton(user.getRole().name()));
        } else {
            dto.setRoles(Collections.emptySet());
        }
        return dto;
    }

    public RegisterResponse toRegisterResponse(User user) {
        if (user == null) return null;
        return new RegisterResponse(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail()
        );
    }

    public LoginResponse toLoginResponse(User user, String token) {
        if (user == null) return null;
        return new LoginResponse(
                token,
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getRole().name(),
                user.getProfilePhotoUrl()
        );
    }
}
