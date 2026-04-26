package ma.ecovestiaire.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class EcoVestiaireApplication {

	public static void main(String[] args) {
		SpringApplication.run(EcoVestiaireApplication.class, args);
	}

}
