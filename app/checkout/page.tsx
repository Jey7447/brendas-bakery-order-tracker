"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, ShoppingBag } from "lucide-react";
import { products } from "@/lib/demo-data";

type CartLine = { productId: string; quantity: number };
const money = (n: number) => `KSh ${n.toLocaleString()}`;

export default function CheckoutPage() {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ customerName: "", phone: "", email: "", deliveryDate: "", deliveryTime: "", address: "", notes: "" });

  useEffect(() => {
    try { const saved = localStorage.getItem("brendas-bakery-cart"); if (saved) setCart(JSON.parse(saved)); }
    catch { setCart([]); }
    finally { setLoaded(true); }
  }, []);

  const cartDetails = useMemo(() => cart.map(line => ({ ...line, product: products.find(p => p.id === line.productId) })).filter(line => line.product), [cart]);
  const total = cartDetails.reduce((sum, line) => sum + line.product!.price * line.quantity, 0);
  const updateField = (name: keyof typeof form, value: string) => setForm(current => ({ ...current, [name]: value }));

  async function submitOrder(event: FormEvent) {
    event.preventDefault(); setError("");
    if (!cartDetails.length) return setError("Your basket is empty. Add something from the menu first.");
    setSubmitting(true);
    const payload = {
      customerName: form.customerName.trim(), phone: form.phone.trim(), email: form.email.trim(),
      deliveryDate: form.deliveryDate, deliveryTime: form.deliveryTime, address: form.address.trim(), notes: form.notes.trim(),
      items: cartDetails.map(line => ({ productId: line.product!.id, name: line.product!.name, quantity: line.quantity, unitPrice: line.product!.price })), total
    };
    try {
      const response = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok || !result.ok || !result.orderId) throw new Error(result.message || "We couldn't place your order. Please try again.");
      localStorage.removeItem("brendas-bakery-cart"); window.location.href = `/order/${encodeURIComponent(result.orderId)}`;
    } catch (err) { setError(err instanceof Error ? err.message : "We couldn't place your order. Please try again."); setSubmitting(false); }
  }

  if (!loaded) return <main className="checkout-page"><div className="checkout-card"><p>Loading your order…</p></div></main>;
  if (!cartDetails.length) return <main className="checkout-page"><div className="checkout-card empty-checkout"><ShoppingBag size={34}/><div className="eyebrow">YOUR ORDER</div><h1>Your basket is empty.</h1><p>Pick a cake, pastry or cupcake from the menu and come back here to check out.</p><Link className="button dark" href="/#menu">Back to the menu <ArrowRight size={17}/></Link></div></main>;

  return <main className="checkout-page"><div className="checkout-wrap">
    <Link href="/" className="checkout-back"><ArrowLeft size={15}/> Brenda&apos;s Bakery</Link>
    <div className="checkout-grid">
      <section className="checkout-form-card">
        <div className="eyebrow">CHECKOUT</div><h1>Let&apos;s get your order ready.</h1><p className="checkout-intro">Tell us where and when you&apos;d like your bakes delivered.</p>
        <form onSubmit={submitOrder}>
          <div className="form-section"><h2>Your details</h2><div className="checkout-two">
            <label>Name<input required value={form.customerName} onChange={e=>updateField("customerName",e.target.value)} placeholder="Your name"/></label>
            <label>Phone<input required type="tel" value={form.phone} onChange={e=>updateField("phone",e.target.value)} placeholder="07xx xxx xxx"/></label>
          </div><label>Email<input required type="email" value={form.email} onChange={e=>updateField("email",e.target.value)} placeholder="you@example.com"/></label></div>
          <div className="form-section"><h2>Delivery</h2><div className="checkout-two">
            <label>Date<input required type="date" value={form.deliveryDate} onChange={e=>updateField("deliveryDate",e.target.value)}/></label>
            <label>Preferred time<input required type="time" value={form.deliveryTime} onChange={e=>updateField("deliveryTime",e.target.value)}/></label>
          </div><label>Delivery address<textarea required value={form.address} onChange={e=>updateField("address",e.target.value)} placeholder="Street, estate, landmark…"/></label>
          <label>Notes <span>(optional)</span><textarea value={form.notes} onChange={e=>updateField("notes",e.target.value)} placeholder="Birthday message, special instructions…"/></label></div>
          {error && <div className="checkout-error">{error}</div>}
          <button className="button dark full" disabled={submitting} type="submit">{submitting ? "Placing your order…" : <>Place order <Check size={17}/></>}</button>
        </form>
      </section>
      <aside className="checkout-summary"><div className="eyebrow">ORDER SUMMARY</div><h2>What&apos;s in the box?</h2><div className="summary-lines">
        {cartDetails.map(line=><div className="summary-line" key={line.productId}><div><strong>{line.product!.name}</strong><span>Qty {line.quantity}</span></div><strong>{money(line.product!.price*line.quantity)}</strong></div>)}
      </div><div className="summary-total"><span>Total</span><strong>{money(total)}</strong></div><p className="summary-note">Payment can be confirmed with Brenda after the order is received.</p></aside>
    </div>
    <style jsx global>{` .checkout-page{min-height:100vh;background:#f3ede4;padding:34px 24px;color:#1a0302}.checkout-wrap{max-width:1120px;margin:0 auto}.checkout-back{display:inline-flex;align-items:center;gap:7px;font-size:13px;font-weight:700}.checkout-grid{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(300px,.65fr);gap:24px;margin-top:28px}.checkout-form-card,.checkout-summary{background:#fffaf4;border:1px solid rgba(26,3,2,.12);padding:34px}.checkout-form-card h1{font-family:Georgia,serif;font-size:clamp(40px,5vw,64px);line-height:.95;margin:10px 0 12px;letter-spacing:-2px}.checkout-intro{max-width:620px;margin-bottom:28px;color:#665c56}.form-section{border-top:1px solid rgba(26,3,2,.12);padding:24px 0}.form-section h2,.checkout-summary h2{font-family:Georgia,serif;font-size:25px;margin:0 0 18px}.checkout-form-card label{display:flex;flex-direction:column;gap:7px;font-size:13px;font-weight:700;margin-bottom:16px}.checkout-form-card label span{font-weight:400;color:#80766f}.checkout-form-card input,.checkout-form-card textarea{width:100%;border:1px solid rgba(26,3,2,.18);background:#fff;padding:13px 14px;font:inherit;font-weight:400;color:#1a0302;outline:none}.checkout-form-card textarea{min-height:92px;resize:vertical}.checkout-two{display:grid;grid-template-columns:1fr 1fr;gap:14px}.checkout-error{padding:13px 15px;margin-bottom:14px;background:#f7d9d0;border:1px solid #c46b50;color:#6e2412;font-size:14px}.checkout-summary{height:max-content;position:sticky;top:24px;background:#1a0302;color:#fffaf4}.summary-lines{display:flex;flex-direction:column;gap:18px;margin:25px 0}.summary-line{display:flex;justify-content:space-between;gap:18px;border-bottom:1px solid rgba(255,255,255,.14);padding-bottom:15px}.summary-line div{display:flex;flex-direction:column;gap:5px}.summary-line span{font-size:12px;opacity:.7}.summary-total{display:flex;justify-content:space-between;font-size:18px;padding-top:4px}.summary-total strong{font-family:Georgia,serif;font-size:28px}.summary-note{font-size:12px;line-height:1.6;opacity:.68;margin-top:24px}.empty-checkout{text-align:center;max-width:650px;margin:100px auto}.empty-checkout h1{font-family:Georgia,serif;font-size:50px;margin:15px 0}.empty-checkout p{color:#665c56;margin:0 auto 25px;max-width:480px}@media(max-width:800px){.checkout-page{padding:22px 15px}.checkout-grid{grid-template-columns:1fr}.checkout-summary{position:static;order:-1}.checkout-form-card,.checkout-summary{padding:24px}.checkout-form-card h1{font-size:44px}.checkout-two{grid-template-columns:1fr}.empty-checkout{margin:50px auto;padding:28px 20px}} `}</style>
  </div></main>;
}
