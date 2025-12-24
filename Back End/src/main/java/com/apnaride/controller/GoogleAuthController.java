package com.apnaride.controller;

import com.apnaride.dto.AuthResponse;
import com.apnaride.model.User;
import com.apnaride.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class GoogleAuthController {

    @Autowired
    private UserRepository userRepository;

    // Minimal stub: accepts email, name and idToken (ignored here). In production verify with Google.
    @PostMapping("/google-signin")
    public ResponseEntity<?> googleSignin(@RequestBody Map<String, String> payload) {
        String email = payload.getOrDefault("email", "");
        String name = payload.getOrDefault("name", "");
        String role = payload.getOrDefault("role", "customer");
        if (email == null || email.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Email is required");
        }
        Optional<User> existing = userRepository.findByEmail(email);
        User user = existing.orElseGet(() -> {
            User u = new User();
            u.setEmail(email);
            u.setName(name != null && !name.isBlank() ? name : email.split("@")[0]);
            u.setRole(role);
            u.setPassword("");
            return userRepository.save(u);
        });
        return ResponseEntity.ok(new AuthResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.getPhone(),
                user.getEmergencyPhone()
        ));
    }
}
