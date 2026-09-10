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
    try {
      const saved = localStorage.getItem("brendas-bakery-cart");
      if (saved) setCart(JSON.parse(saved));
    } catch { setCart([]); }
    finally { setLoaded(true); }
  }, []);

  const cartDetails = useMemo(() => cart.map(line => ({ ...line, product: products.find(p => p.id === line.productId) })).filter(line => line.product), [cart]);
  const total = cartDetails.reduce((sum, line) => sum + line.product!.price * line.quantity, 0);
  const updateField = (name: keyof typeof form, value: string) => setForm(current => ({ ...current, [name]: value }));

  async function submitOrder(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!cartDetails.length) return setError("Your basket is empty. Add something from the menu first.");
    setSubmitting(true);
    const payload = {
      customerName: form.customerName.trim(), phone: form.phone.trim(), email: form.email.trim(),
      deliveryDate: form.deliveryDate, deliveryTime: form.deliveryTime, address: form.address.trim(), notes: form.notes.trim(),
      items: cartDetails.map(line => ({ productId: line.product!.id, name: line.product!.name, quantity: line.quantity, unitPrice: line.product!.price })),
      total
    };
    try {
      const response = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok || !result.ok || !result.orderId) throw new Error(result.message || "We couldn't place your order. Please try again.");
      localStorage.removeItem("brendas-bakery-cart");
      window.location.href = `/order/${encodeURIComponent(result.orderId)}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't place your order. Please try again.");
      setSubmitting(false);
    }
  }

  if (!loaded) return <main className="checkout-page"><div className="checkout-card"><p>Loading your order…</p></div></main>;
  if (!cartDetails.length) return <main className="checkout-page"><div className="checkout-card empty-checkout"><ShoppingBag size={34}/><div className="eyebrow">YOUR ORDER</div><h1>Your basket is empty.</h1><p>Pick a cake, pastry or cupcake from the menu and come back here to check out.</p><Link className="button dark" href="/#menu">Back to the menu <ArrowRight size={17}/></Link></div></main>;

  return <main className="checkout-page"><div className="checkout-wrap">
    <Link href="/" className="back-link"><ArrowLeft size={15}/> Brenda&apos;s Bakery</Link>
    <div className="checkout-grid">
      <section className="checkout-form-card">
        <div className="eyebrow">CHECKOUT</div><h1>Let&apos;s get your order ready.</h1><p className="checkout-intro">Tell us where and when you&apos;d like your bakes delivered.</p>
        <form onSubmit={submitOrder}>
          <div className="form-section"><h2>Your details</h2><div className="two">
            <label>Name<input required value={form.customerName} onChange={e=>updateField("customerName",e.target.value)} placeholder="Your name"/></label>
            <label>Phone<input required type="tel" value={form.phone} onChange={e=>updateField("phone",e.target.value)} placeholder="07xx xxx xxx"/></label>
          </div><label>Email<input required type="email" value={form.email} onChange={e=>updateField("email",e.target.value)} placeholder="you@example.com"/></label></div>
          <div className="form-section"><h2>Delivery</h2><div className="two">
            <label>Date<input required type="date" value={form.deliveryDate} onChange={e=>updateField("deliveryDate",e.target.value)}/></label>
            <label>Preferred time<input required type="time" value={form.deliveryTime} onChange={e=>updateField("deliveryTime",e.target.value)}/></label>
          </div><label>Delivery address<textarea required value={form.address} onChange={e=>updateField("address",e.target.value)} placeholder="Street, estate, landmark…"/></label>
          <label>Notes <span>(optional)</span><textarea value={form.notes} onChange={e=>updateField("notes",e.target.value)} placeholder="Birthday message, special instructions…"/></label></div>
          {error && <div className="form-error">{error}</div>}
          <button className="button dark full" disabled={submitting} type="submit">{submitting ? "Placing your order…" : <>Place order <Check size={17}/></>}</button>
        </form>
      </section>
      <aside className="checkout-summary"><div className="eyebrow">ORDER SUMMARY</div><h2>What&apos;s in the box?</h2><div className="summary-lines">
        {cartDetails.map(line=><div className="summary-line" key={line.productId}><div><strong>{line.product!.name}</strong><span>Qty {line.quantity}</span></div><strong>{money(line.product!.price*line.quantity)}</strong></div>)}
      </div><div className="summary-total"><span>Total</span><strong>{money(total)}</strong></div><p className="summary-note">Payment can be confirmed with Brenda after the order is received.</p></aside>
    </div>
  </div></main>;
}
