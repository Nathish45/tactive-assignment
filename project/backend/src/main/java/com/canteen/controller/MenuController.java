package com.canteen.controller;

import com.canteen.dto.MenuItemResponse;
import com.canteen.exception.OrderException;
import com.canteen.model.MenuItem;
import com.canteen.repository.MenuItemRepository;
import com.canteen.repository.RatingRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/menu")
public class MenuController {

    private final MenuItemRepository menuItemRepository;
    private final RatingRepository ratingRepository;

    public MenuController(MenuItemRepository menuItemRepository, RatingRepository ratingRepository) {
        this.menuItemRepository = menuItemRepository;
        this.ratingRepository = ratingRepository;
    }

    @GetMapping
    public List<MenuItemResponse> getMenu() {
        return menuItemRepository.findAll()
                .stream()
                .map(item -> {
                    Double avg = ratingRepository.getAverageRatingByMenuItemId(item.getId());
                    Long count = ratingRepository.countByMenuItemId(item.getId());
                    return new MenuItemResponse(item, avg, count != null ? count : 0L);
                })
                .toList();
    }

    @GetMapping("/{id}")
    public MenuItemResponse getMenuItem(@PathVariable Long id) {
        MenuItem item = menuItemRepository.findById(id)
                .orElseThrow(() -> OrderException.notFound("Menu item"));
        Double avg = ratingRepository.getAverageRatingByMenuItemId(item.getId());
        Long count = ratingRepository.countByMenuItemId(item.getId());
        return new MenuItemResponse(item, avg, count != null ? count : 0L);
    }
}
