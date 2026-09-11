import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const webhook = process.env.N8N_DASHBOARD_WEBHOOK_URL;
  const orderId = new URL(request.url).searchParams.get("orderId")?.trim().toUpperCase();

  if (!webhook) {
    return NextResponse.json(
      { ok: false, message: "N8N_DASHBOARD_WEBHOOK_URL is not configured." },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(webhook, {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...(process.env.N8N_WEBHOOK_SECRET
          ? { "x-webhook-secret": process.env.N8N_WEBHOOK_SECRET }
          : {}),
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { ok: false, message: "Could not load orders from the bakery order system." },
        { status: 502 }
      );
    }

    const data = await response.json();

    // Dashboard requests need the complete order list. Customer-facing
    // confirmation requests only receive the single requested order.
    if (!orderId) {
      return NextResponse.json(data);
    }

    const orders = Array.isArray(data)
      ? data
      : Array.isArray(data?.orders)
        ? data.orders
        : [];

    const found = orders.find((item: Record<string, unknown>) => {
      const value = String(item.orderId ?? item["Order ID"] ?? "").trim().toUpperCase();
      return value === orderId;
    });

    if (!found) {
      return NextResponse.json(
        { ok: false, message: "We couldn't find that order yet." },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, orders: [found] });
  } catch {
    return NextResponse.json(
      { ok: false, message: "Could not connect to the bakery order system." },
      { status: 502 }
    );
  }
}
