import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const orderId = String(payload?.orderId || "").trim().toUpperCase();

    if (!orderId || !/^BR-[A-Z0-9]+$/.test(orderId) || orderId.length > 40) {
      return NextResponse.json(
        { ok: false, message: "Enter a valid order number, for example BR-ABC123." },
        { status: 400 }
      );
    }

    const webhook = process.env.N8N_TRACK_ORDER_WEBHOOK_URL;

    if (!webhook) {
      return NextResponse.json(
        { ok: false, message: "Order tracking is not connected yet." },
        { status: 503 }
      );
    }

    const response = await fetch(webhook, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(process.env.N8N_WEBHOOK_SECRET
          ? { "x-webhook-secret": process.env.N8N_WEBHOOK_SECRET }
          : {})
      },
      body: JSON.stringify({ orderId })
    });

    if (response.status === 404) {
      return NextResponse.json(
        { ok: false, message: "We couldn't find that order. Check the order number and try again." },
        { status: 404 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { ok: false, message: "We couldn't look up your order right now. Please try again shortly." },
        { status: 502 }
      );
    }

    const result = await response.json().catch(() => ({}));

    if (result?.ok === false) {
      return NextResponse.json(result, { status: 404 });
    }

    const order = result?.order || result;
    return NextResponse.json({ ok: true, order });
  } catch {
    return NextResponse.json(
      { ok: false, message: "We couldn't look up your order right now. Please try again shortly." },
      { status: 400 }
    );
  }
}
