import { products } from "../data/products.js";

// In-memory cart store keyed by product id -> quantity.
// Swap this module for a database-backed implementation without touching routes.
const items = new Map();

function findProduct(productId) {
  return products.find((p) => p.id === productId);
}

// Build the full cart view: line items enriched with product data plus totals.
export function getCart() {
  const lines = [];
  let subtotal = 0;
  let totalQuantity = 0;

  for (const [productId, quantity] of items) {
    const product = findProduct(productId);
    if (!product) continue;
    const lineTotal = product.price * quantity;
    subtotal += lineTotal;
    totalQuantity += quantity;
    lines.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity,
      lineTotal: round(lineTotal),
    });
  }

  lines.sort((a, b) => a.productId - b.productId);

  return {
    items: lines,
    totalQuantity,
    subtotal: round(subtotal),
  };
}

// Add `quantity` of a product to the cart. Returns { ok, error }.
export function addItem(productId, quantity = 1) {
  if (!findProduct(productId)) {
    return { ok: false, error: "Product not found" };
  }
  if (!Number.isInteger(quantity) || quantity < 1) {
    return { ok: false, error: "Quantity must be a positive integer" };
  }
  const current = items.get(productId) ?? 0;
  items.set(productId, current + quantity);
  return { ok: true };
}

// Set an exact quantity for a product. Quantity 0 removes the line.
export function setQuantity(productId, quantity) {
  if (!findProduct(productId)) {
    return { ok: false, error: "Product not found" };
  }
  if (!Number.isInteger(quantity) || quantity < 0) {
    return { ok: false, error: "Quantity must be a non-negative integer" };
  }
  if (quantity === 0) {
    items.delete(productId);
  } else {
    items.set(productId, quantity);
  }
  return { ok: true };
}

// Remove a product line entirely.
export function removeItem(productId) {
  return items.delete(productId);
}

// Empty the whole cart.
export function clearCart() {
  items.clear();
}

function round(value) {
  return Math.round(value * 100) / 100;
}
