package com.canteen.controller;

import com.canteen.dto.OrderResponse;
import com.canteen.dto.PlaceOrderRequest;
import com.canteen.model.Order;
import com.canteen.model.User;
import com.canteen.repository.OrderRepository;
import com.canteen.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/orders")
public class OrderController {

    private final OrderService orderService;
    private final OrderRepository orderRepository;

    public OrderController(OrderService orderService, OrderRepository orderRepository) {
        this.orderService = orderService;
        this.orderRepository = orderRepository;
    }

    /**
     * The authenticated User is injected by Spring Security from the JWT
     * (see JwtAuthFilter) — user identity always comes from the verified
     * token, never from anything in the request body.
     */
    @PostMapping
    public OrderResponse placeOrder(@AuthenticationPrincipal User user,
                                     @Valid @RequestBody PlaceOrderRequest request) {
        Order order = orderService.placeOrder(user, request.getMenuItemId(), request.getQuantity());
        return new OrderResponse(order);
    }

    @DeleteMapping("/{id}")
    public OrderResponse cancelOrder(@AuthenticationPrincipal User user, @PathVariable Long id) {
        Order order = orderService.cancelOrder(user, id);
        return new OrderResponse(order);
    }

    @GetMapping("/mine")
    public List<OrderResponse> myOrders(@AuthenticationPrincipal User user) {
        return orderRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(OrderResponse::new)
                .toList();
    }
}
