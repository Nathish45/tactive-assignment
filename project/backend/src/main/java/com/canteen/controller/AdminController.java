package com.canteen.controller;

import com.canteen.dto.AdminMenuItemRequest;
import com.canteen.dto.AdminOrderResponse;
import com.canteen.dto.MenuItemResponse;
import com.canteen.dto.RatingResponse;
import com.canteen.exception.OrderException;
import com.canteen.model.MenuItem;
import com.canteen.model.Order;
import com.canteen.model.OrderStatus;
import com.canteen.repository.MenuItemRepository;
import com.canteen.repository.OrderRepository;
import com.canteen.repository.RatingRepository;
import com.canteen.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin")
public class AdminController {

    private final OrderRepository orderRepository;
    private final MenuItemRepository menuItemRepository;
    private final RatingRepository ratingRepository;
    private final UserRepository userRepository;

    public AdminController(OrderRepository orderRepository,
                           MenuItemRepository menuItemRepository,
                           RatingRepository ratingRepository,
                           UserRepository userRepository) {
        this.orderRepository = orderRepository;
        this.menuItemRepository = menuItemRepository;
        this.ratingRepository = ratingRepository;
        this.userRepository = userRepository;
    }

    /**
     * Dashboard analytics & summary metrics
     */
    @GetMapping("/stats")
    public Map<String, Object> getAdminStats() {
        List<Order> allOrders = orderRepository.findAll();
        List<MenuItem> allItems = menuItemRepository.findAll();

        BigDecimal totalRevenue = allOrders.stream()
                .filter(o -> o.getStatus() != OrderStatus.CANCELLED)
                .map(Order::getTotalPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long totalOrders = allOrders.size();
        long pendingOrders = allOrders.stream()
                .filter(o -> o.getStatus() == OrderStatus.PLACED || o.getStatus() == OrderStatus.PREPARING)
                .count();
        long completedOrders = allOrders.stream()
                .filter(o -> o.getStatus() == OrderStatus.COMPLETED)
                .count();
        long cancelledOrders = allOrders.stream()
                .filter(o -> o.getStatus() == OrderStatus.CANCELLED)
                .count();

        long lowStockCount = allItems.stream()
                .filter(i -> i.getStockCount() <= 3)
                .count();

        long totalUsers = userRepository.count();
        long totalReviews = ratingRepository.count();

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalRevenue", totalRevenue);
        stats.put("totalOrders", totalOrders);
        stats.put("pendingOrders", pendingOrders);
        stats.put("completedOrders", completedOrders);
        stats.put("cancelledOrders", cancelledOrders);
        stats.put("totalMenuItems", (long) allItems.size());
        stats.put("lowStockCount", lowStockCount);
        stats.put("totalUsers", totalUsers);
        stats.put("totalReviews", totalReviews);
        return stats;
    }

    /**
     * View all orders across all customers
     */
    @GetMapping("/orders")
    public List<AdminOrderResponse> getAllOrders() {
        return orderRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream()
                .map(AdminOrderResponse::new)
                .toList();
    }

    /**
     * Update order status (e.g. PLACED -> PREPARING -> COMPLETED or CANCELLED)
     */
    @PatchMapping("/orders/{id}/status")
    @Transactional
    public AdminOrderResponse updateOrderStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> OrderException.notFound("Order"));

        String statusStr = body.get("status");
        if (statusStr == null) {
            throw new OrderException("Status is required.", HttpStatus.BAD_REQUEST);
        }

        OrderStatus newStatus;
        try {
            newStatus = OrderStatus.valueOf(statusStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new OrderException("Invalid status: " + statusStr, HttpStatus.BAD_REQUEST);
        }

        // If transitioning to CANCELLED and was not previously cancelled, restore stock
        if (newStatus == OrderStatus.CANCELLED && order.getStatus() != OrderStatus.CANCELLED) {
            MenuItem item = order.getMenuItem();
            item.setStockCount(item.getStockCount() + order.getQuantity());
            menuItemRepository.save(item);
        }

        order.setStatus(newStatus);
        Order saved = orderRepository.save(order);
        return new AdminOrderResponse(saved);
    }

    /**
     * Add a new menu item
     */
    @PostMapping("/menu")
    public MenuItemResponse addMenuItem(@Valid @RequestBody AdminMenuItemRequest request) {
        MenuItem item = new MenuItem(
                request.getName(),
                request.getPrice(),
                request.getStockCount(),
                request.getDailyLimitPerPerson(),
                request.getCategory(),
                request.getDescription()
        );
        MenuItem saved = menuItemRepository.save(item);
        return new MenuItemResponse(saved, 0.0, 0L);
    }

    /**
     * Edit existing menu item
     */
    @PutMapping("/menu/{id}")
    @Transactional
    public MenuItemResponse updateMenuItem(@PathVariable Long id, @Valid @RequestBody AdminMenuItemRequest request) {
        MenuItem item = menuItemRepository.findById(id)
                .orElseThrow(() -> OrderException.notFound("Menu item"));

        item.setName(request.getName());
        item.setPrice(request.getPrice());
        item.setStockCount(request.getStockCount());
        item.setDailyLimitPerPerson(request.getDailyLimitPerPerson());
        item.setCategory(request.getCategory());
        item.setDescription(request.getDescription());

        MenuItem saved = menuItemRepository.save(item);
        Double avg = ratingRepository.getAverageRatingByMenuItemId(saved.getId());
        Long count = ratingRepository.countByMenuItemId(saved.getId());
        return new MenuItemResponse(saved, avg, count != null ? count : 0L);
    }

    /**
     * Quick stock replenish
     */
    @PatchMapping("/menu/{id}/stock")
    @Transactional
    public MenuItemResponse updateStock(@PathVariable Long id, @RequestBody Map<String, Integer> body) {
        MenuItem item = menuItemRepository.findById(id)
                .orElseThrow(() -> OrderException.notFound("Menu item"));

        Integer newStock = body.get("stockCount");
        if (newStock == null || newStock < 0) {
            throw new OrderException("Valid non-negative stockCount is required.", HttpStatus.BAD_REQUEST);
        }

        item.setStockCount(newStock);
        MenuItem saved = menuItemRepository.save(item);
        Double avg = ratingRepository.getAverageRatingByMenuItemId(saved.getId());
        Long count = ratingRepository.countByMenuItemId(saved.getId());
        return new MenuItemResponse(saved, avg, count != null ? count : 0L);
    }

    /**
     * Delete menu item
     */
    @DeleteMapping("/menu/{id}")
    public Map<String, String> deleteMenuItem(@PathVariable Long id) {
        if (!menuItemRepository.existsById(id)) {
            throw OrderException.notFound("Menu item");
        }
        menuItemRepository.deleteById(id);
        return Map.of("message", "Menu item deleted successfully.");
    }

    /**
     * View all reviews & ratings
     */
    @GetMapping("/ratings")
    public List<RatingResponse> getAllRatings() {
        return ratingRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream()
                .map(RatingResponse::new)
                .toList();
    }

    /**
     * Delete a review
     */
    @DeleteMapping("/ratings/{id}")
    public Map<String, String> deleteRating(@PathVariable Long id) {
        if (!ratingRepository.existsById(id)) {
            throw OrderException.notFound("Rating");
        }
        ratingRepository.deleteById(id);
        return Map.of("message", "Rating deleted successfully.");
    }
}
