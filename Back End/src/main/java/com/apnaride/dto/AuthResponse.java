package com.apnaride.dto;

public class AuthResponse {
    private Long id;
    private String name;
    private String email;
    private String role;
    private String phone;
    private String emergencyPhone;

    // Constructor without ID (for backward compatibility)
    public AuthResponse(String name, String email, String role) {
        this.name = name;
        this.email = email;
        this.role = role;
    }

    // Constructor with ID
    public AuthResponse(Long id, String name, String email, String role) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.role = role;
    }

    // Constructor with additional profile fields
    public AuthResponse(Long id, String name, String email, String role, String phone, String emergencyPhone) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.role = role;
        this.phone = phone;
        this.emergencyPhone = emergencyPhone;
    }

    // Getters
    public Long getId() { return id; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getRole() { return role; }
    public String getPhone() { return phone; }
    public String getEmergencyPhone() { return emergencyPhone; }

    // Setters
    public void setId(Long id) { this.id = id; }
    public void setName(String name) { this.name = name; }
    public void setEmail(String email) { this.email = email; }
    public void setRole(String role) { this.role = role; }
    public void setPhone(String phone) { this.phone = phone; }
    public void setEmergencyPhone(String emergencyPhone) { this.emergencyPhone = emergencyPhone; }
}