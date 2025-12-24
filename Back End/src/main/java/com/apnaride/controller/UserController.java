package com.apnaride.controller;

import com.apnaride.model.User;
import com.apnaride.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    private static final String ADMIN_EMAIL = "admin@apnaride.com";
    private static final String ADMIN_ROLE = "admin";

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/{id}")
    public ResponseEntity<?> getUser(@PathVariable Long id) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
        }

        User user = userOpt.get();
        Map<String, Object> body = new HashMap<>();
        body.put("id", user.getId());
        body.put("name", user.getName());
        body.put("email", user.getEmail());
        body.put("role", user.getRole());
        body.put("phone", user.getPhone());
        body.put("emergencyPhone", user.getEmergencyPhone());
        return ResponseEntity.ok(body);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
        }

        User user = userOpt.get();
        final boolean isAdminAccount = ADMIN_ROLE.equalsIgnoreCase(user.getRole()) || ADMIN_EMAIL.equalsIgnoreCase(user.getEmail());

        if (payload.containsKey("name")) {
            Object v = payload.get("name");
            user.setName(v != null ? String.valueOf(v) : null);
        }
        if (payload.containsKey("email")) {
            Object v = payload.get("email");
            String newEmail = v != null ? String.valueOf(v) : null;
            if (isAdminAccount) {
                // Admin email is fixed
                user.setEmail(ADMIN_EMAIL);
            } else {
                // Prevent anyone else from taking the reserved admin email
                if (newEmail != null && ADMIN_EMAIL.equalsIgnoreCase(newEmail)) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body("This email is reserved.");
                }
                user.setEmail(newEmail);
            }
        }
        if (payload.containsKey("phone")) {
            Object v = payload.get("phone");
            user.setPhone(v != null ? String.valueOf(v) : null);
        }
        if (payload.containsKey("emergencyPhone")) {
            Object v = payload.get("emergencyPhone");
            user.setEmergencyPhone(v != null ? String.valueOf(v) : null);
        }

        User saved = userRepository.save(user);
        Map<String, Object> body = new HashMap<>();
        body.put("id", saved.getId());
        body.put("name", saved.getName());
        body.put("email", saved.getEmail());
        body.put("role", saved.getRole());
        body.put("phone", saved.getPhone());
        body.put("emergencyPhone", saved.getEmergencyPhone());
        return ResponseEntity.ok(body);
    }
}
