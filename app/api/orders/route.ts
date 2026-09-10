import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const payload = await request.json();
  const webhook = process.env.N8N_ORDER_WEBHOOK_URL;
  if (!webhook) {
    return NextResponse.json({
      ok: true,
      demo: true,
      message: "Order accepted in demo mode. Add N8N_ORDER_WEBHOOK_URL to send it to n8n.",
      orderId: `BR-${Math.floor(100 + Math.random() * 900)}`
    });
  }

  const response = await fetch(webhook, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.N8N_WEBHOOK_SECRET ? { "x-webhook-secret": process.env.N8N_WEBHOOK_SECRET } : {})
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    return NextResponse.json({ ok: false, message: "n8n rejected the order." }, { status: 502 });
  }

  const result = await response.json().catch(() => ({}));
  return NextResponse.json({ ok: true, ...result });
}
