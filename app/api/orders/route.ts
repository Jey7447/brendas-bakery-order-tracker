import { NextResponse } from "next/server";

function makeOrderId() {
  const stamp = Date.now().toString(36).toUpperCase().slice(-5);
  return `BR-${stamp}${Math.floor(100 + Math.random() * 900)}`;
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    if (!payload?.customerName || !payload?.phone || !payload?.email || !payload?.deliveryDate || !payload?.deliveryTime || !payload?.address || !Array.isArray(payload?.items) || !payload.items.length) {
      return NextResponse.json({ ok: false, message: "Please complete all required order details." }, { status: 400 });
    }
    const orderId = makeOrderId();
    const order = { ...payload, orderId, createdAt: new Date().toISOString(), paymentStatus: "UNPAID", orderStatus: "PENDING" };
    const webhook = process.env.N8N_ORDER_WEBHOOK_URL;
    if (!webhook) return NextResponse.json({ ok: true, demo: true, orderId, message: "Order accepted in demo mode. Add N8N_ORDER_WEBHOOK_URL to connect n8n." });

    const response = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(process.env.N8N_WEBHOOK_SECRET ? { "x-webhook-secret": process.env.N8N_WEBHOOK_SECRET } : {}) },
      body: JSON.stringify(order)
    });
    if (!response.ok) return NextResponse.json({ ok: false, message: "We couldn't send the order to Brenda's order system." }, { status: 502 });
    const result = await response.json().catch(() => ({}));
    return NextResponse.json({ ok: true, orderId: result.orderId || orderId, ...result });
  } catch { return NextResponse.json({ ok: false, message: "Invalid order request." }, { status: 400 }); }
}
