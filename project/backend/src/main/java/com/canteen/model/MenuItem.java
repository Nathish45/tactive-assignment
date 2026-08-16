package com.canteen.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;

@Entity
@Table(name = "menu_item")
public class MenuItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    private String name;

    @Min(0)
    @Column(nullable = false)
    private BigDecimal price;

    @Min(0)
    @Column(nullable = false)
    private int stockCount;

    @Min(1)
    @Column(nullable = false)
    private int dailyLimitPerPerson;

    @Column(nullable = true)
    private String category;

    @Column(nullable = true, length = 500)
    private String description;

    /**
     * Optimistic locking token. Hibernate auto-increments this on every
     * update and rejects a write if the version has changed since the
     * entity was read — this is what prevents two concurrent orders from
     * both succeeding against the same last unit of stock.
     */
    @Version
    private Long version;

    protected MenuItem() {
        // JPA
    }

    public MenuItem(String name, BigDecimal price, int stockCount, int dailyLimitPerPerson) {
        this(name, price, stockCount, dailyLimitPerPerson, "General", "");
    }

    public MenuItem(String name, BigDecimal price, int stockCount, int dailyLimitPerPerson, String category, String description) {
        this.name = name;
        this.price = price;
        this.stockCount = stockCount;
        this.dailyLimitPerPerson = dailyLimitPerPerson;
        this.category = category;
        this.description = description;
    }

    public Long getId() {
        return id;
    }

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
        return category != null ? category : "General";
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getDescription() {
        return description != null ? description : "";
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Long getVersion() {
        return version;
    }
}
