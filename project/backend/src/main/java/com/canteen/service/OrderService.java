package com.canteen.service;

import com.canteen.exception.OrderException;
import com.canteen.model.MenuItem;
import com.canteen.model.Order;
import com.canteen.model.OrderStatus;
import com.canteen.model.User;
import com.canteen.repository.MenuItemRepository;
import com.canteen.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final MenuItemRepository menuItemRepository;

    /**
     * Injected rather than using Clock.systemDefaultZone() directly. This is
     * the single decision that makes cutoff-time behaviour testable: tests
     * supply a Clock.fixed(...) so "order placed at 10:29:59" and "order
     * placed at 10:30:01" are deterministic, repeatable test cases instead
     * of depending on when the test happens to run.
     */
    private final Clock clock;

    private final LocalTime cutoffTime;
    private final int cancellationGraceMinutes;

    public OrderService(OrderRepository orderRepository,
                         MenuItemRepository menuItemRepository,
                         Clock clock,
                         @Value("${canteen.order-cutoff-time}") String cutoffTimeStr,
                         @Value("${canteen.cancellation-grace-minutes}") int cancellationGraceMinutes) {
        this.orderRepository = orderRepository;
        this.menuItemRepository = menuItemRepository;
        this.clock = clock;
        this.cutoffTime = LocalTime.parse(cutoffTimeStr);
        this.cancellationGraceMinutes = cancellationGraceMinutes;
    }

    /**
     * Places an order after validating, in order: cutoff time, stock
     * availability, and the per-person daily limit. Stock decrement happens
     * via JPA's optimistic locking (@Version on MenuItem) so that two
     * concurrent requests racing for the last unit cannot both succeed --
     * the loser gets an ObjectOptimisticLockingFailureException, translated
     * by GlobalExceptionHandler into a 409 the client can retry on.
     */
    @Transactional
    public Order placeOrder(User user, Long menuItemId, int quantity) {
        if (quantity < 1) {
            throw new OrderException("Quantity must be at least 1.", org.springframework.http.HttpStatus.BAD_REQUEST);
        }

        Instant now = clock.instant();
        LocalTime currentTime = now.atZone(clock.getZone()).toLocalTime();
        if (currentTime.isAfter(cutoffTime)) {
            throw OrderException.cutoffPassed();
        }

        MenuItem item = menuItemRepository.findById(menuItemId)
                .orElseThrow(() -> OrderException.notFound("Menu item"));

        if (item.getStockCount() < quantity) {
            throw OrderException.outOfStock(item.getName());
        }

        int alreadyOrderedToday = orderRepository.sumQuantityOrderedToday(
                user.getId(), menuItemId, startOfDay(now), startOfNextDay(now));

        if (alreadyOrderedToday + quantity > item.getDailyLimitPerPerson()) {
            throw OrderException.dailyLimitExceeded(item.getDailyLimitPerPerson());
        }

        // Decrementing via the entity + save (rather than raw SQL) means
        // Hibernate includes the @Version column in the UPDATE ... WHERE
        // clause, which is what actually enforces the optimistic lock.
        item.setStockCount(item.getStockCount() - quantity);
        menuItemRepository.save(item);

        BigDecimal totalPrice = item.getPrice().multiply(BigDecimal.valueOf(quantity));
        Order order = new Order(user, item, quantity, totalPrice, now);
        return orderRepository.save(order);
    }

    /**
     * Cancels an order if: the requester owns it, it hasn't already been
     * cancelled, and it's still within the cancellation grace window.
     * Cancelling restores the stock it consumed.
     */
    @Transactional
    public Order cancelOrder(User user, Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> OrderException.notFound("Order"));

        if (!order.getUser().getId().equals(user.getId())) {
            throw OrderException.notOwner();
        }

        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw OrderException.alreadyCancelled();
        }

        Instant now = clock.instant();
        Instant graceDeadline = order.getCreatedAt().plusSeconds(cancellationGraceMinutes * 60L);
        if (now.isAfter(graceDeadline)) {
            throw OrderException.cancellationWindowExpired();
        }

        order.setStatus(OrderStatus.CANCELLED);

        MenuItem item = order.getMenuItem();
        item.setStockCount(item.getStockCount() + order.getQuantity());
        menuItemRepository.save(item);

        return orderRepository.save(order);
    }

    private Instant startOfDay(Instant instant) {
        ZoneId zone = clock.getZone();
        return LocalDate.ofInstant(instant, zone).atStartOfDay(zone).toInstant();
    }

    private Instant startOfNextDay(Instant instant) {
        return startOfDay(instant).plusSeconds(24 * 60 * 60);
    }
}
