import express from "express";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { products } from "./data/products.js";
import {
  getCart,
  addItem,
  setQuantity,
  removeItem,
  clearCart,
} from "./store/cart.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// --- API routes -----------------------------------------------------------

// List the product catalog.
app.get("/api/products", (_req, res) => {
  res.json(products);
});

// Get the current cart with line items and totals.
app.get("/api/cart", (_req, res) => {
  res.json(getCart());
});

// Add a product to the cart: { productId, quantity? }.
app.post("/api/cart/items", (req, res) => {
  const productId = Number(req.body.productId);
  const quantity = req.body.quantity === undefined ? 1 : Number(req.body.quantity);

  const result = addItem(productId, quantity);
  if (!result.ok) {
    return res.status(400).json({ error: result.error });
  }
  res.status(201).json(getCart());
});

// Update the exact quantity of a line: { quantity }. Zero removes it.
app.patch("/api/cart/items/:productId", (req, res) => {
  const productId = Number(req.params.productId);
  const quantity = Number(req.body.quantity);

  const result = setQuantity(productId, quantity);
  if (!result.ok) {
    return res.status(400).json({ error: result.error });
  }
  res.json(getCart());
});

// Remove a single line from the cart.
app.delete("/api/cart/items/:productId", (req, res) => {
  const productId = Number(req.params.productId);
  removeItem(productId);
  res.json(getCart());
});

// Empty the entire cart.
app.delete("/api/cart", (_req, res) => {
  clearCart();
  res.json(getCart());
});

// --- Static frontend -------------------------------------------------------

const frontendDir = path.join(__dirname, "..", "..", "frontend");
app.use(express.static(frontendDir));

app.listen(PORT, () => {
  console.log(`Cart app running at http://localhost:${PORT}`);
});
