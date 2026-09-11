"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Clock3, PackageCheck, Search, ShoppingBag, Truck } from "lucide-react";
import { products } from "@/lib/demo-data";

type OrderItem = { productId?: string; name?: string; quantity?: number; unitPrice?: number };
type Order = {
  orderId?: string;
  customerName?: string;
  items?: OrderItem[];
  total?: number;
  deliveryDate?: string;
  deliveryTime?: string;
  address?: string;
  paymentStatus?: string;
  orderStatus?: string;
};

type RawOrder = Order & { [key: string]: unknown };

const steps = [
  { key: "PENDING", label: "Order received", icon: Clock3 },
  { key: "CONFIRMED", label: "Confirmed", icon: Check },
  { key: "PREPARING", label: "Being prepared", icon: ShoppingBag },
  { key: "READY", label: "Ready", icon: PackageCheck },
  { key: "OUT_FOR_DELIVERY", label: "On the way", icon: Truck },
  { key: "DELIVERED", label: "Delivered", icon: Check }
];

const money = (n: number) => `KSh ${n.toLocaleString()}`;

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-KE", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

function findProduct(name?: string, productId?: string) {
  if (productId) {
    const byId = products.find(product => product.id === productId);
    if (byId) return byId;
  }

  const normalizedName = String(name || "").trim().toLowerCase();
  if (!normalizedName) return undefined;

  return products.find(product => product.name.trim().toLowerCase() === normalizedName);
}

function normaliseOrder(value: RawOrder): Order {
  const rawItems = value.items ?? value["Items"];
  let items: OrderItem[] = [];

  if (Array.isArray(rawItems)) {
    items = rawItems as OrderItem[];
  } else if (typeof rawItems === "string") {
    items = rawItems
      .split(";")
      .map(item => item.trim())
      .filter(Boolean)
      .map(item => {
        const match = item.match(/^(.*?)\s*[×x]\s*(\d+)$/);
        const name = match ? match[1].trim() : item;
        const quantity = match ? Number(match[2]) : 1;
        const product = findProduct(name);

        return {
          productId: product?.id,
          name,
          quantity,
          unitPrice: product?.price || 0
        };
      });
  }

  items = items.map(item => {
    const product = findProduct(item.name, item.productId);

    return {
      ...item,
      productId: item.productId || product?.id,
      name: item.name || product?.name || "Bakery item",
      quantity: Number(item.quantity || 0),
      unitPrice: Number(item.unitPrice || product?.price || 0)
    };
  });

  return {
    orderId: String(value.orderId || value["Order ID"] || ""),
    customerName: String(value.customerName || value["Customer Name"] || ""),
    items,
    total: Number(value.total ?? value["Total"] ?? 0),
    deliveryDate: String(value.deliveryDate || value["Delivery Date"] || ""),
    deliveryTime: String(value.deliveryTime || value["Delivery Time"] || ""),
    address: String(value.address || value["Address"] || ""),
    paymentStatus: String(value.paymentStatus || value["Payment Status"] || "UNPAID"),
    orderStatus: String(value.orderStatus || value["Order Status"] || "PENDING")
  };
}

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = orderId.trim().toUpperCase();
    setOrderId(value);
    setError("");
    setOrder(null);

    if (!value) {
      setError("Enter your order number to continue.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/order/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: value }),
        cache: "no-store"
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result?.ok === false) {
        throw new Error(result?.message || "We couldn't find that order.");
      }
      setOrder(normaliseOrder(result.order || result));
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't find that order.");
    } finally {
      setLoading(false);
    }
  }

  const currentIndex = useMemo(() => {
    const index = steps.findIndex(step => step.key === order?.orderStatus);
    return index < 0 ? 0 : index;
  }, [order?.orderStatus]);

  return (
    <main className="track-page">
      <div className="track-wrap">
        <Link href="/" className="track-back"><ArrowLeft size={15} /> Brenda&apos;s Bakery</Link>

        <section className="track-intro">
          <div className="track-badge"><Search size={18} /></div>
          <div className="eyebrow">ORDER TRACKING</div>
          <h1>Where&apos;s my <em>bake?</em></h1>
          <p>Enter the order number from your confirmation message and we&apos;ll show you the latest update.</p>

          <form className="track-form" onSubmit={handleSubmit}>
            <label htmlFor="order-id">ORDER NUMBER</label>
            <div className="track-input-row">
              <input
                id="order-id"
                value={orderId}
                onChange={event => setOrderId(event.target.value.toUpperCase())}
                placeholder="BR-ABC123"
                autoComplete="off"
                spellCheck={false}
              />
              <button type="submit" className="track-submit" disabled={loading}>
                {loading ? "Looking…" : "Track order"}
                {!loading && <ArrowRight size={17} />}
              </button>
            </div>
            {error && <p className="track-error" role="alert">{error}</p>}
          </form>

          <div className="track-hint">Your order number looks like <strong>BR-ABC123</strong>.</div>
        </section>

        {order && (
          <section className="track-result" aria-live="polite">
            <div className="track-result-head">
              <div>
                <div className="eyebrow">ORDER #{order.orderId}</div>
                <h2>Hi, {order.customerName?.split(" ")[0] || "there"}.</h2>
              </div>
              <span className="track-status">{(order.orderStatus || "PENDING").replaceAll("_", " ")}</span>
            </div>

            <div className="track-progress">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const done = index <= currentIndex;
                return (
                  <div className={`track-step ${done ? "done" : ""} ${index === currentIndex ? "current" : ""}`} key={step.key}>
                    <div className="track-step-icon"><Icon size={15} /></div>
                    <span>{step.label}</span>
                  </div>
                );
              })}
            </div>

            <div className="track-details">
              <div className="track-box">
                <div className="eyebrow">YOUR ORDER</div>
                <h3>What&apos;s in the box?</h3>
                <div className="track-items">
                  {order.items?.length ? order.items.map((item, index) => {
                    const product = findProduct(item.name, item.productId);
                    const quantity = Number(item.quantity || 0);
                    const unitPrice = Number(item.unitPrice || product?.price || 0);
                    return (
                      <div className="track-item" key={`${item.productId || item.name}-${index}`}>
                        <div className="track-item-image">{product ? <img src={product.image} alt="" /> : <ShoppingBag size={18} />}</div>
                        <div><strong>{item.name || product?.name || "Bakery item"}</strong><span>Qty {quantity}</span></div>
                        <strong>{money(unitPrice * quantity)}</strong>
                      </div>
                    );
                  }) : <p className="track-muted">Your item details will appear once the order has fully synced.</p>}
                </div>
                <div className="track-total"><span>Total</span><strong>{money(order.total || 0)}</strong></div>
              </div>

              <div className="track-box delivery-box">
                <div className="eyebrow">DELIVERY</div>
                <h3>Coming your way.</h3>
                <div className="track-field"><span>DATE</span><strong>{formatDate(order.deliveryDate)}</strong></div>
                <div className="track-field"><span>TIME</span><strong>{order.deliveryTime || "—"}</strong></div>
                <div className="track-field"><span>ADDRESS</span><strong>{order.address || "—"}</strong></div>
                <div className="track-payment">
                  <span className={order.paymentStatus === "PAID" ? "paid" : "unpaid"} />
                  <div><strong>{order.paymentStatus === "PAID" ? "Payment confirmed" : "Payment to be confirmed"}</strong><small>{order.paymentStatus === "PAID" ? "Your order is fully paid." : "Brenda will confirm payment with you."}</small></div>
                </div>
              </div>
            </div>
          </section>
        )}

        <div className="track-footer-note">Need help? Keep your order number handy when contacting Brenda&apos;s Bakery.</div>
      </div>

      <style jsx global>{`
        .track-page{min-height:100vh;background:#f3ede4;color:#1a0302;padding:28px 20px 70px}.track-wrap{max-width:980px;margin:0 auto}.track-back{display:inline-flex;align-items:center;gap:7px;font-size:13px;font-weight:800;margin:4px 0 25px}.track-intro{position:relative;text-align:center;padding:55px 25px 44px;border-radius:32px;background:linear-gradient(135deg,#f8f0e7,#ead8c8);overflow:hidden}.track-intro:after{content:"";position:absolute;width:360px;height:360px;border:1px solid rgba(174,66,22,.12);border-radius:50%;right:-150px;top:-180px}.track-badge{position:relative;z-index:1;width:54px;height:54px;margin:0 auto 18px;display:grid;place-items:center;border-radius:50%;background:#1a0302;color:#fffaf4;box-shadow:0 12px 28px rgba(26,3,2,.14)}.track-intro h1{position:relative;z-index:1;font:400 clamp(46px,7vw,76px)/.95 "DM Serif Display",Georgia,serif;letter-spacing:-.05em;margin:10px 0 14px}.track-intro h1 em{font-style:italic}.track-intro>p{position:relative;z-index:1;max-width:510px;margin:0 auto;color:#665850;font-size:14px;line-height:1.7}.track-form{position:relative;z-index:2;max-width:620px;margin:30px auto 0;text-align:left}.track-form label{display:block;margin:0 0 8px;font-size:8px;font-weight:900;letter-spacing:.14em;color:#6d5f57}.track-input-row{display:flex;gap:8px}.track-input-row input{min-width:0;flex:1;border:1px solid rgba(26,3,2,.14);border-radius:15px;background:rgba(255,250,244,.8);padding:15px 16px;font:700 13px/1 inherit;color:#1a0302;outline:none;text-transform:uppercase}.track-input-row input:focus{border-color:#1a0302;box-shadow:0 0 0 4px rgba(26,3,2,.07)}.track-submit{display:inline-flex;align-items:center;justify-content:center;gap:9px;border:0;border-radius:15px;padding:0 18px;background:#1a0302;color:#fffaf4;font-weight:900;font-size:12px;cursor:pointer;white-space:nowrap}.track-submit:disabled{opacity:.65;cursor:wait}.track-error{margin:10px 0 0;color:#9a321f;font-size:11px;font-weight:700}.track-hint{margin-top:14px;font-size:10px;color:#8a7d74}.track-hint strong{color:#5f5149}.track-result{margin-top:16px;border:1px solid rgba(26,3,2,.09);border-radius:24px;background:#fffaf4;padding:28px 30px}.track-result-head{display:flex;justify-content:space-between;align-items:flex-end;gap:20px}.track-result-head h2{font:400 32px/1 "DM Serif Display",Georgia,serif;margin:8px 0 0}.track-status{padding:8px 11px;border-radius:999px;background:#eee3d6;font-size:9px;font-weight:900;letter-spacing:.06em}.track-progress{display:grid;grid-template-columns:repeat(6,1fr);margin-top:30px}.track-step{position:relative;text-align:center;color:#9a8f86;font-size:9px;font-weight:800}.track-step:not(:last-child):after{content:"";position:absolute;height:1px;background:#ddd0c2;left:50%;right:-50%;top:16px;z-index:0}.track-step.done{color:#493b34}.track-step.done:not(:last-child):after{background:#8d7866}.track-step-icon{position:relative;z-index:1;width:32px;height:32px;margin:0 auto 9px;display:grid;place-items:center;border:1px solid #d8c9ba;border-radius:50%;background:#f8f0e7}.track-step.done .track-step-icon{background:#1a0302;border-color:#1a0302;color:#fffaf4}.track-step.current .track-step-icon{box-shadow:0 0 0 5px rgba(174,66,22,.1)}.track-details{display:grid;grid-template-columns:1.15fr .85fr;gap:16px;margin-top:28px}.track-box{border:1px solid #e7ddd3;border-radius:19px;padding:25px;background:#fff}.track-box h3{font:400 26px/1 "DM Serif Display",Georgia,serif;margin:8px 0 17px}.track-items{margin-top:8px}.track-item{display:grid;grid-template-columns:48px 1fr auto;align-items:center;gap:12px;padding:11px 0;border-bottom:1px solid #eee5dc}.track-item-image{width:48px;height:48px;border-radius:12px;overflow:hidden;background:#e8ded0;display:grid;place-items:center}.track-item-image img{width:100%;height:100%;object-fit:cover}.track-item div:nth-child(2){display:grid;gap:4px}.track-item span{font-size:10px;color:#887b71}.track-item>strong:last-child{font-size:12px}.track-total{display:flex;justify-content:space-between;align-items:center;padding-top:18px;font-size:12px}.track-total strong{font:400 26px "DM Serif Display",Georgia,serif}.delivery-box{background:#1a0302;color:#fffaf4;border-color:#1a0302}.delivery-box .eyebrow{color:#c8b6a8}.track-field{display:grid;gap:5px;padding:13px 0;border-bottom:1px solid rgba(255,255,255,.13)}.track-field span{font-size:8px;letter-spacing:.14em;opacity:.55}.track-field strong{font-size:12px;line-height:1.45}.track-payment{display:flex;gap:10px;align-items:flex-start;margin-top:17px;padding:13px;border-radius:13px;background:rgba(255,255,255,.07)}.track-payment>span{width:8px;height:8px;border-radius:50%;margin-top:3px;flex:0 0 auto}.track-payment .paid{background:#8bb58f}.track-payment .unpaid{background:#d59a58}.track-payment div{display:grid;gap:4px}.track-payment strong{font-size:10px}.track-payment small{font-size:9px;line-height:1.5;opacity:.62}.track-muted{color:#7c7067;font-size:11px;line-height:1.6}.track-footer-note{text-align:center;color:#9a8e84;font-size:10px;margin-top:22px}@media(max-width:760px){.track-page{padding:18px 12px 50px}.track-intro{padding:45px 18px 35px;border-radius:26px}.track-input-row{display:grid}.track-submit{min-height:48px}.track-result{padding:22px;border-radius:20px}.track-result-head{align-items:flex-start;flex-direction:column}.track-progress{display:flex;overflow-x:auto;padding-bottom:8px;margin-inline:-5px}.track-step{min-width:105px}.track-step:not(:last-child):after{left:calc(50% + 16px);right:-50%;top:16px}.track-details{grid-template-columns:1fr}.delivery-box{order:-1}.track-box{padding:21px}.track-item{grid-template-columns:42px 1fr auto}.track-item-image{width:42px;height:42px}}
      `}</style>
    </main>
  );
}
