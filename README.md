# Brenda's Bakery — lightweight order tracker

This is the first V1 build based on the requirements:

- Customer-facing bakery website with a warm editorial visual direction inspired by the supplied Dribbble reference.
- No customer login.
- Cart and checkout shell.
- Order confirmation/tracking page.
- Brenda dashboard.
- Add/edit/mark-paid interaction in the dashboard (currently demo/local state).
- Automatic soonest-delivery sorting.
- Today view.
- Unpaid-today highlighting.
- n8n webhook API route ready to connect to Google Sheets and email automation.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000

Dashboard: http://localhost:3000/dashboard

## n8n integration

Copy `.env.example` to `.env.local` and set:

```env
N8N_ORDER_WEBHOOK_URL=https://YOUR-N8N-HOST/webhook/brendas-bakery-order
N8N_WEBHOOK_SECRET=your-secret
```

The Next.js route `/api/orders` forwards order payloads to n8n.

### Recommended n8n workflow

Webhook
→ validate/normalize order
→ generate order ID
→ Google Sheets: Append Row
→ send Brenda notification
→ send customer confirmation

For dashboard actions, the next integration step is to add n8n endpoints for:

- create order
- update order
- mark paid
- change order status
- read/filter orders

The UI currently uses demo data so the design and interactions can be reviewed before wiring Google Sheets.

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
