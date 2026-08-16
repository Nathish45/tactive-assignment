package com.canteen.dto;

import com.canteen.model.Rating;

import java.time.Instant;

public class RatingResponse {

    private final Long id;
    private final Long menuItemId;
    private final String menuItemName;
    private final Long userId;
    private final String userDisplayName;
    private final Long orderId;
    private final int rating;
    private final String comment;
    private final Instant createdAt;

    public RatingResponse(Rating rating) {
        this.id = rating.getId();
        this.menuItemId = rating.getMenuItem().getId();
        this.menuItemName = rating.getMenuItem().getName();
        this.userId = rating.getUser().getId();
        this.userDisplayName = rating.getUser().getDisplayName();
        this.orderId = rating.getOrder() != null ? rating.getOrder().getId() : null;
        this.rating = rating.getRating();
        this.comment = rating.getComment();
        this.createdAt = rating.getCreatedAt();
    }

    public Long getId() {
        return id;
    }

    public Long getMenuItemId() {
        return menuItemId;
    }

    public String getMenuItemName() {
        return menuItemName;
    }

    public Long getUserId() {
        return userId;
    }

    public String getUserDisplayName() {
        return userDisplayName;
    }

    public Long getOrderId() {
        return orderId;
    }

    public int getRating() {
        return rating;
    }

    public String getComment() {
        return comment;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
