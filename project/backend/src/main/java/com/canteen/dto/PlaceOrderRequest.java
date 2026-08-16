package com.canteen.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * Deliberately does NOT include a price field. The server always computes
 * totalPrice itself from the current MenuItem price, so a tampered client
 * payload can never change what gets charged.
 */
public class PlaceOrderRequest {

    @NotNull
    private Long menuItemId;

    @Min(1)
    private int quantity;

    public Long getMenuItemId() {
        return menuItemId;
    }

    public void setMenuItemId(Long menuItemId) {
        this.menuItemId = menuItemId;
    }

    public int getQuantity() {
        return quantity;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }
}
