package com.apnaride.controller;
import com.apnaride.model.User;
import com.apnaride.repository.UserRepository;
import com.apnaride.dto.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private static final String ADMIN_EMAIL = "admin@apnaride.com";
    private static final String ADMIN_ROLE = "admin";

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/signup")
    public ResponseEntity<?> signUp(@RequestBody AuthRequest signUpRequest) {
        if (ADMIN_ROLE.equalsIgnoreCase(signUpRequest.getRole()) || ADMIN_EMAIL.equalsIgnoreCase(signUpRequest.getEmail())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Admin account cannot be created via signup.");
        }
        if (userRepository.findByEmail(signUpRequest.getEmail()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Email is already registered.");
        }

        User user = new User();
        user.setName(signUpRequest.getName());
        user.setEmail(signUpRequest.getEmail());
        user.setPassword(signUpRequest.getPassword());
        user.setRole(signUpRequest.getRole());
        
        User savedUser = userRepository.save(user);

        return ResponseEntity.ok(new AuthResponse(
            savedUser.getId(),
            savedUser.getName(),
            savedUser.getEmail(),
            savedUser.getRole(),
            savedUser.getPhone(),
            savedUser.getEmergencyPhone()
        ));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody AuthRequest registerRequest) {
        if (ADMIN_ROLE.equalsIgnoreCase(registerRequest.getRole()) || ADMIN_EMAIL.equalsIgnoreCase(registerRequest.getEmail())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Admin account cannot be created via register.");
        }
        if (userRepository.findByEmail(registerRequest.getEmail()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Email is already registered.");
        }

        User user = new User();
        user.setName(registerRequest.getName());
        user.setEmail(registerRequest.getEmail());
        user.setPassword(registerRequest.getPassword());
        user.setRole(registerRequest.getRole());
        
        User savedUser = userRepository.save(user);

        return ResponseEntity.ok(new AuthResponse(
            savedUser.getId(),
            savedUser.getName(),
            savedUser.getEmail(),
            savedUser.getRole(),
            savedUser.getPhone(),
            savedUser.getEmergencyPhone()
        ));
    }

    @PostMapping("/signin")
    public ResponseEntity<?> signIn(@RequestBody AuthRequest signInRequest) {
        Optional<User> userOptional = userRepository.findByEmail(signInRequest.getEmail());

        if (userOptional.isEmpty() || !userOptional.get().getPassword().equals(signInRequest.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid email or password.");
        }
        
        User user = userOptional.get();
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