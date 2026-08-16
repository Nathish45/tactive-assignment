package com.canteen.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;

@Entity
@Table(name = "app_user")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(unique = true, nullable = false)
    private String username;

    @NotBlank
    @Column(nullable = false)
    private String passwordHash;

    @NotBlank
    private String displayName;

    @Column(nullable = false)
    private String role = "USER"; // "USER" or "ADMIN"

    protected User() {
        // JPA
    }

    public User(String username, String passwordHash, String displayName) {
        this(username, passwordHash, displayName, "USER");
    }

    public User(String username, String passwordHash, String displayName, String role) {
        this.username = username;
        this.passwordHash = passwordHash;
        this.displayName = displayName;
        this.role = role != null ? role.toUpperCase() : "USER";
    }

    public Long getId() {
        return id;
    }

    public String getUsername() {
        return username;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getRole() {
        return role != null ? role : "USER";
    }

    public void setRole(String role) {
        this.role = role != null ? role.toUpperCase() : "USER";
    }
}
