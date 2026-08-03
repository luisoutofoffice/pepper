# Pepper Cart App

A small full-stack shopping cart demo: an Express REST API backend and a
vanilla-JavaScript frontend. No build step, no framework — just run it.

## Structure

```
backend/          Express API + static file server
  src/
    server.js     App entry + routes
    data/         Seed product catalog
    store/        In-memory cart store
frontend/         Static UI (HTML/CSS/JS)
  index.html
  styles.css
  app.js
```

## Getting started

```bash
cd backend
npm install
npm start
```

Then open <http://localhost:3000>. The backend serves the frontend, so a single
process runs the whole app. Use `npm run dev` for auto-reload during development.

## API

Base path: `/api`

| Method   | Path                       | Description                                  |
| -------- | -------------------------- | -------------------------------------------- |
| `GET`    | `/products`                | List the product catalog                     |
| `GET`    | `/cart`                    | Get the cart with line items and totals      |
| `POST`   | `/cart/items`              | Add an item `{ productId, quantity? }`       |
| `PATCH`  | `/cart/items/:productId`   | Set exact quantity `{ quantity }` (0 removes)|
| `DELETE` | `/cart/items/:productId`   | Remove a line                                |
| `DELETE` | `/cart`                    | Empty the cart                               |
| `GET`    | `/checkout/summary`        | Price breakdown (subtotal, tax, shipping)    |
| `POST`   | `/checkout`                | Place an order `{ customer: {…} }`           |
| `GET`    | `/orders/:id`              | Fetch a placed order                         |

### Cart response shape

```json
{
  "items": [
    {
      "productId": 1,
      "name": "Aeropress Coffee Maker",
      "price": 39.95,
      "image": "https://…",
      "quantity": 2,
      "lineTotal": 79.9
    }
  ],
  "totalQuantity": 2,
  "subtotal": 79.9
}
```

### Checkout

`POST /checkout` takes the shopper's details and turns the current cart into a
confirmed order:

```json
{
  "customer": {
    "name": "Ada Lovelace",
    "email": "ada@example.com",
    "address": "1 Analytical Way"
  }
}
```

The server validates the fields, computes tax (8%) and shipping (flat $5, free
over $75), records the order, empties the cart, and returns the order:

```json
{
  "id": "ORD-1000",
  "status": "confirmed",
  "customer": { "name": "Ada Lovelace", "email": "…", "address": "…" },
  "items": [ … ],
  "subtotal": 90.5,
  "tax": 7.24,
  "shipping": 0,
  "total": 97.74
}
```

In the UI the **Checkout** button opens a form inside the cart drawer with a live
order summary; placing the order shows a confirmation with the order number.

## Notes

- The cart and orders live in memory, so they reset when the server restarts.
  The store modules (`backend/src/store/`) are isolated behind small interfaces
  so they can be swapped for a database without touching the routes.
- Tax rate, shipping cost, and the free-shipping threshold are constants at the
  top of `backend/src/store/orders.js`.
- Product images are placeholders from picsum.photos.
