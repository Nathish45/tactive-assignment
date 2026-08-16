package com.canteen.service;

import com.canteen.dto.RatingRequest;
import com.canteen.dto.RatingResponse;
import com.canteen.dto.RatingSummaryResponse;
import com.canteen.exception.OrderException;
import com.canteen.model.MenuItem;
import com.canteen.model.Order;
import com.canteen.model.Rating;
import com.canteen.model.User;
import com.canteen.repository.MenuItemRepository;
import com.canteen.repository.OrderRepository;
import com.canteen.repository.RatingRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class RatingService {

    private final RatingRepository ratingRepository;
    private final MenuItemRepository menuItemRepository;
    private final OrderRepository orderRepository;
    private final Clock clock;

    public RatingService(RatingRepository ratingRepository,
                         MenuItemRepository menuItemRepository,
                         OrderRepository orderRepository,
                         Clock clock) {
        this.ratingRepository = ratingRepository;
        this.menuItemRepository = menuItemRepository;
        this.orderRepository = orderRepository;
        this.clock = clock;
    }

    @Transactional
    public RatingResponse submitRating(User user, RatingRequest request) {
        MenuItem menuItem = menuItemRepository.findById(request.getMenuItemId())
                .orElseThrow(() -> OrderException.notFound("Menu item"));

        Order order = null;
        if (request.getOrderId() != null) {
            order = orderRepository.findById(request.getOrderId())
                    .orElseThrow(() -> OrderException.notFound("Order"));
            if (!order.getUser().getId().equals(user.getId())) {
                throw OrderException.notOwner();
            }
        }

        Instant now = clock.instant();

        // Check if there is already an existing rating for this order or menu item by this user
        Optional<Rating> existingRatingOpt;
        if (order != null) {
            existingRatingOpt = ratingRepository.findByUserIdAndOrderId(user.getId(), order.getId());
        } else {
            existingRatingOpt = ratingRepository.findFirstByUserIdAndMenuItemIdOrderByCreatedAtDesc(user.getId(), menuItem.getId());
        }

        Rating rating;
        if (existingRatingOpt.isPresent()) {
            rating = existingRatingOpt.get();
            rating.setRating(request.getRating());
            rating.setComment(request.getComment());
            rating.setCreatedAt(now);
        } else {
            rating = new Rating(user, menuItem, order, request.getRating(), request.getComment(), now);
        }

        Rating saved = ratingRepository.save(rating);
        return new RatingResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<RatingResponse> getRatingsForMenuItem(Long menuItemId) {
        if (!menuItemRepository.existsById(menuItemId)) {
            throw OrderException.notFound("Menu item");
        }
        return ratingRepository.findByMenuItemIdOrderByCreatedAtDesc(menuItemId)
                .stream()
                .map(RatingResponse::new)
                .toList();
    }

    @Transactional(readOnly = true)
    public RatingSummaryResponse getRatingSummary(Long menuItemId) {
        if (!menuItemRepository.existsById(menuItemId)) {
            throw OrderException.notFound("Menu item");
        }

        Double avg = ratingRepository.getAverageRatingByMenuItemId(menuItemId);
        Long count = ratingRepository.countByMenuItemId(menuItemId);
        List<Object[]> distributionRaw = ratingRepository.getRatingDistributionByMenuItemId(menuItemId);

        Map<Integer, Long> distribution = new HashMap<>();
        for (int star = 1; star <= 5; star++) {
            distribution.put(star, 0L);
        }

        if (distributionRaw != null) {
            for (Object[] row : distributionRaw) {
                if (row.length >= 2 && row[0] instanceof Number starNum && row[1] instanceof Number countNum) {
                    distribution.put(starNum.intValue(), countNum.longValue());
                }
            }
        }

        return new RatingSummaryResponse(menuItemId, avg, count != null ? count : 0L, distribution);
    }

    @Transactional(readOnly = true)
    public List<RatingResponse> getMyRatings(User user) {
        return ratingRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(RatingResponse::new)
                .toList();
    }
}
