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

## Notes

- The cart lives in memory, so it resets when the server restarts. The store
  module (`backend/src/store/cart.js`) is isolated behind a small interface so
  it can be swapped for a database without touching the routes.
- Product images are placeholders from picsum.photos.
