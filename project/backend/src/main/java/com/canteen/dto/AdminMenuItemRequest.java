package com.canteen.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public class AdminMenuItemRequest {

    @NotBlank(message = "Dish name is required")
    private String name;

    @NotNull(message = "Price is required")
    @Min(value = 0, message = "Price cannot be negative")
    private BigDecimal price;

    @Min(value = 0, message = "Stock cannot be negative")
    private int stockCount = 10;

    @Min(value = 1, message = "Daily limit must be at least 1")
    private int dailyLimitPerPerson = 2;

    private String category = "Main Course";

    private String description = "";

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public int getStockCount() {
        return stockCount;
    }

    public void setStockCount(int stockCount) {
        this.stockCount = stockCount;
    }

    public int getDailyLimitPerPerson() {
        return dailyLimitPerPerson;
    }

    public void setDailyLimitPerPerson(int dailyLimitPerPerson) {
        this.dailyLimitPerPerson = dailyLimitPerPerson;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
