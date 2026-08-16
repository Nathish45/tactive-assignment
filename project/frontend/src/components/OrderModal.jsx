import React, { useState } from 'react';
import { ShoppingBagIcon, XIcon, PlusIcon, MinusIcon, AlertCircleIcon, ShieldCheckIcon } from './Icons';
import { api } from '../api';

export const OrderModal = ({ item, user, onClose, onOrderPlaced, showToast, isCutoffPassed }) => {
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const maxAllowed = Math.min(item.stockCount, item.dailyLimitPerPerson);
  const totalPrice = (Number(item.price) * quantity).toFixed(2);

  const handleIncrement = () => {
    if (quantity < maxAllowed) {
      setQuantity((prev) => prev + 1);
    } else if (quantity >= item.stockCount) {
      showToast(`Only ${item.stockCount} in stock!`, 'info');
    } else {
      showToast(`Daily limit of ${item.dailyLimitPerPerson} per person.`, 'info');
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  const handlePlaceOrder = async () => {
    if (!user) {
      showToast('Please log in first to place your order.', 'error');
      return;
    }

    if (isCutoffPassed) {
      showToast('Ordering is closed for today. Cutoff time has passed.', 'error');
      return;
    }

    if (item.stockCount <= 0) {
      showToast('Sorry, this item is out of stock.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const order = await api.orders.place(item.id, quantity);
      showToast(`Order placed successfully! Order #${order.id} for ${quantity}x ${item.name}`, 'success');
      if (onOrderPlaced) {
        onOrderPlaced(order);
      }
      onClose();
    } catch (err) {
      showToast(err.message || 'Failed to place order. Please retry.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Confirm Order</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--accent-amber)', fontWeight: 600 }}>
              Campus Canteen Fresh Preparation
            </span>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <XIcon size={18} />
          </button>
        </div>

        <div className="modal-content">
          <div className="order-summary-box">
            <div className="order-dish-category">{item.category || 'Special'}</div>
            <div className="order-dish-title">{item.name}</div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              {item.description || 'Piping hot fresh preparation served from the counter.'}
            </p>
          </div>

          {/* Stepper */}
          <div className="qty-stepper-box">
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>Select Quantity</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                Max {item.dailyLimitPerPerson}/day • {item.stockCount} remaining
              </div>
            </div>

            <div className="qty-controls">
              <button
                type="button"
                className="stepper-btn"
                onClick={handleDecrement}
                disabled={quantity <= 1 || submitting}
              >
                <MinusIcon size={16} />
              </button>

              <span className="qty-count">{quantity}</span>

              <button
                type="button"
                className="stepper-btn"
                onClick={handleIncrement}
                disabled={quantity >= maxAllowed || submitting}
              >
                <PlusIcon size={16} />
              </button>
            </div>
          </div>

          {/* Bill Breakdown */}
          <div className="order-bill-breakdown">
            <div className="bill-row">
              <span>Price per unit</span>
              <span>₹{Number(item.price).toFixed(2)}</span>
            </div>
            <div className="bill-row">
              <span>Quantity</span>
              <span>{quantity}</span>
            </div>
            <div className="bill-row">
              <span>Cancellation Window</span>
              <span style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>5 Minutes Grace</span>
            </div>
            <div className="bill-row total">
              <span>Total Payable</span>
              <span className="bill-total-price">₹{totalPrice}</span>
            </div>
          </div>

          {/* Order notes */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            <AlertCircleIcon size={16} style={{ color: 'var(--accent-amber)', flexShrink: 0 }} />
            <span>Orders can be cancelled within 5 minutes of placement with full stock restoration.</span>
          </div>

          <button
            type="button"
            className="place-order-confirm-btn"
            onClick={handlePlaceOrder}
            disabled={submitting || maxAllowed < 1 || isCutoffPassed}
          >
            <ShoppingBagIcon size={18} />
            {submitting ? 'Placing Order...' : isCutoffPassed ? 'Ordering Closed' : `Confirm Order • ₹${totalPrice}`}
          </button>
        </div>
      </div>
    </div>
  );
};
