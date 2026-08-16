package com.canteen.repository;

import com.canteen.model.Order;
import com.canteen.model.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findByUserIdOrderByCreatedAtDesc(Long userId);

    /**
     * Sums how many units of a given menu item a user has already ordered
     * today (excluding cancelled orders), used to enforce the daily
     * per-person quantity limit. dayStart/dayEnd are passed in rather than
     * computed with SQL date functions so the boundary is driven by the
     * same injected Clock the rest of the service uses -- keeps this
     * testable without relying on the database's own notion of "today".
     */
    @Query("""
        SELECT COALESCE(SUM(o.quantity), 0) FROM Order o
        WHERE o.user.id = :userId
        AND o.menuItem.id = :menuItemId
        AND o.status <> com.canteen.model.OrderStatus.CANCELLED
        AND o.createdAt >= :dayStart
        AND o.createdAt < :dayEnd
        """)
    int sumQuantityOrderedToday(@Param("userId") Long userId,
                                 @Param("menuItemId") Long menuItemId,
                                 @Param("dayStart") Instant dayStart,
                                 @Param("dayEnd") Instant dayEnd);
}
