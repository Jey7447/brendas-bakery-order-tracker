# Brenda's Bakery — lightweight order tracker

This is a lightweight customer-facing bakery website plus a simple order-book dashboard for Brenda.

## Current build

- Warm editorial bakery storefront inspired by the supplied Dribbble direction.
- No customer login.
- Product menu with categories and cart.
- Functional customer checkout at `/checkout`.
- Customer order confirmation/tracking page at `/order/[id]`.
- Brenda dashboard at `/dashboard`.
- Demo dashboard data with today/upcoming/all/unpaid views.
- Automatic soonest-delivery sorting and unpaid-today highlighting.
- n8n webhook API route ready to connect Google Sheets and email automation.

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## n8n integration

Copy `.env.example` to `.env.local` and set:

```env
N8N_ORDER_WEBHOOK_URL=https://YOUR-N8N-HOST/webhook/brendas-bakery-order
N8N_WEBHOOK_SECRET=your-secret
```

The customer checkout posts to `/api/orders`. The route validates the request, creates an order ID, adds `createdAt`, `paymentStatus` and `orderStatus`, then forwards the order to n8n when the webhook environment variable is configured.

### Recommended n8n workflow

Webhook
→ validate/normalize order
→ Google Sheets: Append Row
→ notify Brenda
→ send customer confirmation email

### Webhook payload

The webhook receives:

- `orderId`
- `createdAt`
- `customerName`
- `phone`
- `email`
- `items` (`productId`, `name`, `quantity`, `unitPrice`)
- `total`
- `deliveryDate`
- `deliveryTime`
- `address`
- `notes`
- `paymentStatus`
- `orderStatus`

If n8n is not configured, checkout runs in demo mode and still creates a confirmation/order ID.

## Google Sheets structure

Recommended sheets:

### Orders
Order ID, Created At, Customer Name, Phone, Email, Items, Total, Delivery Date, Delivery Time, Address, Payment Status, Order Status, Notes, Updated At

### Products
Product ID, Product Name, Category, Description, Price, Available, Image

### Customers
Customer ID, Name, Phone, Email, Number of Orders

### Dashboard
Optional formulas/charts for today's count, today's unpaid count and today's order value.

## Next integration step

The customer order path is now prepared for the real n8n → Google Sheets workflow. The Brenda dashboard is still using demo/local state; its create, edit, mark-paid, status-change and read operations will be connected to n8n/Google Sheets next.
