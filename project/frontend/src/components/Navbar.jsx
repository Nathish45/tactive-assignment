import React, { useState, useEffect } from 'react';
import {
  UtensilsIcon,
  ClockIcon,
  ShoppingBagIcon,
  StarIcon,
  UserIcon,
  LogInIcon,
  LogOutIcon,
  ShieldCheckIcon,
} from './Icons';

export const Navbar = ({
  activeTab,
  setActiveTab,
  user,
  ordersCount,
  onOpenAuth,
  onLogout,
  cutoffTimeStr = '10:30:00',
  onCutoffStatusChange,
  portalMode,
  onTogglePortalMode,
}) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [cutoffStatus, setCutoffStatus] = useState('open'); // 'open' | 'urgent' | 'closed'

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const [hours, minutes, seconds] = cutoffTimeStr.split(':').map(Number);
      const cutoff = new Date();
      cutoff.setHours(hours, minutes, seconds || 0, 0);

      const diffMs = cutoff.getTime() - now.getTime();

      if (diffMs <= 0) {
        setTimeLeft('Closed for Today');
        setCutoffStatus('closed');
        if (onCutoffStatusChange) onCutoffStatusChange(true);
      } else {
        const diffSecs = Math.floor(diffMs / 1000);
        const h = Math.floor(diffSecs / 3600);
        const m = Math.floor((diffSecs % 3600) / 60);
        const s = diffSecs % 60;

        const formatted = h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`;
        setTimeLeft(formatted);

        if (diffSecs <= 15 * 60) {
          setCutoffStatus('urgent');
        } else {
          setCutoffStatus('open');
        }
        if (onCutoffStatusChange) onCutoffStatusChange(false);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [cutoffTimeStr]);

  return (
    <header className="navbar">
      <div
        className="brand-wrapper"
        onClick={() => {
          if (portalMode !== 'customer') onTogglePortalMode('customer');
          setActiveTab('menu');
        }}
      >
        <div className="brand-icon">
          <UtensilsIcon size={22} />
        </div>
        <div>
          <div className="brand-title">CAMPUS BITES</div>
          <div className="brand-subtitle">Smart Canteen System</div>
        </div>
      </div>

      {/* Live Daily Cutoff Timer Widget */}
      <div className="cutoff-widget">
        <span className={`cutoff-badge ${cutoffStatus}`}>
          <ClockIcon size={13} />
          {cutoffStatus === 'open' ? 'Ordering Open' : cutoffStatus === 'urgent' ? 'Closing Soon' : 'Cutoff Passed'}
        </span>
        <span className="cutoff-time">{timeLeft}</span>
      </div>

      {/* Nav Tabs & User Profile */}
      <div className="nav-actions">
        {portalMode === 'customer' ? (
          <>
            <button
              type="button"
              className={`nav-tab-btn ${activeTab === 'menu' ? 'active' : ''}`}
              onClick={() => setActiveTab('menu')}
            >
              <UtensilsIcon size={16} />
              Menu &amp; Specials
            </button>

            <button
              type="button"
              className={`nav-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              <ShoppingBagIcon size={16} />
              My Orders
              {ordersCount > 0 && <span className="orders-badge">{ordersCount}</span>}
            </button>

            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div className="user-profile-btn" title={`Signed in as ${user.displayName || user.username}`}>
                  <div className="user-avatar">
                    {(user.displayName || user.username).charAt(0).toUpperCase()}
                  </div>
                  <span>{user.displayName || user.username}</span>
                </div>

                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={onLogout}
                  title="Log out of account"
                  style={{ width: '34px', height: '34px' }}
                >
                  <LogOutIcon size={16} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="user-profile-btn"
                onClick={onOpenAuth}
                style={{ background: 'var(--accent-amber)', color: '#0f172a', fontWeight: 700, borderColor: 'transparent' }}
              >
                <LogInIcon size={16} />
                Sign In
              </button>
            )}

            <button
              type="button"
              className="user-profile-btn"
              onClick={() => onTogglePortalMode('admin')}
              style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', borderColor: 'rgba(99, 102, 241, 0.3)', fontWeight: 700 }}
              title="Switch to Admin Kitchen Portal"
            >
              <ShieldCheckIcon size={15} />
              Admin Portal
            </button>
          </>
        ) : (
          <button
            type="button"
            className="user-profile-btn"
            onClick={() => onTogglePortalMode('customer')}
            style={{ background: 'var(--accent-amber)', color: '#0f172a', fontWeight: 700, borderColor: 'transparent' }}
          >
            <UtensilsIcon size={16} />
            Customer View
          </button>
        )}
      </div>
    </header>
  );
};
