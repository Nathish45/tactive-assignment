package com.canteen.dto;

import java.util.Map;

public class RatingSummaryResponse {

    private final Long menuItemId;
    private final Double averageRating;
    private final long totalRatings;
    private final Map<Integer, Long> distribution;

    public RatingSummaryResponse(Long menuItemId, Double averageRating, long totalRatings, Map<Integer, Long> distribution) {
        this.menuItemId = menuItemId;
        this.averageRating = averageRating != null ? Math.round(averageRating * 10.0) / 10.0 : 0.0;
        this.totalRatings = totalRatings;
        this.distribution = distribution;
    }

    public Long getMenuItemId() {
        return menuItemId;
    }

    public Double getAverageRating() {
        return averageRating;
    }

    public long getTotalRatings() {
        return totalRatings;
    }

    public Map<Integer, Long> getDistribution() {
        return distribution;
    }
}
