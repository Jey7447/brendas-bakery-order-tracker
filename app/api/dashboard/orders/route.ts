import { NextResponse } from "next/server";

export async function GET() {
  const webhook = process.env.N8N_DASHBOARD_WEBHOOK_URL;

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
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { ok: false, message: "Could not connect to the bakery order system." },
      { status: 502 }
    );
  }
}
