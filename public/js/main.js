/**
 * Velarina Atelier Global Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  // Update header badges and state
  if (window.Cart) {
    Cart.updateBadge();
  }
  if (window.Auth) {
    Auth.updateHeader();
  }

  // Cart drawer open button in header
  const cartButtons = document.querySelectorAll('.header-cart-btn');
  cartButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (window.Cart) Cart.openDrawer();
    });
  });

  // Mobile menu toggle
  const mobileToggle = document.getElementById('mobile-menu-toggle');
  const navLinks = document.getElementById('main-nav-links');
  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      navLinks.classList.toggle('open');
    });
  }

  // Close cart drawer on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && window.Cart) {
      Cart.closeDrawer();
    }
  });
});

