package com.canteen.controller;

import com.canteen.config.JwtService;
import com.canteen.dto.AuthRequest;
import com.canteen.exception.OrderException;
import com.canteen.model.User;
import com.canteen.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthController(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @PostMapping("/register")
    public Map<String, Object> register(@Valid @RequestBody AuthRequest request) {
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new OrderException("Username already taken.", HttpStatus.CONFLICT);
        }

        User user = new User(
                request.getUsername(),
                passwordEncoder.encode(request.getPassword()),
                request.getUsername(),
                "USER" // All registered users are USER by default
        );
        User savedUser = userRepository.save(user);

        String token = jwtService.generateToken(savedUser.getUsername());
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("token", token);
        response.put("userId", savedUser.getId());
        response.put("username", savedUser.getUsername());
        response.put("displayName", savedUser.getDisplayName());
        response.put("role", savedUser.getRole());
        return response;
    }

    @PostMapping("/login")
    public Map<String, Object> login(@Valid @RequestBody AuthRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new OrderException("Invalid username or password.", HttpStatus.UNAUTHORIZED));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new OrderException("Invalid username or password.", HttpStatus.UNAUTHORIZED);
        }

        String token = jwtService.generateToken(user.getUsername());
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("token", token);
        response.put("userId", user.getId());
        response.put("username", user.getUsername());
        response.put("displayName", user.getDisplayName());
        response.put("role", user.getRole());
        return response;
    }

    @PostMapping("/admin-login")
    public Map<String, Object> adminLogin(@Valid @RequestBody AuthRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new OrderException("Invalid admin credentials.", HttpStatus.UNAUTHORIZED));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new OrderException("Invalid admin credentials.", HttpStatus.UNAUTHORIZED);
        }

        if (!"ADMIN".equalsIgnoreCase(user.getRole())) {
            throw new OrderException("Access denied. Admin privileges required.", HttpStatus.FORBIDDEN);
        }

        String token = jwtService.generateToken(user.getUsername());
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("token", token);
        response.put("userId", user.getId());
        response.put("username", user.getUsername());
        response.put("displayName", user.getDisplayName());
        response.put("role", user.getRole());
        return response;
    }

    @GetMapping("/me")
    public Map<String, Object> getCurrentUser(@AuthenticationPrincipal User user) {
        if (user == null) {
            throw new OrderException("Not authenticated.", HttpStatus.UNAUTHORIZED);
        }
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("userId", user.getId());
        response.put("username", user.getUsername());
        response.put("displayName", user.getDisplayName());
        response.put("role", user.getRole());
        return response;
    }
}
