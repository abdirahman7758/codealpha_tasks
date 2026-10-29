/**
 * Velarina Atelier Shopping Bag Manager
 */

const Cart = {
  STORAGE_KEY: 'velarina_cart',

  getItems() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  saveItems(items) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
    this.updateBadge();
    this.renderDrawer();
  },

  addItem(product, quantity = 1) {
    const items = this.getItems();
    const qty = Math.max(1, parseInt(quantity, 10) || 1);
    const existingIndex = items.findIndex(item => item.id === product.id);

    if (existingIndex > -1) {
      items[existingIndex].quantity += qty;
    } else {
      items.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        category: product.category,
        quantity: qty
      });
    }

    this.saveItems(items);
    this.showToast(`Added ${product.name} to your bag`);
    this.openDrawer();
  },

  removeItem(productId) {
    const items = this.getItems().filter(item => item.id !== productId);
    this.saveItems(items);
  },

  updateQuantity(productId, delta) {
    const items = this.getItems();
    const item = items.find(i => i.id === productId);
    if (!item) return;

    item.quantity += delta;
    if (item.quantity <= 0) {
      this.removeItem(productId);
    } else {
      this.saveItems(items);
    }
  },

  clearCart() {
    localStorage.removeItem(this.STORAGE_KEY);
    this.updateBadge();
    this.renderDrawer();
  },

  getCount() {
    const items = this.getItems();
    return items.reduce((sum, item) => sum + (item.quantity || 1), 0);
  },

  getSubtotal() {
    const items = this.getItems();
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  },

  updateBadge() {
    const count = this.getCount();
    const badges = document.querySelectorAll('.cart-count-badge');
    badges.forEach(badge => {
      badge.textContent = count > 0 ? count : '';
      badge.setAttribute('data-count', count);
    });
  },

  showToast(message) {
    let toast = document.getElementById('velarina-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'velarina-toast';
      toast.className = 'toast-notice';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(this._toastTimeout);
    this._toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  },

  openDrawer() {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-overlay');
    if (drawer && overlay) {
      this.renderDrawer();
      drawer.classList.add('active');
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  },

  closeDrawer() {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-overlay');
    if (drawer && overlay) {
      drawer.classList.remove('active');
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  },

  renderDrawer() {
    const container = document.getElementById('drawer-items-list');
    const footerContainer = document.getElementById('drawer-footer-content');
    if (!container) return;

    const items = this.getItems();

    if (items.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 48px 0; color: var(--text-muted);">
          <p style="font-family: var(--font-serif); font-size: 1.2rem; margin-bottom: 8px;">Your bag is currently empty.</p>
          <p style="font-size: 0.85rem; margin-bottom: 24px;">Explore our catalog of limited production pieces.</p>
          <a href="/products.html" class="btn btn-secondary btn-small" onclick="Cart.closeDrawer()">Explore Catalog</a>
        </div>
      `;
      if (footerContainer) footerContainer.style.display = 'none';
      return;
    }

    if (footerContainer) footerContainer.style.display = 'block';

    let html = '';
    items.forEach(item => {
      const lineTotal = item.price * item.quantity;
      html += `
        <div class="cart-item-row">
          <div class="cart-item-image">
            <img src="${item.image}" alt="${item.name}">
          </div>
          <div>
            <div class="cart-item-title">${item.name}</div>
            <div class="cart-item-price">$${item.price.toLocaleString()}</div>
            <div class="cart-item-actions">
              <div class="cart-mini-qty">
                <button type="button" onclick="Cart.updateQuantity('${item.id}', -1)" aria-label="Decrease quantity">-</button>
                <span>${item.quantity}</span>
                <button type="button" onclick="Cart.updateQuantity('${item.id}', 1)" aria-label="Increase quantity">+</button>
              </div>
              <button type="button" class="remove-btn" onclick="Cart.removeItem('${item.id}')">Remove</button>
            </div>
          </div>
          <div style="font-weight: 600; font-size: 0.95rem;">
            $${lineTotal.toLocaleString()}
          </div>
        </div>
      `;
    });

    container.innerHTML = html;

    const subtotal = this.getSubtotal();
    const subtotalDisplay = document.getElementById('drawer-subtotal-display');
    if (subtotalDisplay) {
      subtotalDisplay.textContent = `$${subtotal.toLocaleString()}`;
    }
  }
};

window.Cart = Cart;

