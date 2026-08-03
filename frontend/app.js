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
  checkoutSummary: () => request("/checkout/summary"),
  checkout: (customer) =>
    request("/checkout", {
      method: "POST",
      body: JSON.stringify({ customer }),
    }),
};

// --- DOM references --------------------------------------------------------

const els = {
  products: document.getElementById("products"),
  cartCount: document.getElementById("cart-count"),
  cartItems: document.getElementById("cart-items"),
  cartSubtotal: document.getElementById("cart-subtotal"),
  drawer: document.getElementById("cart-drawer"),
  drawerTitle: document.getElementById("drawer-title"),
  overlay: document.getElementById("overlay"),
  toast: document.getElementById("toast"),
  // Views
  viewCart: document.getElementById("view-cart"),
  viewCheckout: document.getElementById("view-checkout"),
  viewConfirmation: document.getElementById("view-confirmation"),
  // Checkout form + summary
  checkoutForm: document.getElementById("checkout-form"),
  checkoutError: document.getElementById("checkout-error"),
  sumSubtotal: document.getElementById("sum-subtotal"),
  sumTax: document.getElementById("sum-tax"),
  sumShipping: document.getElementById("sum-shipping"),
  sumTotal: document.getElementById("sum-total"),
  // Confirmation
  confOrderId: document.getElementById("conf-order-id"),
  confSummary: document.getElementById("conf-summary"),
  confEmail: document.getElementById("conf-email"),
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

// --- Drawer + views --------------------------------------------------------

const TITLES = {
  cart: "Your Cart",
  checkout: "Checkout",
  confirmation: "Order Confirmed",
};

// Show one of the three drawer views: "cart", "checkout", "confirmation".
function showView(name) {
  els.viewCart.hidden = name !== "cart";
  els.viewCheckout.hidden = name !== "checkout";
  els.viewConfirmation.hidden = name !== "confirmation";
  els.drawerTitle.textContent = TITLES[name];
}

function openCart() {
  showView("cart");
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

// --- Checkout --------------------------------------------------------------

// Open the checkout form, prefilled with the current price breakdown.
async function goToCheckout() {
  const summary = await api.checkoutSummary();
  if (summary.items.length === 0) {
    showToast("Your cart is empty");
    return;
  }
  els.sumSubtotal.textContent = money(summary.subtotal);
  els.sumTax.textContent = money(summary.tax);
  els.sumShipping.textContent =
    summary.shipping === 0 ? "Free" : money(summary.shipping);
  els.sumTotal.textContent = money(summary.total);
  els.checkoutError.hidden = true;
  showView("checkout");
}

async function submitCheckout(event) {
  event.preventDefault();
  const data = new FormData(els.checkoutForm);
  const customer = {
    name: data.get("name").trim(),
    email: data.get("email").trim(),
    address: data.get("address").trim(),
  };

  const submitBtn = document.getElementById("place-order");
  submitBtn.disabled = true;
  try {
    const order = await api.checkout(customer);
    showConfirmation(order);
    els.checkoutForm.reset();
    await refreshCart(); // cart is now empty on the server
  } catch (err) {
    els.checkoutError.textContent = err.message;
    els.checkoutError.hidden = false;
  } finally {
    submitBtn.disabled = false;
  }
}

function showConfirmation(order) {
  els.confOrderId.textContent = order.id;
  els.confSummary.textContent = `${order.totalQuantity} item${
    order.totalQuantity === 1 ? "" : "s"
  } · ${money(order.total)} total`;
  els.confEmail.textContent = `A receipt is on its way to ${order.customer.email}.`;
  showView("confirmation");
}

// --- Event wiring ----------------------------------------------------------

function wireEvents() {
  document.getElementById("cart-toggle").addEventListener("click", openCart);
  document.getElementById("cart-close").addEventListener("click", closeCart);
  els.overlay.addEventListener("click", closeCart);
  document.getElementById("clear-cart").addEventListener("click", handleClear);

  // Checkout flow navigation.
  document
    .getElementById("go-checkout")
    .addEventListener("click", () =>
      goToCheckout().catch((err) => showToast(err.message))
    );
  document
    .getElementById("back-to-cart")
    .addEventListener("click", () => showView("cart"));
  document
    .getElementById("keep-shopping")
    .addEventListener("click", () => showView("cart"));
  els.checkoutForm.addEventListener("submit", submitCheckout);

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
