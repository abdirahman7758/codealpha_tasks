/**
 * Velarina Atelier Account Dashboard Controller
 */

async function initAccount() {
  if (!Auth.isLoggedIn()) {
    window.location.href = '/auth.html';
    return;
  }

  const user = Auth.getUser();
  const userNameEl = document.getElementById('account-user-name');
  const userEmailEl = document.getElementById('account-user-email');
  const logoutBtn = document.getElementById('account-logout-btn');

  if (userNameEl && user) {
    userNameEl.textContent = `${user.firstName} ${user.lastName}`;
  }
  if (userEmailEl && user) {
    userEmailEl.textContent = user.email;
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      Auth.logout();
    });
  }

  await loadUserOrders(user ? user.id : null);
}

async function loadUserOrders(userId) {
  const container = document.getElementById('account-orders-container');
  if (!container) return;

  container.innerHTML = '<div style="padding: 24px 0; color: var(--text-muted);">Loading your order history...</div>';

  try {
    const res = await API.getUserOrders(userId);
    const orders = res.orders || [];

    if (orders.length === 0) {
      container.innerHTML = `
        <div style="padding: 36px; border: 1px solid var(--border-light); background: #FFFFFF; text-align: center;">
          <p style="font-family: var(--font-serif); font-size: 1.15rem; margin-bottom: 8px;">No orders found</p>
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 20px;">You have not placed any orders with Velarina yet.</p>
          <a href="/products.html" class="btn btn-secondary btn-small">Explore Collection</a>
        </div>
      `;
      return;
    }

    container.innerHTML = orders.map(order => {
      const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const itemsSummary = (order.items || []).map(item => `
        <div style="display: flex; justify-content: space-between; font-size: 0.86rem; padding: 6px 0; border-bottom: 1px solid var(--border-light);">
          <span>${item.name} (x${item.quantity})</span>
          <span style="font-weight: 500;">$${(item.price * item.quantity).toLocaleString()}</span>
        </div>
      `).join('');

      return `
        <div class="order-card">
          <div class="order-card-header">
            <div>
              <span style="font-size: 0.76rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-subtle);">Order Reference</span>
              <div style="font-family: var(--font-serif); font-size: 1.1rem; font-weight: 600;">${order.orderNumber}</div>
              <div style="font-size: 0.78rem; color: var(--text-muted);">${orderDate}</div>
            </div>
            <div style="text-align: right;">
              <span class="badge-confirmed">${order.status}</span>
              <div style="font-size: 1.1rem; font-weight: 600; margin-top: 6px;">
                $${order.pricing ? order.pricing.total.toLocaleString() : '0'} USD
              </div>
            </div>
          </div>
          <div style="margin: 12px 0;">
            ${itemsSummary}
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 0.78rem; color: var(--text-muted); padding-top: 8px;">
            <span>Delivery: ${order.shippingAddress ? `${order.shippingAddress.city}, ${order.shippingAddress.country}` : 'Provided address'}</span>
            <a href="/order-confirmation.html?id=${encodeURIComponent(order.orderNumber)}" style="text-decoration: underline;">View Order Summary</a>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    container.innerHTML = `<div style="color: var(--status-error); padding: 18px 0;">Unable to retrieve order history.</div>`;
  }
}

window.initAccount = initAccount;

