import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { MenuSection } from './components/MenuSection';
import { RatingModal } from './components/RatingModal';
import { OrderModal } from './components/OrderModal';
import { OrdersDrawer } from './components/OrdersDrawer';
import { AuthModal } from './components/AuthModal';
import { AdminPortal } from './components/AdminPortal';
import { CheckIcon, AlertCircleIcon, SparklesIcon } from './components/Icons';
import { api } from './api';

export function App() {
  const [portalMode, setPortalMode] = useState('customer'); // 'customer' | 'admin'
  const [user, setUser] = useState(api.user);
  const [activeTab, setActiveTab] = useState('menu'); // 'menu' | 'orders'
  const [menuItems, setMenuItems] = useState([]);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [ordersCount, setOrdersCount] = useState(0);
  const [isCutoffPassed, setIsCutoffPassed] = useState(false);

  // Modals
  const [ratingModalItem, setRatingModalItem] = useState(null);
  const [ratingModalOrderId, setRatingModalOrderId] = useState(null);
  const [orderModalItem, setOrderModalItem] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  useEffect(() => {
    loadMenu();
    if (user) {
      loadUserOrdersCount();
    }
  }, [user]);

  const loadMenu = async () => {
    setLoadingMenu(true);
    try {
      const data = await api.menu.getAll();
      setMenuItems(data || []);
    } catch (err) {
      showToast(err.message || 'Failed to load menu.', 'error');
    } finally {
      setLoadingMenu(false);
    }
  };

  const loadUserOrdersCount = async () => {
    try {
      const myOrders = await api.orders.getMyOrders();
      const activeCount = (myOrders || []).filter((o) => o.status === 'PLACED' || o.status === 'PREPARING' || o.status === 'READY').length;
      setOrdersCount(activeCount);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    setOrdersCount(0);
    showToast('Signed out successfully.', 'info');
  };

  const handleOpenRating = (itemOrId, orderId = null, itemName = '') => {
    if (!user) {
      setShowAuthModal(true);
      showToast('Please sign in to rate dishes.', 'info');
      return;
    }

    if (typeof itemOrId === 'object') {
      setRatingModalItem(itemOrId);
      setRatingModalOrderId(orderId);
    } else {
      const found = menuItems.find((i) => i.id === itemOrId);
      if (found) {
        setRatingModalItem(found);
      } else {
        setRatingModalItem({ id: itemOrId, name: itemName || `Dish #${itemOrId}` });
      }
      setRatingModalOrderId(orderId);
    }
  };

  const handleOrderPlaced = () => {
    loadMenu();
    loadUserOrdersCount();
  };

  const handleOrderCancelled = () => {
    loadMenu();
    loadUserOrdersCount();
  };

  const handleRatingSubmitted = () => {
    loadMenu();
  };

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        ordersCount={ordersCount}
        onOpenAuth={() => setShowAuthModal(true)}
        onLogout={handleLogout}
        cutoffTimeStr="10:30:00"
        onCutoffStatusChange={setIsCutoffPassed}
        portalMode={portalMode}
        onTogglePortalMode={(mode) => setPortalMode(mode)}
      />

      {/* Main View Router */}
      <main style={{ flexGrow: 1 }}>
        {portalMode === 'admin' ? (
          <AdminPortal
            onSwitchToCustomer={() => setPortalMode('customer')}
            showToast={showToast}
          />
        ) : activeTab === 'menu' ? (
          loadingMenu ? (
            <div style={{ textAlign: 'center', padding: '6rem 2rem', color: 'var(--text-dim)' }}>
              <div style={{ fontSize: '1.25rem', fontFamily: 'var(--font-heading)', color: '#fff', marginBottom: '0.5rem' }}>
                Connecting to Canteen Kitchen...
              </div>
              <p style={{ fontSize: '0.85rem' }}>Fetching live menu and customer reviews</p>
            </div>
          ) : (
            <MenuSection
              menuItems={menuItems}
              onOpenOrder={(item) => {
                if (!user) {
                  setShowAuthModal(true);
                  showToast('Please sign in to place an order.', 'info');
                } else {
                  setOrderModalItem(item);
                }
              }}
              onOpenRating={handleOpenRating}
              isCutoffPassed={isCutoffPassed}
            />
          )
        ) : (
          <OrdersDrawer
            user={user}
            onOpenRating={handleOpenRating}
            showToast={showToast}
            onOrderCancelled={handleOrderCancelled}
          />
        )}
      </main>

      {/* Modals */}
      {ratingModalItem && (
        <RatingModal
          item={ratingModalItem}
          user={user}
          orderId={ratingModalOrderId}
          onClose={() => {
            setRatingModalItem(null);
            setRatingModalOrderId(null);
          }}
          onRatingSubmitted={handleRatingSubmitted}
          showToast={showToast}
        />
      )}

      {orderModalItem && (
        <OrderModal
          item={orderModalItem}
          user={user}
          onClose={() => setOrderModalItem(null)}
          onOrderPlaced={handleOrderPlaced}
          showToast={showToast}
          isCutoffPassed={isCutoffPassed}
        />
      )}

      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onAuthSuccess={(u) => {
            setUser(u);
            loadUserOrdersCount();
          }}
          showToast={showToast}
        />
      )}

      {/* Toast Alerts */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div className={`toast ${t.type}`} key={t.id}>
            {t.type === 'success' ? (
              <CheckIcon size={18} style={{ color: 'var(--accent-emerald)', flexShrink: 0 }} />
            ) : t.type === 'error' ? (
              <AlertCircleIcon size={18} style={{ color: 'var(--accent-rose)', flexShrink: 0 }} />
            ) : (
              <SparklesIcon size={18} style={{ color: 'var(--accent-amber)', flexShrink: 0 }} />
            )}
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
