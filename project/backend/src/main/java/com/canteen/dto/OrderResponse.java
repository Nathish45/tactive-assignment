package com.canteen.dto;

import com.canteen.model.Order;
import com.canteen.model.OrderStatus;

import java.math.BigDecimal;
import java.time.Instant;

public class OrderResponse {

    private final Long id;
    private final Long menuItemId;
    private final String itemName;
    private final int quantity;
    private final BigDecimal totalPrice;
    private final OrderStatus status;
    private final Instant createdAt;

    public OrderResponse(Order order) {
        this.id = order.getId();
        this.menuItemId = order.getMenuItem().getId();
        this.itemName = order.getMenuItem().getName();
        this.quantity = order.getQuantity();
        this.totalPrice = order.getTotalPrice();
        this.status = order.getStatus();
        this.createdAt = order.getCreatedAt();
    }

    public Long getId() {
        return id;
    }

    public Long getMenuItemId() {
        return menuItemId;
    }

    public String getItemName() {
        return itemName;
    }

    public int getQuantity() {
        return quantity;
    }

    public BigDecimal getTotalPrice() {
        return totalPrice;
    }

    public OrderStatus getStatus() {
        return status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
