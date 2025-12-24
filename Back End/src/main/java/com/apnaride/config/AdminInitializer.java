package com.apnaride.config;

import com.apnaride.model.User;
import com.apnaride.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class AdminInitializer implements CommandLineRunner {

    public static final String ADMIN_EMAIL = "admin@apnaride.com";
    public static final String ADMIN_PASSWORD = "Shaiksameer/3909";

    @Autowired
    private UserRepository userRepository;

    @Override
    public void run(String... args) {
        Optional<User> existing = userRepository.findByEmail(ADMIN_EMAIL);

        User admin;
        if (existing.isPresent()) {
            admin = existing.get();
        } else {
            admin = new User();
            admin.setName("Admin");
            admin.setEmail(ADMIN_EMAIL);
        }

        admin.setRole("admin");
        admin.setPassword(ADMIN_PASSWORD);

        userRepository.save(admin);
    }
}
