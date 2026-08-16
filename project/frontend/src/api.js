// API Client for Canteen Ordering Backend
const API_BASE_URL = 'http://localhost:8080';

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('canteen_token') || null;
    this.user = JSON.parse(localStorage.getItem('canteen_user') || 'null');
    this.adminToken = localStorage.getItem('canteen_admin_token') || null;
    this.adminUser = JSON.parse(localStorage.getItem('canteen_admin_user') || 'null');
  }

  setAuth(token, user) {
    this.token = token;
    this.user = user;
    if (token) {
      localStorage.setItem('canteen_token', token);
      localStorage.setItem('canteen_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('canteen_token');
      localStorage.removeItem('canteen_user');
    }
  }

  setAdminAuth(token, user) {
    this.adminToken = token;
    this.adminUser = user;
    if (token) {
      localStorage.setItem('canteen_admin_token', token);
      localStorage.setItem('canteen_admin_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('canteen_admin_token');
      localStorage.removeItem('canteen_admin_user');
    }
  }

  logout() {
    this.setAuth(null, null);
  }

  adminLogout() {
    this.setAdminAuth(null, null);
  }

  getHeaders(isAdmin = false) {
    const headers = {
      'Content-Type': 'application/json',
    };
    const activeToken = isAdmin ? this.adminToken : this.token;
    if (activeToken) {
      headers['Authorization'] = `Bearer ${activeToken}`;
    }
    return headers;
  }

  async request(endpoint, options = {}, isAdmin = false) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      ...this.getHeaders(isAdmin),
      ...(options.headers || {}),
    };

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const errorMessage = data?.message || data?.error || `Request failed with status ${response.status}`;
        const error = new Error(errorMessage);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (err) {
      if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
        throw new Error('Unable to connect to the Canteen Backend server. Ensure backend is running on port 8080.');
      }
      throw err;
    }
  }

  // Auth APIs for regular users
  auth = {
    login: async (username, password) => {
      const data = await this.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      const user = {
        id: data.userId,
        username: data.username,
        displayName: data.displayName || username,
        role: data.role || 'USER',
      };
      this.setAuth(data.token, user);
      return { token: data.token, user };
    },

    register: async (username, password) => {
      const data = await this.request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      const user = {
        id: data.userId,
        username: data.username,
        displayName: data.displayName || username,
        role: data.role || 'USER',
      };
      this.setAuth(data.token, user);
      return { token: data.token, user };
    },

    getMe: async () => {
      return this.request('/auth/me');
    },
  };

  // Menu APIs (Public)
  menu = {
    getAll: async () => {
      return this.request('/menu');
    },

    getById: async (id) => {
      return this.request(`/menu/${id}`);
    },
  };

  // Orders APIs (Authenticated Customer)
  orders = {
    place: async (menuItemId, quantity) => {
      return this.request('/orders', {
        method: 'POST',
        body: JSON.stringify({ menuItemId, quantity }),
      });
    },

    cancel: async (orderId) => {
      return this.request(`/orders/${orderId}`, {
        method: 'DELETE',
      });
    },

    getMyOrders: async () => {
      return this.request('/orders/mine');
    },
  };

  // Ratings APIs (Authenticated Customer & Public)
  ratings = {
    submit: async (menuItemId, rating, comment = '', orderId = null) => {
      return this.request('/ratings', {
        method: 'POST',
        body: JSON.stringify({
          menuItemId,
          rating,
          comment,
          orderId,
        }),
      });
    },

    getByMenu: async (menuItemId) => {
      return this.request(`/ratings/menu/${menuItemId}`);
    },

    getSummary: async (menuItemId) => {
      return this.request(`/ratings/summary/${menuItemId}`);
    },

    getMyRatings: async () => {
      return this.request('/ratings/mine');
    },
  };

  // Dedicated Admin APIs (ROLE_ADMIN required)
  admin = {
    login: async (username, password) => {
      const data = await this.request('/auth/admin-login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      const adminUser = {
        id: data.userId,
        username: data.username,
        displayName: data.displayName || username,
        role: data.role,
      };
      this.setAdminAuth(data.token, adminUser);
      return { token: data.token, user: adminUser };
    },

    getStats: async () => {
      return this.request('/admin/stats', {}, true);
    },

    getOrders: async () => {
      return this.request('/admin/orders', {}, true);
    },

    updateOrderStatus: async (orderId, status) => {
      return this.request(`/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }, true);
    },

    addMenuItem: async (itemData) => {
      return this.request('/admin/menu', {
        method: 'POST',
        body: JSON.stringify(itemData),
      }, true);
    },

    updateMenuItem: async (id, itemData) => {
      return this.request(`/admin/menu/${id}`, {
        method: 'PUT',
        body: JSON.stringify(itemData),
      }, true);
    },

    updateStock: async (id, stockCount) => {
      return this.request(`/admin/menu/${id}/stock`, {
        method: 'PATCH',
        body: JSON.stringify({ stockCount }),
      }, true);
    },

    deleteMenuItem: async (id) => {
      return this.request(`/admin/menu/${id}`, {
        method: 'DELETE',
      }, true);
    },

    getRatings: async () => {
      return this.request('/admin/ratings', {}, true);
    },

    deleteRating: async (id) => {
      return this.request(`/admin/ratings/${id}`, {
        method: 'DELETE',
      }, true);
    },
  };
}

export const api = new ApiClient();
