package com.canteen.config;

import com.canteen.model.MenuItem;
import com.canteen.model.Rating;
import com.canteen.model.User;
import com.canteen.repository.MenuItemRepository;
import com.canteen.repository.RatingRepository;
import com.canteen.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Component
public class DataSeeder implements CommandLineRunner {

    private final MenuItemRepository menuItemRepository;
    private final UserRepository userRepository;
    private final RatingRepository ratingRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(MenuItemRepository menuItemRepository,
                      UserRepository userRepository,
                      RatingRepository ratingRepository,
                      PasswordEncoder passwordEncoder) {
        this.menuItemRepository = menuItemRepository;
        this.userRepository = userRepository;
        this.ratingRepository = ratingRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        // Seed users with roles if not present
        User alice = userRepository.findByUsername("alice").orElseGet(() ->
                userRepository.save(new User("alice", passwordEncoder.encode("password123"), "Alice Johnson", "USER")));
        User bob = userRepository.findByUsername("bob").orElseGet(() ->
                userRepository.save(new User("bob", passwordEncoder.encode("password123"), "Bob Smith", "USER")));
        User charlie = userRepository.findByUsername("charlie").orElseGet(() ->
                userRepository.save(new User("charlie", passwordEncoder.encode("password123"), "Charlie Brown", "USER")));
        User admin = userRepository.findByUsername("admin").orElseGet(() ->
                userRepository.save(new User("admin", passwordEncoder.encode("admin123"), "Canteen Kitchen Admin", "ADMIN")));

        // Ensure admin has role ADMIN if already existed
        if (!"ADMIN".equals(admin.getRole())) {
            admin.setRole("ADMIN");
            userRepository.save(admin);
        }

        if (menuItemRepository.count() > 0) {
            return; // already seeded menu items
        }

        MenuItem thali = menuItemRepository.save(new MenuItem(
                "Royal Veg Thali",
                new BigDecimal("80.00"),
                20,
                2,
                "Main Course",
                "Complete balanced meal with Paneer Butter Masala, Dal Tadka, 2 Phulkas, Basmati Rice, Curd & Sweet."
        ));

        MenuItem biryani = menuItemRepository.save(new MenuItem(
                "Dum Chicken Biryani",
                new BigDecimal("120.00"),
                15,
                1,
                "Main Course",
                "Aromatic Hyderabadi dum biryani cooked with marinated chicken, fragrant saffron rice, served with raita and mirchi ka salan."
        ));

        MenuItem dosa = menuItemRepository.save(new MenuItem(
                "Ghee Roast Masala Dosa",
                new BigDecimal("50.00"),
                25,
                3,
                "South Indian",
                "Golden crispy crepe roasted in pure desi ghee, stuffed with seasoned spiced potato filling, coconut & tomato chutneys."
        ));

        MenuItem coffee = menuItemRepository.save(new MenuItem(
                "South Indian Filter Coffee",
                new BigDecimal("15.00"),
                8,
                5,
                "Beverages",
                "Freshly brewed authentic Kumbakonam degree coffee with frothy rich milk and chicory blend."
        ));

        MenuItem paneerRoll = menuItemRepository.save(new MenuItem(
                "Paneer Tikka Kathi Roll",
                new BigDecimal("65.00"),
                12,
                2,
                "Snacks",
                "Char-grilled tandoori paneer cubes wrapped in layered flaky paratha with mint chutney and pickled onions."
        ));

        MenuItem mangoLassi = menuItemRepository.save(new MenuItem(
                "Chilled Alphonso Mango Lassi",
                new BigDecimal("35.00"),
                18,
                3,
                "Beverages",
                "Creamy thick yogurt smoothie made with ripe Alphonso mango pulp and a pinch of cardamom."
        ));

        MenuItem samosa = menuItemRepository.save(new MenuItem(
                "Crispy Punjabi Samosa (2 Pcs)",
                new BigDecimal("30.00"),
                20,
                4,
                "Snacks",
                "Crisp pastry filled with spiced potatoes, green peas, and whole coriander seeds. Served with tangy tamarind dip."
        ));

        MenuItem gulabJamun = menuItemRepository.save(new MenuItem(
                "Hot Gulab Jamun (2 Pcs)",
                new BigDecimal("35.00"),
                15,
                2,
                "Desserts",
                "Melt-in-mouth milk solids dumplings fried golden and soaked in warm rose and cardamom flavored sugar syrup."
        ));

        // Seed initial authentic ratings & reviews
        Instant now = Instant.now();
        ratingRepository.save(new Rating(alice, thali, null, 5, "Super wholesome and fresh! Paneer was so soft and the phulkas were piping hot.", now.minus(2, ChronoUnit.HOURS)));
        ratingRepository.save(new Rating(bob, thali, null, 4, "Great portion size. Loved the dal and sweet gulab jamun with it.", now.minus(5, ChronoUnit.HOURS)));
        ratingRepository.save(new Rating(charlie, biryani, null, 5, "Best biryani on campus! Flavorful masala and tender chicken pieces.", now.minus(1, ChronoUnit.HOURS)));
        ratingRepository.save(new Rating(alice, biryani, null, 5, "Incredible aroma and spice level is spot on!", now.minus(3, ChronoUnit.HOURS)));
        ratingRepository.save(new Rating(bob, dosa, null, 5, "Extra crisp and the coconut chutney is fresh and authentic!", now.minus(4, ChronoUnit.HOURS)));
        ratingRepository.save(new Rating(charlie, coffee, null, 5, "The kick you need during morning lectures. Truly degree coffee quality.", now.minus(30, ChronoUnit.MINUTES)));
        ratingRepository.save(new Rating(alice, paneerRoll, null, 4, "Loved the smoky tandoori flavor and mint sauce inside.", now.minus(6, ChronoUnit.HOURS)));
        ratingRepository.save(new Rating(bob, mangoLassi, null, 5, "Thick, creamy and refreshing. Perfect treat after lunch.", now.minus(45, ChronoUnit.MINUTES)));
    }
}
