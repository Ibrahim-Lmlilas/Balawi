package ma.ecovestiaire.backend.service;

import ma.ecovestiaire.backend.dto.UpdateUserProfileRequest;
import ma.ecovestiaire.backend.dto.UserProfileResponse;
import ma.ecovestiaire.backend.dto.UserSummaryResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

public interface UserService {

    UserProfileResponse getCurrentUserProfile();

    UserProfileResponse updateCurrentUserProfile(UpdateUserProfileRequest request);

    UserProfileResponse getPublicUserProfile(Long userId);

    Page<UserSummaryResponse> searchUsers(String query, Pageable pageable);

    UserProfileResponse uploadProfilePhoto(MultipartFile file);
}