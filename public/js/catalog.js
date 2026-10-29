/**
 * Velarina Atelier Catalog Controller
 */

let allProducts = [];
let activeCategory = 'All';
let currentSearch = '';
let currentSort = 'default';

async function initCatalog(featuredOnly = false) {
  const grid = document.getElementById('products-grid');
  if (!grid) return;

  grid.innerHTML = '<div style="padding: 40px; text-align: center; color: var(--text-muted); grid-column: 1 / -1;">Loading Velarina collection...</div>';

  try {
    const res = await API.getProducts();
    allProducts = res.products || [];

    if (featuredOnly) {
      const featured = allProducts.filter(p => p.featured);
      renderProductCards(featured, grid);
      return;
    }

    setupFilterControls();
    setupSearchInput();
    setupSortControl();
    filterAndRender();
  } catch (err) {
    grid.innerHTML = `<div style="padding: 40px; text-align: center; color: var(--status-error); grid-column: 1 / -1;">Unable to load products. Please refresh the page.</div>`;
  }
}

function setupFilterControls() {
  const filterButtons = document.querySelectorAll('.filter-pill');
  filterButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCategory = btn.getAttribute('data-category');
      filterAndRender();
    });
  });
}

function setupSearchInput() {
  const searchInput = document.getElementById('catalog-search-input');
  if (!searchInput) return;

  let debounceTimer;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      currentSearch = e.target.value.trim().toLowerCase();
      filterAndRender();
    }, 200);
  });
}

function setupSortControl() {
  const sortSelect = document.getElementById('catalog-sort-select');
  if (!sortSelect) return;

  sortSelect.addEventListener('change', (e) => {
    currentSort = e.target.value;
    filterAndRender();
  });
}

function filterAndRender() {
  const grid = document.getElementById('products-grid');
  if (!grid) return;

  let filtered = [...allProducts];

  // Category filter
  if (activeCategory && activeCategory !== 'All') {
    filtered = filtered.filter(p => p.category.toLowerCase() === activeCategory.toLowerCase());
  }

  // Search filter
  if (currentSearch) {
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(currentSearch) ||
      (p.shortDescription && p.shortDescription.toLowerCase().includes(currentSearch)) ||
      (p.category && p.category.toLowerCase().includes(currentSearch))
    );
  }

  // Sorting
  if (currentSort === 'price-asc') {
    filtered.sort((a, b) => a.price - b.price);
  } else if (currentSort === 'price-desc') {
    filtered.sort((a, b) => b.price - a.price);
  } else if (currentSort === 'name-asc') {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  }

  renderProductCards(filtered, grid);
}

function renderProductCards(products, container) {
  if (products.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 60px 0; text-align: center; color: var(--text-muted);">
        <p style="font-family: var(--font-serif); font-size: 1.25rem; margin-bottom: 8px;">No items match your criteria.</p>
        <p style="font-size: 0.88rem;">Adjust your filters or search keywords to browse other atelier pieces.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = products.map(product => `
    <article class="product-card">
      <a href="/product.html?id=${encodeURIComponent(product.id)}" class="card-image-wrap" aria-label="${product.name}">
        <img src="${product.image}" alt="${product.name}" loading="lazy">
      </a>
      <div class="card-content">
        <span class="card-category">${product.category}</span>
        <h3 class="card-title">
          <a href="/product.html?id=${encodeURIComponent(product.id)}">${product.name}</a>
        </h3>
        <p class="card-description">${product.shortDescription || ''}</p>
        <div class="card-footer">
          <span class="card-price">$${product.price.toLocaleString()}</span>
          <button type="button" class="btn btn-secondary btn-small" onclick="quickAddToCart('${product.id}')">
            Add to Bag
          </button>
        </div>
      </div>
    </article>
  `).join('');
}

function quickAddToCart(productId) {
  const prod = allProducts.find(p => p.id === productId);
  if (prod && window.Cart) {
    Cart.addItem(prod, 1);
  }
}

window.initCatalog = initCatalog;
window.quickAddToCart = quickAddToCart;

