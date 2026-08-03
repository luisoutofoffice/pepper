const API = "/api";

// --- API helpers -----------------------------------------------------------

async function request(path, options) {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

const api = {
  getProducts: () => request("/products"),
  getCart: () => request("/cart"),
  addItem: (productId, quantity = 1) =>
    request("/cart/items", {
      method: "POST",
      body: JSON.stringify({ productId, quantity }),
    }),
  setQuantity: (productId, quantity) =>
    request(`/cart/items/${productId}`, {
      method: "PATCH",
      body: JSON.stringify({ quantity }),
    }),
  removeItem: (productId) =>
    request(`/cart/items/${productId}`, { method: "DELETE" }),
  clearCart: () => request("/cart", { method: "DELETE" }),
};

// --- DOM references --------------------------------------------------------

const els = {
  products: document.getElementById("products"),
  cartCount: document.getElementById("cart-count"),
  cartItems: document.getElementById("cart-items"),
  cartSubtotal: document.getElementById("cart-subtotal"),
  drawer: document.getElementById("cart-drawer"),
  overlay: document.getElementById("overlay"),
  toast: document.getElementById("toast"),
};

const money = (n) => `$${n.toFixed(2)}`;

// --- Rendering -------------------------------------------------------------

function renderProducts(products) {
  els.products.innerHTML = products
    .map(
      (p) => `
      <article class="product-card">
        <img src="${p.image}" alt="${p.name}" loading="lazy" />
        <div class="product-body">
          <h3>${p.name}</h3>
          <p>${p.description}</p>
          <span class="price">${money(p.price)}</span>
          <button class="primary-btn" data-add="${p.id}">Add to cart</button>
        </div>
      </article>`
    )
    .join("");
}

function renderCart(cart) {
  els.cartCount.textContent = cart.totalQuantity;
  els.cartSubtotal.textContent = money(cart.subtotal);

  if (cart.items.length === 0) {
    els.cartItems.innerHTML = `<p class="empty-cart">Your cart is empty.</p>`;
    return;
  }

  els.cartItems.innerHTML = cart.items
    .map(
      (item) => `
      <div class="cart-line">
        <img src="${item.image}" alt="${item.name}" />
        <div>
          <div class="name">${item.name}</div>
          <div class="line-price">${money(item.price)} each · ${money(
        item.lineTotal
      )}</div>
          <div class="qty-control">
            <button data-dec="${item.productId}" aria-label="Decrease">−</button>
            <span>${item.quantity}</span>
            <button data-inc="${item.productId}" aria-label="Increase">+</button>
          </div>
          <button class="remove-link" data-remove="${item.productId}">Remove</button>
        </div>
      </div>`
    )
    .join("");
}

// --- Toast -----------------------------------------------------------------

let toastTimer;
function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => els.toast.classList.remove("show"), 1800);
}

// --- Drawer ----------------------------------------------------------------

function openCart() {
  els.drawer.classList.add("open");
  els.drawer.setAttribute("aria-hidden", "false");
  els.overlay.hidden = false;
}

function closeCart() {
  els.drawer.classList.remove("open");
  els.drawer.setAttribute("aria-hidden", "true");
  els.overlay.hidden = true;
}

// --- Actions ---------------------------------------------------------------

async function refreshCart() {
  const cart = await api.getCart();
  renderCart(cart);
}

async function handleAdd(productId) {
  const cart = await api.addItem(productId);
  renderCart(cart);
  showToast("Added to cart");
}

async function handleInc(productId) {
  const cart = await api.getCart();
  const line = cart.items.find((i) => i.productId === productId);
  const updated = await api.setQuantity(productId, (line?.quantity ?? 0) + 1);
  renderCart(updated);
}

async function handleDec(productId) {
  const cart = await api.getCart();
  const line = cart.items.find((i) => i.productId === productId);
  const next = (line?.quantity ?? 1) - 1;
  const updated = await api.setQuantity(productId, Math.max(next, 0));
  renderCart(updated);
}

async function handleRemove(productId) {
  const cart = await api.removeItem(productId);
  renderCart(cart);
}

async function handleClear() {
  const cart = await api.clearCart();
  renderCart(cart);
}

// --- Event wiring ----------------------------------------------------------

function wireEvents() {
  document.getElementById("cart-toggle").addEventListener("click", openCart);
  document.getElementById("cart-close").addEventListener("click", closeCart);
  els.overlay.addEventListener("click", closeCart);
  document.getElementById("clear-cart").addEventListener("click", handleClear);
  document.getElementById("checkout").addEventListener("click", () =>
    showToast("Checkout is a demo — thanks for shopping!")
  );

  // Delegate "Add to cart" clicks from the product grid.
  els.products.addEventListener("click", (e) => {
    const id = e.target.dataset.add;
    if (id) handleAdd(Number(id)).catch((err) => showToast(err.message));
  });

  // Delegate quantity / remove clicks inside the cart drawer.
  els.cartItems.addEventListener("click", (e) => {
    const { inc, dec, remove } = e.target.dataset;
    const run = (fn, id) => fn(Number(id)).catch((err) => showToast(err.message));
    if (inc) run(handleInc, inc);
    else if (dec) run(handleDec, dec);
    else if (remove) run(handleRemove, remove);
  });
}

// --- Boot ------------------------------------------------------------------

async function init() {
  wireEvents();
  try {
    const [products] = await Promise.all([api.getProducts(), refreshCart()]);
    renderProducts(products);
  } catch (err) {
    els.products.innerHTML = `<p class="muted">Failed to load: ${err.message}</p>`;
  }
}

init();
