import React, { useState, useMemo } from 'react';
import {
  StarIcon,
  ShoppingBagIcon,
  SearchIcon,
  FlameIcon,
  UtensilsIcon,
  SparklesIcon,
} from './Icons';

export const MenuSection = ({
  menuItems,
  onOpenOrder,
  onOpenRating,
  isCutoffPassed,
}) => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('rating'); // 'rating' | 'price-low' | 'price-high' | 'stock'

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set(['All']);
    menuItems.forEach((item) => {
      if (item.category) set.add(item.category);
    });
    return Array.from(set);
  }, [menuItems]);

  // Filter and sort items
  const filteredItems = useMemo(() => {
    return menuItems
      .filter((item) => {
        const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
        const matchesSearch =
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'rating') {
          return (b.averageRating || 0) - (a.averageRating || 0);
        }
        if (sortBy === 'price-low') {
          return Number(a.price) - Number(b.price);
        }
        if (sortBy === 'price-high') {
          return Number(b.price) - Number(a.price);
        }
        if (sortBy === 'stock') {
          return b.stockCount - a.stockCount;
        }
        return 0;
      });
  }, [menuItems, selectedCategory, searchQuery, sortBy]);

  // Overall campus rating average
  const campusAverage = useMemo(() => {
    if (menuItems.length === 0) return '4.8';
    const rated = menuItems.filter((i) => i.averageRating && i.averageRating > 0);
    if (rated.length === 0) return '4.8';
    const sum = rated.reduce((acc, curr) => acc + curr.averageRating, 0);
    return (sum / rated.length).toFixed(1);
  }, [menuItems]);

  const totalStockCount = useMemo(() => {
    return menuItems.reduce((acc, curr) => acc + (curr.stockCount || 0), 0);
  }, [menuItems]);

  const getCategoryThemeClass = (cat) => {
    const lower = (cat || '').toLowerCase();
    if (lower.includes('main')) return 'main-course';
    if (lower.includes('south')) return 'south-indian';
    if (lower.includes('beverage')) return 'beverages';
    if (lower.includes('snack')) return 'snacks';
    if (lower.includes('dessert')) return 'desserts';
    return '';
  };

  return (
    <div>
      {/* Hero Banner */}
      <section className="hero-banner">
        <div className="hero-glass">
          <div>
            <div className="hero-tag">
              <SparklesIcon size={14} /> Campus Gourmet Canteen
            </div>
            <h1 className="hero-title">Fresh, Delicious &amp; Fast Daily Specials</h1>
            <p className="hero-desc">
              Authentic meals prepared daily with fair per-person limits, verified ratings, live stock availability, and a 5-minute instant order cancellation window.
            </p>

            <div className="hero-stats">
              <div className="hero-stat-card">
                <div className="hero-stat-num">★ {campusAverage}</div>
                <div className="hero-stat-label">Canteen Rating</div>
              </div>

              <div className="hero-stat-card">
                <div className="hero-stat-num">{totalStockCount}</div>
                <div className="hero-stat-label">Portions In Stock</div>
              </div>

              <div className="hero-stat-card">
                <div className="hero-stat-num">10:30 AM</div>
                <div className="hero-stat-label">Daily Cutoff</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', minWidth: '180px' }}>
            <div
              style={{
                width: '130px',
                height: '130px',
                borderRadius: 'var(--radius-full)',
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(16, 185, 129, 0.15))',
                border: '1px solid var(--border-glass-bright)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-glow)',
              }}
            >
              <UtensilsIcon size={58} style={{ color: 'var(--accent-amber)' }} />
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Verified Quality Kitchen
            </span>
          </div>
        </div>
      </section>

      {/* Controls Bar: Category Filter, Search, Sort */}
      <section className="controls-container">
        <div className="controls-bar">
          <div className="category-pills">
            {categories.map((cat) => (
              <button
                type="button"
                key={cat}
                className={`cat-pill ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="search-sort-group">
            <div className="search-box">
              <SearchIcon size={16} className="search-icon-pos" />
              <input
                type="text"
                className="search-input"
                placeholder="Search dish or ingredients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <select
              className="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="rating">Top Rated ⭐</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="stock">Stock Available</option>
            </select>
          </div>
        </div>
      </section>

      {/* Menu Cards Grid */}
      <section className="menu-section">
        {filteredItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1.5rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-glass)' }}>
            <UtensilsIcon size={44} style={{ color: 'var(--text-dim)', margin: '0 auto 1rem' }} />
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', color: '#fff', marginBottom: '0.35rem' }}>
              No dishes found
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Try adjusting your category filter or search keywords.
            </p>
          </div>
        ) : (
          <div className="menu-grid">
            {filteredItems.map((item) => {
              const isLowStock = item.stockCount > 0 && item.stockCount <= 3;
              const isOutOfStock = item.stockCount <= 0;
              const avg = item.averageRating || 0;
              const totalRev = item.totalRatings || 0;

              return (
                <div className="food-card" key={item.id}>
                  <div className={`card-header-art ${getCategoryThemeClass(item.category)}`}>
                    <div className="card-category-pill">{item.category || 'Special'}</div>

                    <div className={`card-stock-badge ${isOutOfStock ? 'out' : isLowStock ? 'low' : 'available'}`}>
                      {isOutOfStock ? (
                        'Sold Out'
                      ) : isLowStock ? (
                        <>
                          <FlameIcon size={12} /> Only {item.stockCount} left!
                        </>
                      ) : (
                        `${item.stockCount} in stock`
                      )}
                    </div>

                    <div className="dish-illustration">
                      <UtensilsIcon size={32} />
                    </div>
                  </div>

                  <div className="card-body">
                    <div className="card-title-row">
                      <h3 className="dish-name">{item.name}</h3>

                      <button
                        type="button"
                        className="rating-pill-btn"
                        onClick={() => onOpenRating(item)}
                        title="View ratings and reviews"
                      >
                        <StarIcon size={13} filled={true} />
                        <span>{avg > 0 ? avg.toFixed(1) : 'New'}</span>
                        {totalRev > 0 && (
                          <span style={{ fontSize: '0.72rem', opacity: 0.8 }}>({totalRev})</span>
                        )}
                      </button>
                    </div>

                    <p className="dish-desc">{item.description || 'Piping hot authentic preparation.'}</p>

                    <div className="card-meta-tags">
                      <span className="meta-limit-tag">
                        Max {item.dailyLimitPerPerson} per person
                      </span>
                    </div>

                    <div className="card-footer">
                      <div className="dish-price">
                        <span>₹</span>
                        {Number(item.price).toFixed(2)}
                      </div>

                      <button
                        type="button"
                        className="order-action-btn"
                        onClick={() => onOpenOrder(item)}
                        disabled={isOutOfStock || isCutoffPassed}
                      >
                        <ShoppingBagIcon size={15} />
                        {isOutOfStock ? 'Sold Out' : isCutoffPassed ? 'Closed' : 'Order Now'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
