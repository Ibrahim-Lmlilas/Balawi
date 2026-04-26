package ma.ecovestiaire.backend.service.impl;

import ma.ecovestiaire.backend.dto.AdminUserResponse;
import ma.ecovestiaire.backend.dto.UpdateUserStatusRequest;
import ma.ecovestiaire.backend.entity.User;
import ma.ecovestiaire.backend.enums.UserStatus;
import ma.ecovestiaire.backend.mapper.UserMapper;
import ma.ecovestiaire.backend.repository.UserRepository;
import ma.ecovestiaire.backend.service.AdminUserService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AdminUserServiceImpl implements AdminUserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;

    public AdminUserServiceImpl(UserRepository userRepository, UserMapper userMapper) {
        this.userRepository = userRepository;
        this.userMapper = userMapper;
    }

    @Override
    public Page<AdminUserResponse> getUsers(String search, String status, int page, int size) {
        String searchTerm = (search == null) ? "" : search;
        PageRequest pageable = PageRequest.of(page, size);

        Page<User> usersPage;
        if (status != null && !status.isBlank()) {
            UserStatus userStatus;
            try {
                userStatus = UserStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Status invalide. Valeurs possibles : ACTIVE, SUSPENDED"
                );
            }
            usersPage = userRepository.findByDeletedFalseAndEmailContainingIgnoreCaseAndStatus(
                    searchTerm, userStatus, pageable
            );
        } else {
            usersPage = userRepository.findByDeletedFalseAndEmailContainingIgnoreCase(
                    searchTerm, pageable
            );
        }

        return usersPage.map(userMapper::toAdminUserResponse);
    }

    @Override
    public void updateUserStatus(Long userId, UpdateUserStatusRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Utilisateur introuvable"
                ));

        userMapper.updateStatus(request, user);
        userRepository.save(user);
    }

    @Override
    public void softDeleteUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Utilisateur introuvable"
                ));

        userMapper.softDelete(user);
        userRepository.save(user);
    }
}
