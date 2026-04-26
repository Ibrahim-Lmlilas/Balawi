package ma.ecovestiaire.backend.repository;

import ma.ecovestiaire.backend.entity.User;
import ma.ecovestiaire.backend.enums.UserStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    Page<User> findByDeletedFalseAndEmailContainingIgnoreCaseAndStatus(
            String email, UserStatus status, Pageable pageable
    );

    Page<User> findByDeletedFalseAndEmailContainingIgnoreCase(
            String email, Pageable pageable
    );

    Page<User> findByDeletedFalseAndFirstNameContainingIgnoreCaseOrDeletedFalseAndLastNameContainingIgnoreCase(
            String firstName, String lastName, Pageable pageable
    );

    long countByDeletedFalse();

    long countByDeletedFalseAndStatus(UserStatus status);

    @Query(value = "SELECT CAST(DATE(created_at) AS VARCHAR) as date, COUNT(id) FROM users WHERE created_at >= CURRENT_DATE - INTERVAL '6 days' GROUP BY DATE(created_at) ORDER BY date ASC", nativeQuery = true)
    List<Object[]> countNewUsersPerDay();
}