import { getCart, clearCart } from "./cart.js";

// In-memory order store. Swap for a database without touching the routes.
const orders = new Map();
let sequence = 1000;

const TAX_RATE = 0.08; // 8% sales tax
const FLAT_SHIPPING = 5.0;
const FREE_SHIPPING_THRESHOLD = 75.0;

// Compute the money breakdown for a given subtotal.
export function priceBreakdown(subtotal) {
  const shipping =
    subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING;
  const tax = round(subtotal * TAX_RATE);
  const total = round(subtotal + tax + shipping);
  return { subtotal: round(subtotal), tax, shipping, total };
}

function validateCustomer(customer) {
  if (!customer || typeof customer !== "object") {
    return "Customer details are required";
  }
  const name = String(customer.name ?? "").trim();
  const email = String(customer.email ?? "").trim();
  const address = String(customer.address ?? "").trim();

  if (!name) return "Name is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "A valid email is required";
  if (!address) return "Shipping address is required";
  return null;
}

// Turn the current cart into a confirmed order, then empty the cart.
// Returns { ok, order } or { ok: false, error }.
export function createOrder(customer) {
  const error = validateCustomer(customer);
  if (error) return { ok: false, error };

  const cart = getCart();
  if (cart.items.length === 0) {
    return { ok: false, error: "Cart is empty" };
  }

  const pricing = priceBreakdown(cart.subtotal);
  const id = `ORD-${sequence++}`;
  const order = {
    id,
    createdAt: new Date().toISOString(),
    status: "confirmed",
    customer: {
      name: customer.name.trim(),
      email: customer.email.trim(),
      address: customer.address.trim(),
    },
    items: cart.items,
    totalQuantity: cart.totalQuantity,
    ...pricing,
  };

  orders.set(id, order);
  clearCart();
  return { ok: true, order };
}

export function getOrder(id) {
  return orders.get(id) ?? null;
}

function round(value) {
  return Math.round(value * 100) / 100;
}
