import React, { useState, useEffect } from 'react';
import {
  ShieldCheckIcon,
  ShoppingBagIcon,
  UtensilsIcon,
  ClockIcon,
  StarIcon,
  TrendingUpIcon,
  PackageIcon,
  UsersIcon,
  ChefHatIcon,
  EditIcon,
  TrashIcon,
  PlusIcon,
  RefreshCwIcon,
  XIcon,
  CheckIcon,
  AlertCircleIcon,
  LogOutIcon,
  LogInIcon,
} from './Icons';
import { api } from '../api';

export const AdminPortal = ({ onSwitchToCustomer, showToast }) => {
  const [adminUser, setAdminUser] = useState(api.adminUser);
  const [activeAdminTab, setActiveAdminTab] = useState('orders'); // 'orders' | 'menu' | 'analytics' | 'reviews'

  // Admin login form state
  const [adminUsername, setAdminUsername] = useState('admin');
  const [adminPassword, setAdminPassword] = useState('admin123');
  const [loginLoading, setLoginLoading] = useState(false);

  // Data states
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  // Order filter
  const [orderFilter, setOrderFilter] = useState('ALL');

  // Menu Modal state (Add / Edit)
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemForm, setItemForm] = useState({
    name: '',
    price: '',
    stockCount: 15,
    dailyLimitPerPerson: 2,
    category: 'Main Course',
    description: '',
  });
  const [savingItem, setSavingItem] = useState(false);

  useEffect(() => {
    if (adminUser) {
      loadAllAdminData();
    }
  }, [adminUser]);

  const loadAllAdminData = async () => {
    setLoadingData(true);
    try {
      const [statsData, ordersData, menuData, reviewsData] = await Promise.all([
        api.admin.getStats().catch(() => null),
        api.admin.getOrders().catch(() => []),
        api.menu.getAll().catch(() => []),
        api.admin.getRatings().catch(() => []),
      ]);
      setStats(statsData);
      setOrders(ordersData || []);
      setMenuItems(menuData || []);
      setReviews(reviewsData || []);
    } catch (err) {
      showToast(err.message || 'Failed to fetch admin data.', 'error');
    } finally {
      setLoadingData(false);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    try {
      const { user } = await api.admin.login(adminUsername.trim(), adminPassword);
      setAdminUser(user);
      showToast(`Admin authorized. Welcome, ${user.displayName || user.username}!`, 'success');
    } catch (err) {
      showToast(err.message || 'Admin authentication failed.', 'error');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleAdminLogout = () => {
    api.adminLogout();
    setAdminUser(null);
    showToast('Admin session closed.', 'info');
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await api.admin.updateOrderStatus(orderId, newStatus);
      showToast(`Order #${orderId} marked as ${newStatus}`, 'success');
      loadAllAdminData();
    } catch (err) {
      showToast(err.message || 'Failed to update order status.', 'error');
    }
  };

  const handleQuickRestock = async (item, addAmount) => {
    const newCount = (item.stockCount || 0) + addAmount;
    try {
      await api.admin.updateStock(item.id, newCount);
      showToast(`Restocked ${item.name}! New stock: ${newCount}`, 'success');
      loadAllAdminData();
    } catch (err) {
      showToast(err.message || 'Failed to update stock.', 'error');
    }
  };

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setItemForm({
      name: '',
      price: '',
      stockCount: 15,
      dailyLimitPerPerson: 2,
      category: 'Main Course',
      description: '',
    });
    setShowItemModal(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setItemForm({
      name: item.name,
      price: item.price,
      stockCount: item.stockCount,
      dailyLimitPerPerson: item.dailyLimitPerPerson,
      category: item.category || 'Main Course',
      description: item.description || '',
    });
    setShowItemModal(true);
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    if (!itemForm.name.trim()) {
      showToast('Please enter dish name.', 'error');
      return;
    }
    if (Number(itemForm.price) <= 0) {
      showToast('Price must be greater than 0.', 'error');
      return;
    }

    setSavingItem(true);
    try {
      const payload = {
        name: itemForm.name.trim(),
        price: Number(itemForm.price),
        stockCount: parseInt(itemForm.stockCount, 10) || 0,
        dailyLimitPerPerson: parseInt(itemForm.dailyLimitPerPerson, 10) || 1,
        category: itemForm.category,
        description: itemForm.description.trim(),
      };

      if (editingItem) {
        await api.admin.updateMenuItem(editingItem.id, payload);
        showToast(`Updated '${payload.name}' successfully!`, 'success');
      } else {
        await api.admin.addMenuItem(payload);
        showToast(`Added new dish '${payload.name}' to menu!`, 'success');
      }

      setShowItemModal(false);
      loadAllAdminData();
    } catch (err) {
      showToast(err.message || 'Failed to save menu item.', 'error');
    } finally {
      setSavingItem(false);
    }
  };

  const handleDeleteItem = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete '${name}' from the menu?`)) {
      return;
    }
    try {
      await api.admin.deleteMenuItem(id);
      showToast(`Dish '${name}' was deleted.`, 'info');
      loadAllAdminData();
    } catch (err) {
      showToast(err.message || 'Failed to delete dish.', 'error');
    }
  };

  const handleDeleteReview = async (id) => {
    if (!window.confirm('Delete this customer review?')) return;
    try {
      await api.admin.deleteRating(id);
      showToast('Review deleted.', 'info');
      loadAllAdminData();
    } catch (err) {
      showToast(err.message || 'Failed to delete review.', 'error');
    }
  };

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    if (orderFilter === 'ALL') return true;
    return o.status === orderFilter;
  });

  // If Admin not authenticated, render Admin Login screen
  if (!adminUser) {
    return (
      <div style={{ minHeight: '85vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
        <div style={{ maxWidth: '450px', width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-lg)', padding: '2.2rem', boxShadow: 'var(--shadow-card)' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: 'var(--radius-md)', background: 'linear-gradient(135deg, #6366f1, #4338ca)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', margin: '0 auto 1rem', boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)' }}>
              <ShieldCheckIcon size={28} />
            </div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', color: '#fff', fontWeight: 800 }}>
              Admin Kitchen Portal
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.35rem' }}>
              Authorized kitchen staff and administrator access only.
            </p>
          </div>

          <form onSubmit={handleAdminLogin}>
            <div className="form-group">
              <label className="form-label">Admin Username</label>
              <input
                type="text"
                className="form-input"
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                placeholder="admin"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Admin Password</label>
              <input
                type="password"
                className="form-input"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="admin123"
                required
              />
            </div>

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loginLoading}
              style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: '#fff', marginTop: '1rem' }}
            >
              {loginLoading ? 'Verifying Admin Privileges...' : 'Access Admin Console'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-glass)' }}>
            <button
              type="button"
              onClick={onSwitchToCustomer}
              style={{ background: 'none', border: 'none', color: 'var(--accent-amber)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
            >
              ← Return to Customer Canteen View
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated Admin Console
  return (
    <div style={{ maxWidth: '1350px', margin: '0 auto', padding: '1.5rem 1.75rem 4rem', width: '100%' }}>
      {/* Admin Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--border-glass)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-md)', background: 'linear-gradient(135deg, #6366f1, #4338ca)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <ChefHatIcon size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>
                Kitchen Operations &amp; Admin Console
              </h1>
              <span style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.4)', fontSize: '0.7rem', fontWeight: 800, padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-full)' }}>
                ROLE_ADMIN
              </span>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Logged in as <strong>{adminUser.displayName || adminUser.username}</strong>
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            className="user-profile-btn"
            onClick={loadAllAdminData}
            title="Refresh admin data"
          >
            <RefreshCwIcon size={14} />
            Refresh
          </button>

          <button
            type="button"
            className="user-profile-btn"
            onClick={onSwitchToCustomer}
            style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-amber)', borderColor: 'rgba(245, 158, 11, 0.3)' }}
          >
            Customer View
          </button>

          <button
            type="button"
            className="user-profile-btn"
            onClick={handleAdminLogout}
            style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#fb7185', borderColor: 'rgba(244, 63, 94, 0.3)' }}
          >
            <LogOutIcon size={14} />
            Admin Logout
          </button>
        </div>
      </div>

      {/* Admin Stats Overview Cards */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase' }}>Total Revenue</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-amber)', marginTop: '0.35rem' }}>
              ₹{Number(stats.totalRevenue || 0).toFixed(2)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>From completed orders</div>
          </div>

          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase' }}>Orders Today</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', fontWeight: 800, color: '#fff', marginTop: '0.35rem' }}>
              {stats.totalOrders}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#34d399', marginTop: '0.2rem' }}>
              {stats.pendingOrders} in active prep
            </div>
          </div>

          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase' }}>Menu Items</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', fontWeight: 800, color: '#fff', marginTop: '0.35rem' }}>
              {stats.totalMenuItems}
            </div>
            <div style={{ fontSize: '0.75rem', color: stats.lowStockCount > 0 ? '#fb7185' : 'var(--text-dim)', marginTop: '0.2rem' }}>
              {stats.lowStockCount} items low stock
            </div>
          </div>

          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase' }}>Student Reviews</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-gold)', marginTop: '0.35rem' }}>
              {stats.totalReviews}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Across all dishes</div>
          </div>
        </div>
      )}

      {/* Admin Tab Switcher */}
      <div style={{ display: 'flex', gap: '0.6rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.85rem', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          className={`nav-tab-btn ${activeAdminTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveAdminTab('orders')}
        >
          <ShoppingBagIcon size={16} />
          Kitchen Orders ({orders.length})
        </button>

        <button
          type="button"
          className={`nav-tab-btn ${activeAdminTab === 'menu' ? 'active' : ''}`}
          onClick={() => setActiveAdminTab('menu')}
        >
          <UtensilsIcon size={16} />
          Menu &amp; Stock Manager ({menuItems.length})
        </button>

        <button
          type="button"
          className={`nav-tab-btn ${activeAdminTab === 'reviews' ? 'active' : ''}`}
          onClick={() => setActiveAdminTab('reviews')}
        >
          <StarIcon size={16} />
          Reviews &amp; Feedback ({reviews.length})
        </button>
      </div>

      {/* TAB 1: KITCHEN ORDERS */}
      {activeAdminTab === 'orders' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {['ALL', 'PLACED', 'PREPARING', 'COMPLETED', 'CANCELLED'].map((st) => (
                <button
                  type="button"
                  key={st}
                  className={`cat-pill ${orderFilter === st ? 'active' : ''}`}
                  style={{ fontSize: '0.78rem', padding: '0.35rem 0.85rem' }}
                  onClick={() => setOrderFilter(st)}
                >
                  {st}
                </button>
              ))}
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
              Showing {filteredOrders.length} orders
            </span>
          </div>

          {filteredOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)', color: 'var(--text-dim)' }}>
              No orders found matching filter '{orderFilter}'.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {filteredOrders.map((ord) => (
                <div
                  key={ord.id}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.15rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1rem',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
                        Order #{ord.id}: {ord.itemName}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--accent-amber)', fontWeight: 700 }}>
                        x{ord.quantity} (₹{Number(ord.totalPrice).toFixed(2)})
                      </span>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      Customer: <strong>{ord.customerDisplayName || ord.customerUsername}</strong> (@{ord.customerUsername}) •{' '}
                      {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                    <span
                      className={`order-status-badge ${ord.status.toLowerCase()}`}
                      style={{ padding: '0.35rem 0.75rem' }}
                    >
                      {ord.status}
                    </span>

                    {ord.status === 'PLACED' && (
                      <button
                        type="button"
                        className="order-action-btn"
                        style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', background: '#3b82f6', color: '#fff' }}
                        onClick={() => handleUpdateOrderStatus(ord.id, 'PREPARING')}
                      >
                        Start Preparing 🍳
                      </button>
                    )}

                    {ord.status === 'PREPARING' && (
                      <button
                        type="button"
                        className="order-action-btn"
                        style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', background: '#10b981', color: '#fff' }}
                        onClick={() => handleUpdateOrderStatus(ord.id, 'COMPLETED')}
                      >
                        Complete Order ✅
                      </button>
                    )}

                    {ord.status !== 'CANCELLED' && ord.status !== 'COMPLETED' && (
                      <button
                        type="button"
                        className="cancel-order-btn"
                        style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                        onClick={() => handleUpdateOrderStatus(ord.id, 'CANCELLED')}
                      >
                        Cancel ✕
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MENU & STOCK MANAGER */}
      {activeAdminTab === 'menu' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: '#fff' }}>
              Canteen Menu Items &amp; Inventory
            </h3>
            <button
              type="button"
              className="order-action-btn"
              onClick={handleOpenAddModal}
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff' }}
            >
              <PlusIcon size={16} />
              Add New Dish
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {menuItems.map((item) => {
              const isLowStock = item.stockCount <= 3;
              return (
                <div
                  key={item.id}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--accent-amber)', fontWeight: 700, textTransform: 'uppercase' }}>
                        {item.category || 'Special'}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', fontWeight: 700 }}>
                        ★ {item.averageRating ? item.averageRating.toFixed(1) : 'New'} ({item.totalRatings || 0})
                      </span>
                    </div>

                    <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', color: '#fff', marginBottom: '0.35rem' }}>
                      {item.name}
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.85rem' }}>
                      {item.description || 'Fresh canteen preparation.'}
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 255, 255, 0.03)', padding: '0.6rem 0.85rem', borderRadius: 'var(--radius-sm)', marginBottom: '0.85rem' }}>
                      <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Price</div>
                        <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>
                          ₹{Number(item.price).toFixed(2)}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Stock Level</div>
                        <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 800, color: isLowStock ? '#fb7185' : '#34d399' }}>
                          {item.stockCount} units
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Daily Limit</div>
                        <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-muted)' }}>
                          {item.dailyLimitPerPerson}/day
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    {/* Quick Restock Buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 600 }}>Quick Restock:</span>
                      <button
                        type="button"
                        className="demo-btn"
                        onClick={() => handleQuickRestock(item, 5)}
                      >
                        +5
                      </button>
                      <button
                        type="button"
                        className="demo-btn"
                        onClick={() => handleQuickRestock(item, 10)}
                      >
                        +10
                      </button>
                      <button
                        type="button"
                        className="demo-btn"
                        onClick={() => handleQuickRestock(item, 20)}
                      >
                        +20
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--border-glass)', paddingTop: '0.75rem' }}>
                      <button
                        type="button"
                        className="user-profile-btn"
                        style={{ flex: 1, justifyContent: 'center', fontSize: '0.8rem' }}
                        onClick={() => handleOpenEditModal(item)}
                      >
                        <EditIcon size={14} />
                        Edit Details
                      </button>

                      <button
                        type="button"
                        className="modal-close-btn"
                        style={{ width: '34px', height: '34px', color: '#fb7185' }}
                        onClick={() => handleDeleteItem(item.id, item.name)}
                        title="Delete menu item"
                      >
                        <TrashIcon size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: REVIEWS MODERATION */}
      {activeAdminTab === 'reviews' && (
        <div>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: '#fff', marginBottom: '1.25rem' }}>
            Customer Feedback &amp; Student Reviews ({reviews.length})
          </h3>

          {reviews.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)', color: 'var(--text-dim)' }}>
              No reviews posted yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {reviews.map((r) => (
                <div
                  key={r.id}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem 1.25rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem',
                  }}
                >
                  <div style={{ flexGrow: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>
                        {r.userDisplayName}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--accent-amber)', fontWeight: 600 }}>
                        reviewed <strong>{r.menuItemName}</strong>
                      </span>
                      <div style={{ display: 'flex', gap: '2px', color: 'var(--accent-gold)', marginLeft: '0.35rem' }}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <StarIcon key={s} size={12} filled={s <= r.rating} />
                        ))}
                      </div>
                    </div>
                    {r.comment && (
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>"{r.comment}"</p>
                    )}
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                      {new Date(r.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="modal-close-btn"
                    style={{ color: '#fb7185' }}
                    onClick={() => handleDeleteReview(r.id)}
                    title="Delete review"
                  >
                    <TrashIcon size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Dish Modal */}
      {showItemModal && (
        <div className="modal-overlay" onClick={() => setShowItemModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{editingItem ? 'Edit Dish' : 'Add New Canteen Dish'}</h3>
              <button className="modal-close-btn" onClick={() => setShowItemModal(false)}>
                <XIcon size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveItem} style={{ padding: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label">Dish Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Paneer Butter Masala"
                  value={itemForm.name}
                  onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Price (₹)</label>
                  <input
                    type="number"
                    step="0.50"
                    min="1"
                    className="form-input"
                    placeholder="80.00"
                    value={itemForm.price}
                    onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="form-input"
                    value={itemForm.category}
                    onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                  >
                    <option value="Main Course">Main Course</option>
                    <option value="South Indian">South Indian</option>
                    <option value="Snacks">Snacks</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Desserts">Desserts</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Initial Stock Count</label>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    value={itemForm.stockCount}
                    onChange={(e) => setItemForm({ ...itemForm, stockCount: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Daily Limit Per Student</label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    value={itemForm.dailyLimitPerPerson}
                    onChange={(e) => setItemForm({ ...itemForm, dailyLimitPerPerson: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="review-textarea"
                  style={{ minHeight: '70px' }}
                  placeholder="Ingredients, preparation details, accompaniments..."
                  value={itemForm.description}
                  onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                  maxLength={500}
                />
              </div>

              <button
                type="submit"
                className="place-order-confirm-btn"
                disabled={savingItem}
                style={{ marginTop: '0.5rem' }}
              >
                <CheckIcon size={18} />
                {savingItem ? 'Saving Dish...' : editingItem ? 'Save Changes' : 'Create Menu Item'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
