/**
 * Velarina Atelier API Client
 */

const API = {
  baseUrl: '',

  async request(endpoint, options = {}) {
    const token = localStorage.getItem('velarina_token');
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (err) {
      console.error(`API Error on ${endpoint}:`, err.message);
      throw err;
    }
  },

  // Products
  async getProducts(category = '', search = '') {
    const params = new URLSearchParams();
    if (category && category !== 'All') params.append('category', category);
    if (search) params.append('search', search);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/api/products${queryString}`);
  },

  async getProduct(id) {
    return this.request(`/api/products/${encodeURIComponent(id)}`);
  },

  // Auth
  async register(data) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async login(data) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async getProfile() {
    return this.request('/api/auth/me');
  },

  async logout() {
    try {
      await this.request('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      // Ignore if session already invalid
    }
  },

  // Orders
  async createOrder(orderPayload) {
    return this.request('/api/orders', {
      method: 'POST',
      body: JSON.stringify(orderPayload)
    });
  },

  async getOrder(id) {
    return this.request(`/api/orders/${encodeURIComponent(id)}`);
  },

  async getUserOrders(userId) {
    return this.request(`/api/orders/user/${encodeURIComponent(userId)}`);
  }
};

window.API = API;

