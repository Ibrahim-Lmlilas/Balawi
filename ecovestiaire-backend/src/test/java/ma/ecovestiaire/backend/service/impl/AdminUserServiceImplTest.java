package ma.ecovestiaire.backend.service.impl;

import ma.ecovestiaire.backend.dto.UpdateUserStatusRequest;
import ma.ecovestiaire.backend.entity.User;
import ma.ecovestiaire.backend.enums.UserStatus;
import ma.ecovestiaire.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminUserServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private AdminUserServiceImpl adminUserService;

    private User user;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);
        user.setEmail("test@example.com");
        user.setStatus(UserStatus.ACTIVE);
        user.setDeleted(false);
    }

    @Test
    void updateUserStatus_Success() {
        UpdateUserStatusRequest request = new UpdateUserStatusRequest();
        request.setStatus(UserStatus.SUSPENDED);

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenReturn(user);

        adminUserService.updateUserStatus(1L, request);

        assertEquals(UserStatus.SUSPENDED, user.getStatus());
        verify(userRepository, times(1)).save(user);
    }

    @Test
    void updateUserStatus_UserNotFound() {
        UpdateUserStatusRequest request = new UpdateUserStatusRequest();
        request.setStatus(UserStatus.SUSPENDED);

        when(userRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(ResponseStatusException.class, () -> adminUserService.updateUserStatus(1L, request));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void softDeleteUser_Success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenReturn(user);

        adminUserService.softDeleteUser(1L);

        assertTrue(user.isDeleted());
        verify(userRepository, times(1)).save(user);
    }

    @Test
    void softDeleteUser_UserNotFound() {
        when(userRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(ResponseStatusException.class, () -> adminUserService.softDeleteUser(1L));
        verify(userRepository, never()).save(any(User.class));
    }
}
