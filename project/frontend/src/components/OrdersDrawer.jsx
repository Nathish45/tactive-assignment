import React, { useState, useEffect } from 'react';
import { ShoppingBagIcon, StarIcon, ClockIcon, TrashIcon, AlertCircleIcon, CheckIcon, RefreshCwIcon } from './Icons';
import { api } from '../api';

export const OrdersDrawer = ({ user, onOpenRating, showToast, onOrderCancelled }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    loadOrders();
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [user]);

  const loadOrders = async () => {
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await api.orders.getMyOrders();
      setOrders(data || []);
    } catch (err) {
      showToast(err.message || 'Failed to load order history.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (orderId) => {
    setCancellingId(orderId);
    try {
      await api.orders.cancel(orderId);
      showToast(`Order #${orderId} was successfully cancelled. Stock restored.`, 'info');
      loadOrders();
      if (onOrderCancelled) {
        onOrderCancelled();
      }
    } catch (err) {
      showToast(err.message || 'Failed to cancel order.', 'error');
    } finally {
      setCancellingId(null);
    }
  };

  if (!user) {
    return (
      <div className="orders-container" style={{ textAlign: 'center', padding: '4rem 1.5rem' }}>
        <ShoppingBagIcon size={48} style={{ color: 'var(--text-dim)', margin: '0 auto 1rem' }} />
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', color: '#fff', marginBottom: '0.5rem' }}>
          Please Log In
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Log in with your student or staff account to view your live orders and history.
        </p>
      </div>
    );
  }

  return (
    <div className="orders-container">
      <div className="orders-header-row">
        <div>
          <h2 className="orders-page-title">My Orders</h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Showing past & active orders for <strong>{user.displayName || user.username}</strong>
          </span>
        </div>

        <button
          type="button"
          onClick={loadOrders}
          className="user-profile-btn"
          style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
          title="Refresh orders"
        >
          <RefreshCwIcon size={14} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)' }}>
          Loading your orders...
        </div>
      ) : orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 1.5rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-glass)' }}>
          <ShoppingBagIcon size={44} style={{ color: 'var(--text-dim)', margin: '0 auto 1rem' }} />
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: '#fff', marginBottom: '0.35rem' }}>
            No Orders Yet Today
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Check out today's delicious canteen specials and place your first order!
          </p>
        </div>
      ) : (
        <div>
          {orders.map((order) => {
            const createdAtMs = new Date(order.createdAt).getTime();
            const elapsedSeconds = Math.floor((currentTime - createdAtMs) / 1000);
            const gracePeriodSeconds = 5 * 60; // 5 mins
            const remainingSeconds = Math.max(0, gracePeriodSeconds - elapsedSeconds);
            const canCancel = order.status === 'PLACED' && remainingSeconds > 0;
            const progressPercent = Math.max(0, Math.min(100, (remainingSeconds / gracePeriodSeconds) * 100));

            const mins = Math.floor(remainingSeconds / 60);
            const secs = remainingSeconds % 60;

            return (
              <div className="order-card" key={order.id}>
                <div className="order-card-top">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span className="order-item-title">{order.itemName}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                        Order #{order.id}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      Quantity: <strong>{order.quantity}</strong> • Total: <strong style={{ color: 'var(--accent-amber)' }}>₹{Number(order.totalPrice).toFixed(2)}</strong>
                    </div>
                  </div>

                  <span className={`order-status-badge ${order.status.toLowerCase()}`}>
                    {order.status === 'PLACED' ? '● Placed' : '✕ Cancelled'}
                  </span>
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  Placed at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>

                {/* 5-minute cancellation live countdown */}
                {order.status === 'PLACED' && (
                  <div className="cancellation-countdown-box">
                    <div className="countdown-top-row">
                      <div className="countdown-text">
                        <ClockIcon size={14} />
                        {remainingSeconds > 0 ? (
                          <span>Cancellation Window Active</span>
                        ) : (
                          <span style={{ color: 'var(--text-dim)' }}>Grace Window Expired</span>
                        )}
                      </div>
                      <div className="countdown-timer-val">
                        {remainingSeconds > 0 ? `${mins}m ${secs < 10 ? '0' : ''}${secs}s` : 'Closed'}
                      </div>
                    </div>

                    <div className="countdown-progress-track">
                      <div className="countdown-progress-fill" style={{ width: `${progressPercent}%` }} />
                    </div>
                  </div>
                )}

                <div className="order-card-actions">
                  <div>
                    {canCancel && (
                      <button
                        type="button"
                        className="cancel-order-btn"
                        onClick={() => handleCancel(order.id)}
                        disabled={cancellingId === order.id}
                      >
                        {cancellingId === order.id ? 'Cancelling...' : 'Cancel Order (Restore Stock)'}
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    className="rate-order-btn"
                    onClick={() => onOpenRating(order.menuItemId, order.id, order.itemName)}
                  >
                    <StarIcon size={14} filled={true} />
                    Rate This Dish
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
