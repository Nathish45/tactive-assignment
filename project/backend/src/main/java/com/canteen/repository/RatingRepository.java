package com.canteen.repository;

import com.canteen.model.Rating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RatingRepository extends JpaRepository<Rating, Long> {

    List<Rating> findByMenuItemIdOrderByCreatedAtDesc(Long menuItemId);

    List<Rating> findByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<Rating> findFirstByUserIdAndMenuItemIdOrderByCreatedAtDesc(Long userId, Long menuItemId);

    Optional<Rating> findByUserIdAndOrderId(Long userId, Long orderId);

    @Query("SELECT AVG(r.rating) FROM Rating r WHERE r.menuItem.id = :menuItemId")
    Double getAverageRatingByMenuItemId(@Param("menuItemId") Long menuItemId);

    @Query("SELECT COUNT(r) FROM Rating r WHERE r.menuItem.id = :menuItemId")
    Long countByMenuItemId(@Param("menuItemId") Long menuItemId);

    @Query("SELECT r.rating, COUNT(r) FROM Rating r WHERE r.menuItem.id = :menuItemId GROUP BY r.rating")
    List<Object[]> getRatingDistributionByMenuItemId(@Param("menuItemId") Long menuItemId);
}
