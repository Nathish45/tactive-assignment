package com.canteen.controller;

import com.canteen.dto.RatingRequest;
import com.canteen.dto.RatingResponse;
import com.canteen.dto.RatingSummaryResponse;
import com.canteen.model.User;
import com.canteen.service.RatingService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/ratings")
public class RatingController {

    private final RatingService ratingService;

    public RatingController(RatingService ratingService) {
        this.ratingService = ratingService;
    }

    @PostMapping
    public RatingResponse submitRating(@AuthenticationPrincipal User user,
                                       @Valid @RequestBody RatingRequest request) {
        return ratingService.submitRating(user, request);
    }

    @GetMapping("/menu/{menuItemId}")
    public List<RatingResponse> getRatingsForMenuItem(@PathVariable Long menuItemId) {
        return ratingService.getRatingsForMenuItem(menuItemId);
    }

    @GetMapping("/summary/{menuItemId}")
    public RatingSummaryResponse getRatingSummary(@PathVariable Long menuItemId) {
        return ratingService.getRatingSummary(menuItemId);
    }

    @GetMapping("/mine")
    public List<RatingResponse> getMyRatings(@AuthenticationPrincipal User user) {
        return ratingService.getMyRatings(user);
    }
}
