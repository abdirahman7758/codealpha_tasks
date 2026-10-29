/**
 * Velarina Atelier Order Processing Controller
 */

function initCheckout() {
  const items = Cart.getItems();
  if (items.length === 0) {
    window.location.href = '/cart.html';
    return;
  }

  renderCheckoutSummary();
  prefillUserData();
  setupFormListener();
}

function renderCheckoutSummary() {
  const container = document.getElementById('checkout-items-list');
  const subtotalEl = document.getElementById('checkout-subtotal');
  const shippingEl = document.getElementById('checkout-shipping');
  const taxEl = document.getElementById('checkout-tax');
  const totalEl = document.getElementById('checkout-total');

  if (!container) return;

  const items = Cart.getItems();
  const subtotal = Cart.getSubtotal();
  const shipping = subtotal >= 500 ? 0 : 25;
  const tax = Math.round(subtotal * 0.08);
  const total = subtotal + shipping + tax;

  container.innerHTML = items.map(item => `
    <div class="order-review-row">
      <div class="order-review-thumb">
        <img src="${item.image}" alt="${item.name}">
      </div>
      <div>
        <div style="font-size: 0.88rem; font-weight: 500;">${item.name}</div>
        <div style="font-size: 0.78rem; color: var(--text-muted);">Quantity: ${item.quantity}</div>
      </div>
      <div style="font-size: 0.88rem; font-weight: 600;">
        $${(item.price * item.quantity).toLocaleString()}
      </div>
    </div>
  `).join('');

  if (subtotalEl) subtotalEl.textContent = `$${subtotal.toLocaleString()}`;
  if (shippingEl) shippingEl.textContent = shipping === 0 ? 'Complimentary' : `$${shipping}`;
  if (taxEl) taxEl.textContent = `$${tax.toLocaleString()}`;
  if (totalEl) totalEl.textContent = `$${total.toLocaleString()}`;
}

function prefillUserData() {
  const user = Auth.getUser();
  if (!user) return;

  const emailInput = document.getElementById('checkout-email');
  const fnameInput = document.getElementById('checkout-first-name');
  const lnameInput = document.getElementById('checkout-last-name');

  if (emailInput && user.email) emailInput.value = user.email;
  if (fnameInput && user.firstName) fnameInput.value = user.firstName;
  if (lnameInput && user.lastName) lnameInput.value = user.lastName;
}

function setupFormListener() {
  const form = document.getElementById('checkout-form');
  const errorEl = document.getElementById('checkout-error');
  const submitBtn = document.getElementById('place-order-btn');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (errorEl) {
      errorEl.style.display = 'none';
      errorEl.textContent = '';
    }

    const items = Cart.getItems();
    if (items.length === 0) {
      alert('Your bag is empty.');
      window.location.href = '/products.html';
      return;
    }

    const user = Auth.getUser();

    const customer = {
      userId: user ? user.id : null,
      email: document.getElementById('checkout-email').value.trim(),
      firstName: document.getElementById('checkout-first-name').value.trim(),
      lastName: document.getElementById('checkout-last-name').value.trim(),
      phone: document.getElementById('checkout-phone').value.trim()
    };

    const shippingAddress = {
      addressLine1: document.getElementById('checkout-address1').value.trim(),
      addressLine2: (document.getElementById('checkout-address2') ? document.getElementById('checkout-address2').value.trim() : ''),
      city: document.getElementById('checkout-city').value.trim(),
      state: document.getElementById('checkout-state').value.trim(),
      postalCode: document.getElementById('checkout-postal').value.trim(),
      country: document.getElementById('checkout-country').value.trim()
    };

    const paymentMethod = document.querySelector('input[name="payment_method"]:checked')?.value || 'Credit / Debit Card';

    submitBtn.disabled = true;
    submitBtn.textContent = 'Processing Order...';

    try {
      const res = await API.createOrder({
        customer,
        shippingAddress,
        items,
        paymentMethod
      });

      if (res && res.order) {
        Cart.clearCart();
        window.location.href = `/order-confirmation.html?id=${encodeURIComponent(res.order.orderNumber)}`;
      } else {
        throw new Error('Order creation could not be completed.');
      }
    } catch (err) {
      if (errorEl) {
        errorEl.textContent = err.message || 'An error occurred while placing your order. Please check your information.';
        errorEl.style.display = 'block';
      }
      submitBtn.disabled = false;
      submitBtn.textContent = 'Complete Order';
    }
  });
}

window.initCheckout = initCheckout;

