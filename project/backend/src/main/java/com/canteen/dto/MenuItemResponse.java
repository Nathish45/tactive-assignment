package com.canteen.dto;

import com.canteen.model.MenuItem;

import java.math.BigDecimal;

public class MenuItemResponse {

    private final Long id;
    private final String name;
    private final BigDecimal price;
    private final int stockCount;
    private final int dailyLimitPerPerson;
    private final String category;
    private final String description;
    private final Double averageRating;
    private final long totalRatings;

    public MenuItemResponse(MenuItem item, Double averageRating, long totalRatings) {
        this.id = item.getId();
        this.name = item.getName();
        this.price = item.getPrice();
        this.stockCount = item.getStockCount();
        this.dailyLimitPerPerson = item.getDailyLimitPerPerson();
        this.category = item.getCategory();
        this.description = item.getDescription();
        this.averageRating = averageRating != null ? Math.round(averageRating * 10.0) / 10.0 : 0.0;
        this.totalRatings = totalRatings;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public int getStockCount() {
        return stockCount;
    }

    public int getDailyLimitPerPerson() {
        return dailyLimitPerPerson;
    }

    public String getCategory() {
        return category;
    }

    public String getDescription() {
        return description;
    }

    public Double getAverageRating() {
        return averageRating;
    }

    public long getTotalRatings() {
        return totalRatings;
    }
}
