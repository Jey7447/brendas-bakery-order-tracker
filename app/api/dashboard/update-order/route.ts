import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const webhook = process.env.N8N_EDIT_ORDER_WEBHOOK_URL;

  if (!webhook) {
    return NextResponse.json(
      { ok: false, message: "N8N_EDIT_ORDER_WEBHOOK_URL is not configured." },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const orderId = String(body?.orderId || "").trim();

    if (!orderId) {
      return NextResponse.json(
        { ok: false, message: "Order ID is required." },
        { status: 400 }
      );
    }

    const payload = {
      action: "update_order",
      orderId,
      customerName: String(body?.customerName || "").trim(),
      phone: String(body?.phone || "").trim(),
      deliveryDate: String(body?.deliveryDate || "").trim(),
      deliveryTime: String(body?.deliveryTime || "").trim(),
      address: String(body?.address || "").trim(),
      paymentStatus: body?.paymentStatus === "PAID" ? "PAID" : "UNPAID",
      orderStatus: String(body?.orderStatus || "PENDING").trim(),
      notes: String(body?.notes || "").trim(),
    };

    const response = await fetch(webhook, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(process.env.N8N_WEBHOOK_SECRET
          ? { "x-webhook-secret": process.env.N8N_WEBHOOK_SECRET }
          : {}),
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: data?.message || "The order could not be updated.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { ok: false, message: "Could not connect to the bakery order system." },
      { status: 502 }
    );
  }
}
