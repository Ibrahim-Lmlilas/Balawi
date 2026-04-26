package ma.ecovestiaire.backend.config;

import lombok.RequiredArgsConstructor;
import ma.ecovestiaire.backend.entity.User;
import ma.ecovestiaire.backend.enums.Role;
import ma.ecovestiaire.backend.enums.UserStatus;
import ma.ecovestiaire.backend.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        String adminEmail = "admin@admin.com";
        if (!userRepository.existsByEmail(adminEmail)) {
            User admin = User.builder()
                    .firstName("Admin")
                    .lastName("SuperAdmin")
                    .email(adminEmail)
                    .password(passwordEncoder.encode("BABAmama-123"))
                    .role(Role.ADMIN)
                    .status(UserStatus.ACTIVE)
                    .deleted(false)
                    .build();
            userRepository.save(admin);
            System.out.println(">>> Default Admin user created successfully: " + adminEmail);
        } else {
            System.out.println(">>> Default Admin user already exists: " + adminEmail);
        }
    }
}
