package com.canteen.unit;

import com.canteen.dto.RatingRequest;
import com.canteen.dto.RatingResponse;
import com.canteen.dto.RatingSummaryResponse;
import com.canteen.model.MenuItem;
import com.canteen.model.Rating;
import com.canteen.model.User;
import com.canteen.repository.MenuItemRepository;
import com.canteen.repository.OrderRepository;
import com.canteen.repository.RatingRepository;
import com.canteen.service.RatingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class RatingServiceTest {

    private RatingRepository ratingRepository;
    private MenuItemRepository menuItemRepository;
    private OrderRepository orderRepository;
    private Clock clock;
    private RatingService ratingService;

    private User testUser;
    private MenuItem testItem;

    @BeforeEach
    void setUp() {
        ratingRepository = mock(RatingRepository.class);
        menuItemRepository = mock(MenuItemRepository.class);
        orderRepository = mock(OrderRepository.class);
        clock = Clock.fixed(Instant.parse("2026-08-16T10:00:00Z"), ZoneId.of("UTC"));
        ratingService = new RatingService(ratingRepository, menuItemRepository, orderRepository, clock);

        testUser = new User("alice", "hash", "Alice Johnson");
        testItem = new MenuItem("Veg Thali", new BigDecimal("80.00"), 10, 2);
    }

    @Test
    void submitRating_newRating_success() {
        when(menuItemRepository.findById(1L)).thenReturn(Optional.of(testItem));
        when(ratingRepository.findFirstByUserIdAndMenuItemIdOrderByCreatedAtDesc(any(), any())).thenReturn(Optional.empty());

        Rating savedRating = new Rating(testUser, testItem, null, 5, "Delicious!", clock.instant());
        when(ratingRepository.save(any(Rating.class))).thenReturn(savedRating);

        RatingRequest request = new RatingRequest();
        request.setMenuItemId(1L);
        request.setRating(5);
        request.setComment("Delicious!");

        RatingResponse response = ratingService.submitRating(testUser, request);

        assertNotNull(response);
        assertEquals(5, response.getRating());
        assertEquals("Delicious!", response.getComment());
        assertEquals("Veg Thali", response.getMenuItemName());
        verify(ratingRepository).save(any(Rating.class));
    }

    @Test
    void getRatingSummary_computesBreakdown() {
        when(menuItemRepository.existsById(1L)).thenReturn(true);
        when(ratingRepository.getAverageRatingByMenuItemId(1L)).thenReturn(4.5);
        when(ratingRepository.countByMenuItemId(1L)).thenReturn(10L);
        when(ratingRepository.getRatingDistributionByMenuItemId(1L)).thenReturn(List.of(
                new Object[]{5, 6L},
                new Object[]{4, 4L}
        ));

        RatingSummaryResponse summary = ratingService.getRatingSummary(1L);

        assertEquals(4.5, summary.getAverageRating());
        assertEquals(10L, summary.getTotalRatings());
        assertEquals(6L, summary.getDistribution().get(5));
        assertEquals(4L, summary.getDistribution().get(4));
        assertEquals(0L, summary.getDistribution().get(1));
    }
}
