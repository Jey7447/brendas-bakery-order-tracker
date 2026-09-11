"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Clock3, PackageCheck, ShoppingBag, Truck } from "lucide-react";
import { products } from "@/lib/demo-data";

type OrderItem = { productId: string; name: string; quantity: number; unitPrice: number };
type Order = { orderId?: string; customerName?: string; items?: OrderItem[]; total?: number; deliveryDate?: string; deliveryTime?: string; address?: string; paymentStatus?: string; orderStatus?: string };

const money = (n: number) => `KSh ${n.toLocaleString()}`;
const steps = [
  { key: "PENDING", label: "Order received", icon: Clock3 },
  { key: "CONFIRMED", label: "Confirmed", icon: Check },
  { key: "PREPARING", label: "Being prepared", icon: ShoppingBag },
  { key: "READY", label: "Ready", icon: PackageCheck },
  { key: "OUT_FOR_DELIVERY", label: "On the way", icon: Truck },
  { key: "DELIVERED", label: "Delivered", icon: Check }
];

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-KE", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

function titleStatus(value?: string) {
  return (value || "PENDING").replaceAll("_", " ").toLowerCase().replace(/(^| )\w/g, c => c.toUpperCase());
}

export default function OrderConfirmation({ params }: { params: { orderId: string } }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch(`/api/dashboard/orders?orderId=${encodeURIComponent(params.orderId)}`, { cache: "no-store" });
        if (!response.ok) throw new Error("Unable to load order");
        const result = await response.json();
        const orders = Array.isArray(result) ? result : Array.isArray(result.orders) ? result.orders : [];
        const found = orders.find((item: Order) => item.orderId === params.orderId || item["Order ID"] === params.orderId);
        if (found) {
          setOrder({
            orderId: found.orderId || found["Order ID"],
            customerName: found.customerName || found["Customer Name"],
            items: found.items || (typeof found["Items"] === "string" ? [] : found["Items"]),
            total: Number(found.total ?? found["Total"] ?? 0),
            deliveryDate: found.deliveryDate || found["Delivery Date"],
            deliveryTime: found.deliveryTime || found["Delivery Time"],
            address: found.address || found["Address"],
            paymentStatus: found.paymentStatus || found["Payment Status"],
            orderStatus: found.orderStatus || found["Order Status"] || "PENDING"
          });
        } else setError("We couldn't find that order yet.");
      } catch { setError("We couldn't load your order details right now."); }
      finally { setLoading(false); }
    }
    load();
  }, [params.orderId]);

  const currentIndex = useMemo(() => Math.max(0, steps.findIndex(step => step.key === order?.orderStatus)), [order?.orderStatus]);
  const itemLines = order?.items || [];

  if (loading) return <main className="order-page"><div className="order-loading"><div className="order-check"><Clock3 size={26}/></div><h1>Getting your order ready…</h1><p>Just a moment while we fetch the latest details.</p></div></main>;

  if (error || !order) return <main className="order-page"><div className="order-error"><div className="eyebrow">ORDER LOOKUP</div><h1>Something went a little wrong.</h1><p>{error || "Order not found."}</p><Link href="/" className="button dark">Back to the bakery <ArrowRight size={17}/></Link></div></main>;

  return <main className="order-page">
    <div className="order-wrap">
      <Link href="/" className="order-back"><ArrowLeft size={15}/> Brenda&apos;s Bakery</Link>

      <section className="order-hero-card">
        <div className="order-check"><Check size={30}/></div>
        <div className="eyebrow">ORDER RECEIVED</div>
        <h1>Yay, {order.customerName?.split(" ")[0] || "there"}!<br/><em>Your order is in.</em></h1>
        <p>We&apos;ve received your order and Brenda&apos;s Bakery is getting everything ready for you.</p>
        <div className="order-number">ORDER <strong>#{order.orderId}</strong></div>
      </section>

      <section className="order-progress-card">
        <div className="order-card-heading"><div><div className="eyebrow">YOUR ORDER JOURNEY</div><h2>We&apos;ll keep things moving.</h2></div><span className="status-pill">{titleStatus(order.orderStatus)}</span></div>
        <div className="order-progress">
          {steps.map((step, index) => { const Icon = step.icon; const done = index <= currentIndex; return <div className={`progress-step ${done ? "done" : ""} ${index === currentIndex ? "current" : ""}`} key={step.key}><div className="progress-icon"><Icon size={15}/></div><span>{step.label}</span></div>; })}
        </div>
      </section>

      <div className="order-content-grid">
        <section className="order-detail-card">
          <div className="eyebrow">ORDER SUMMARY</div><h2>What&apos;s in the box?</h2>
          <div className="order-items">
            {itemLines.length ? itemLines.map((item, index) => { const product = products.find(p => p.id === item.productId); return <div className="order-item" key={`${item.productId}-${index}`}><div className="order-item-image">{product ? <img src={product.image} alt=""/> : <ShoppingBag size={18}/>}</div><div><strong>{item.name}</strong><span>Qty {item.quantity}</span></div><strong>{money(item.unitPrice * item.quantity)}</strong></div>; }) : <p className="order-muted">Your order has been received. Item details will appear once the order is synced.</p>}
          </div>
          <div className="order-total"><span>Total</span><strong>{money(order.total || 0)}</strong></div>
        </section>

        <aside className="order-detail-card delivery-card">
          <div className="eyebrow">DELIVERY</div><h2>Coming your way.</h2>
          <div className="delivery-detail"><span>DATE</span><strong>{formatDate(order.deliveryDate)}</strong></div>
          <div className="delivery-detail"><span>TIME</span><strong>{order.deliveryTime || "—"}</strong></div>
          <div className="delivery-detail"><span>ADDRESS</span><strong>{order.address || "—"}</strong></div>
          <div className="payment-note"><span className={order.paymentStatus === "PAID" ? "paid-dot" : "unpaid-dot"}/><div><strong>{order.paymentStatus === "PAID" ? "Payment confirmed" : "Payment to be confirmed"}</strong><small>{order.paymentStatus === "PAID" ? "Thanks — your order is fully paid." : "Brenda will confirm payment with you after receiving the order."}</small></div></div>
        </aside>
      </div>

      <section className="next-step-card"><div><div className="eyebrow">WHAT HAPPENS NEXT?</div><h2>We&apos;ll take it from here.</h2><p>Keep this order number handy if you need to ask about your order. You can also return to the menu and discover something sweet for next time.</p></div><Link href="/#menu" className="button dark">Back to the menu <ArrowRight size={17}/></Link></section>
      <div className="order-footer">Brenda&apos;s Bakery · Made with care</div>
    </div>
    <style jsx global>{`
      .order-page{min-height:100vh;background:#f3ede4;color:#1a0302;padding:28px 20px 70px}.order-wrap{max-width:1050px;margin:0 auto}.order-back{display:inline-flex;align-items:center;gap:7px;font-size:13px;font-weight:800;margin:4px 0 25px}.order-hero-card{position:relative;text-align:center;padding:58px 25px 52px;border-radius:32px;background:linear-gradient(135deg,#f8f0e7,#ead8c8);overflow:hidden}.order-hero-card:after{content:"";position:absolute;width:320px;height:320px;border:1px solid rgba(174,66,22,.13);border-radius:50%;right:-120px;top:-130px}.order-check{width:62px;height:62px;margin:0 auto 18px;display:grid;place-items:center;border-radius:50%;background:#1a0302;color:#fffaf4;box-shadow:0 12px 30px rgba(26,3,2,.14)}.order-hero-card h1{position:relative;z-index:1;font:400 clamp(48px,7vw,82px)/.94 "DM Serif Display",Georgia,serif;letter-spacing:-.055em;margin:13px 0}.order-hero-card h1 em{font-style:italic}.order-hero-card>p{max-width:520px;margin:0 auto;color:#665850;font-size:14px;line-height:1.7}.order-number{display:inline-flex;gap:8px;margin-top:25px;padding:9px 14px;border:1px solid rgba(26,3,2,.12);border-radius:999px;background:rgba(255,255,255,.5);font-size:10px;letter-spacing:.08em}.order-number strong{letter-spacing:.02em}.order-progress-card,.order-detail-card,.next-step-card{margin-top:16px;border:1px solid rgba(26,3,2,.09);border-radius:24px;background:#fffaf4}.order-progress-card{padding:27px 30px}.order-card-heading{display:flex;justify-content:space-between;gap:20px;align-items:flex-end}.order-card-heading h2,.order-detail-card h2,.next-step-card h2{font:400 28px/1 "DM Serif Display",Georgia,serif;margin:8px 0 0}.status-pill{padding:8px 11px;border-radius:999px;background:#eee3d6;font-size:9px;font-weight:900;letter-spacing:.07em}.order-progress{display:grid;grid-template-columns:repeat(6,1fr);margin-top:30px}.progress-step{position:relative;text-align:center;color:#9a8f86;font-size:9px;font-weight:800}.progress-step:not(:last-child):after{content:"";position:absolute;height:1px;background:#ddd0c2;left:50%;right:-50%;top:16px;z-index:0}.progress-step.done:not(:last-child):after{background:#8d7866}.progress-icon{position:relative;z-index:1;width:32px;height:32px;margin:0 auto 9px;display:grid;place-items:center;border-radius:50%;border:1px solid #d8c9ba;background:#f8f0e7}.progress-step.done{color:#493b34}.progress-step.done .progress-icon{background:#1a0302;border-color:#1a0302;color:#fffaf4}.progress-step.current .progress-icon{box-shadow:0 0 0 5px rgba(174,66,22,.10)}.order-content-grid{display:grid;grid-template-columns:1.15fr .85fr;gap:16px}.order-detail-card{padding:28px 30px}.order-items{margin-top:20px}.order-item{display:grid;grid-template-columns:48px 1fr auto;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid #e7ddd3}.order-item-image{width:48px;height:48px;border-radius:13px;overflow:hidden;background:#e8ded0;display:grid;place-items:center}.order-item-image img{width:100%;height:100%;object-fit:cover}.order-item div:nth-child(2){display:grid;gap:4px}.order-item span{font-size:10px;color:#887b71}.order-item>strong:last-child{font-size:12px}.order-total{display:flex;justify-content:space-between;align-items:center;padding-top:20px;font-size:13px}.order-total strong{font:400 27px "DM Serif Display",Georgia,serif}.delivery-card{background:#1a0302;color:#fffaf4}.delivery-card .eyebrow{color:#c8b6a8}.delivery-detail{display:grid;gap:5px;padding:14px 0;border-bottom:1px solid rgba(255,255,255,.13)}.delivery-detail span{font-size:8px;letter-spacing:.14em;opacity:.55}.delivery-detail strong{font-size:12px;line-height:1.45}.payment-note{display:flex;gap:10px;align-items:flex-start;margin-top:18px;padding:13px;border-radius:14px;background:rgba(255,255,255,.07)}.payment-note>div{display:grid;gap:4px}.payment-note strong{font-size:10px}.payment-note small{font-size:9px;line-height:1.5;opacity:.6}.paid-dot,.unpaid-dot{width:8px;height:8px;border-radius:50%;margin-top:3px;flex:0 0 auto}.paid-dot{background:#8bb58f}.unpaid-dot{background:#d59a58}.next-step-card{padding:30px;display:flex;justify-content:space-between;align-items:center;gap:30px}.next-step-card p{max-width:610px;margin:10px 0 0;color:#6d625b;font-size:12px;line-height:1.7}.next-step-card .button{flex:0 0 auto}.order-footer{text-align:center;color:#9a8e84;font-size:10px;margin-top:28px}.order-loading,.order-error{max-width:650px;margin:14vh auto;text-align:center;padding:50px 25px;background:#fffaf4;border-radius:28px}.order-loading h1,.order-error h1{font:400 46px "DM Serif Display",Georgia,serif;margin:15px 0 10px}.order-loading p,.order-error p{color:#6d625b;margin-bottom:25px}.order-error .order-check{margin-bottom:15px}.order-muted{color:#7c7067;font-size:12px;line-height:1.6}
      @media(max-width:760px){.order-page{padding:18px 12px 50px}.order-hero-card{padding:45px 18px 40px;border-radius:26px}.order-progress-card,.order-detail-card,.next-step-card{border-radius:20px;padding:22px}.order-card-heading{align-items:flex-start;flex-direction:column}.order-progress{display:flex;overflow-x:auto;padding-bottom:8px;margin-inline:-5px}.progress-step{min-width:105px}.progress-step:not(:last-child):after{left:calc(50% + 16px);right:-50%;top:16px}.order-content-grid{grid-template-columns:1fr}.delivery-card{order:-1}.next-step-card{display:grid;gap:20px}.next-step-card .button{width:100%;justify-content:center}.order-item{grid-template-columns:42px 1fr auto}.order-item-image{width:42px;height:42px}}
    `}</style>
  </main>;
}
