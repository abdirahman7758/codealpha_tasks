/**
 * Velarina Atelier Product Detail Controller
 */

let currentProduct = null;
let selectedQuantity = 1;

async function initProductDetail() {
  const params = new URLSearchParams(window.location.search);
  const productId = params.get('id');

  const container = document.getElementById('product-detail-container');
  if (!container) return;

  if (!productId) {
    container.innerHTML = `
      <div style="text-align: center; padding: 80px 0;">
        <h2 style="font-family: var(--font-serif); font-size: 1.8rem; margin-bottom: 12px;">Product Not Found</h2>
        <p style="color: var(--text-muted); margin-bottom: 24px;">Please select an item from our collection.</p>
        <a href="/products.html" class="btn btn-primary">Return to Catalog</a>
      </div>
    `;
    return;
  }

  container.innerHTML = '<div style="padding: 80px; text-align: center; color: var(--text-muted);">Loading specifications...</div>';

  try {
    const res = await API.getProduct(productId);
    currentProduct = res.product;
    renderProductDetail(currentProduct, container);
  } catch (err) {
    container.innerHTML = `
      <div style="text-align: center; padding: 80px 0;">
        <h2 style="font-family: var(--font-serif); font-size: 1.8rem; margin-bottom: 12px;">Product Unavailable</h2>
        <p style="color: var(--text-muted); margin-bottom: 24px;">This atelier piece could not be retrieved.</p>
        <a href="/products.html" class="btn btn-primary">Browse All Pieces</a>
      </div>
    `;
  }
}

function renderProductDetail(product, container) {
  document.title = `${product.name} | Velarina`;

  let specsRows = '';
  if (product.details) {
    const detailKeys = [
      { key: 'materials', label: 'Materials' },
      { key: 'origin', label: 'Origin' },
      { key: 'dimensions', label: 'Dimensions' },
      { key: 'capacity', label: 'Capacity' },
      { key: 'sizing', label: 'Fit & Sizing' },
      { key: 'weight', label: 'Weight' },
      { key: 'care', label: 'Care Instructions' }
    ];

    detailKeys.forEach(item => {
      if (product.details[item.key]) {
        specsRows += `
          <tr>
            <th>${item.label}</th>
            <td>${product.details[item.key]}</td>
          </tr>
        `;
      }
    });
  }

  container.innerHTML = `
    <div class="product-detail-layout">
      <div class="product-gallery">
        <div class="main-image-frame">
          <img src="${product.image}" alt="${product.name}">
        </div>
      </div>
      <div class="product-info-panel">
        <div class="product-breadcrumb">
          <a href="/index.html">Home</a> / <a href="/products.html">Catalog</a> / ${product.category}
        </div>
        <h1 class="product-detail-title">${product.name}</h1>
        <div class="product-detail-price">$${product.price.toLocaleString()} USD</div>
        <p class="product-detail-description">${product.description || product.shortDescription}</p>

        <div class="add-to-cart-box">
          <div class="qty-control">
            <button type="button" class="qty-btn" onclick="adjustDetailQty(-1)" aria-label="Decrease quantity">-</button>
            <input type="text" id="detail-qty-input" class="qty-input" value="1" readonly>
            <button type="button" class="qty-btn" onclick="adjustDetailQty(1)" aria-label="Increase quantity">+</button>
          </div>
          <button type="button" class="btn btn-primary btn-block" onclick="handleDetailAddToCart()">
            Add to Bag
          </button>
        </div>

        <table class="product-specs-table">
          <tbody>
            ${specsRows}
            <tr>
              <th>Availability</th>
              <td>${product.inStock ? 'In stock and prepared for dispatch' : 'Currently made to order'}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function adjustDetailQty(delta) {
  selectedQuantity = Math.max(1, selectedQuantity + delta);
  const input = document.getElementById('detail-qty-input');
  if (input) input.value = selectedQuantity;
}

function handleDetailAddToCart() {
  if (currentProduct && window.Cart) {
    Cart.addItem(currentProduct, selectedQuantity);
  }
}

window.initProductDetail = initProductDetail;
window.adjustDetailQty = adjustDetailQty;
window.handleDetailAddToCart = handleDetailAddToCart;

