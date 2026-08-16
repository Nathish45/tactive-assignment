import React, { useState } from 'react';
import { UserIcon, LogInIcon, XIcon, ShieldCheckIcon } from './Icons';
import { api } from '../api';

export const AuthModal = ({ onClose, onAuthSuccess, showToast }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      showToast('Please enter a username.', 'error');
      return;
    }
    if (password.length < 6) {
      showToast('Password must be at least 6 characters.', 'error');
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        const { user } = await api.auth.register(username.trim(), password);
        showToast(`Registration successful! Welcome, ${user.displayName || user.username}`, 'success');
        onAuthSuccess(user);
      } else {
        const { user } = await api.auth.login(username.trim(), password);
        showToast(`Signed in as ${user.displayName || user.username}!`, 'success');
        onAuthSuccess(user);
      }
      onClose();
    } catch (err) {
      showToast(err.message || 'Authentication failed. Please check credentials.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">{isRegister ? 'Create Canteen Account' : 'Student & Staff Sign In'}</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--accent-amber)', fontWeight: 600 }}>
              Campus Gourmet Canteen
            </span>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <XIcon size={18} />
          </button>
        </div>

        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab-btn ${!isRegister ? 'active' : ''}`}
            onClick={() => setIsRegister(false)}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${isRegister ? 'active' : ''}`}
            onClick={() => setIsRegister(true)}
          >
            Register
          </button>
        </div>

        <div className="modal-content">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                type="text"
                className="form-input"
                placeholder="Enter registered username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Enter password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                required
              />
            </div>

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
            >
              {loading ? 'Authenticating...' : isRegister ? 'Register & Sign In' : 'Sign In'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
            {isRegister ? (
              <span>Already have an account? Switch to <strong>Sign In</strong> above.</span>
            ) : (
              <span>New student or staff? Switch to <strong>Register</strong> to create an account.</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
