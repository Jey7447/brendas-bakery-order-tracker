"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Clock3, MapPin, ShoppingBag } from "lucide-react";
import { products } from "@/lib/demo-data";

type CartLine = { productId: string; quantity: number };
const money = (n: number) => `KSh ${n.toLocaleString()}`;

export default function CheckoutPage() {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [minDate, setMinDate] = useState("");
  const [form, setForm] = useState({ customerName: "", phone: "", email: "", deliveryDate: "", deliveryTime: "", address: "", notes: "" });

  useEffect(() => {
    try { const saved = localStorage.getItem("brendas-bakery-cart"); if (saved) setCart(JSON.parse(saved)); }
    catch { setCart([]); }
    finally { setLoaded(true); }

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    setMinDate(`${yyyy}-${mm}-${dd}`);
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
    <div className="checkout-topbar">
      <Link href="/" className="checkout-back"><ArrowLeft size={15}/> Brenda&apos;s Bakery</Link>
      <div className="checkout-steps" aria-label="Checkout progress">
        <span className="done"><ShoppingBag size={13}/> Basket</span><i/> <span className="current"><Check size={13}/> Details</span><i/> <span>Confirmation</span>
      </div>
    </div>

    <div className="checkout-grid">
      <section className="checkout-form-card">
        <div className="eyebrow">CHECKOUT</div>
        <h1>Let&apos;s get your order ready.</h1>
        <p className="checkout-intro">A few details and we&apos;ll get your bakes ready for the right place and time.</p>
        <form onSubmit={submitOrder}>
          <div className="form-section"><div className="form-section-heading"><span>01</span><div><h2>Your details</h2><p>How can we reach you?</p></div></div><div className="checkout-two">
            <label>Name<input required value={form.customerName} onChange={e=>updateField("customerName",e.target.value)} placeholder="Your name" autoComplete="name"/></label>
            <label>Phone<input required type="tel" value={form.phone} onChange={e=>updateField("phone",e.target.value)} placeholder="07xx xxx xxx" autoComplete="tel"/></label>
          </div><label>Email<input required type="email" value={form.email} onChange={e=>updateField("email",e.target.value)} placeholder="you@example.com" autoComplete="email"/></label></div>

          <div className="form-section"><div className="form-section-heading"><span>02</span><div><h2>Delivery</h2><p>When and where should it arrive?</p></div></div><div className="checkout-two">
            <label>Date<input required type="date" min={minDate} value={form.deliveryDate} onChange={e=>updateField("deliveryDate",e.target.value)}/></label>
            <label>Preferred time<input required type="time" value={form.deliveryTime} onChange={e=>updateField("deliveryTime",e.target.value)}/></label>
          </div><label>Delivery address<textarea required value={form.address} onChange={e=>updateField("address",e.target.value)} placeholder="Street, estate, landmark…" autoComplete="street-address"/></label>
          <label>Notes <span>(optional)</span><textarea value={form.notes} onChange={e=>updateField("notes",e.target.value)} placeholder="Birthday message, special instructions…"/></label></div>

          <div className="checkout-reassurance"><div><Clock3 size={17}/><span><strong>Made to order</strong> — please choose a delivery time that works for you.</span></div><div><MapPin size={17}/><span><strong>Delivery details</strong> — Brenda will confirm the order and delivery with you.</span></div></div>
          {error && <div className="checkout-error" role="alert">{error}</div>}
          <button className="button dark full submit-order" disabled={submitting} type="submit">{submitting ? "Placing your order…" : <>Place order <Check size={17}/></>}</button>
        </form>
      </section>

      <aside className="checkout-summary"><div className="summary-top"><div className="eyebrow">ORDER SUMMARY</div><span>{cartDetails.reduce((sum, line) => sum + line.quantity, 0)} items</span></div><h2>What&apos;s in the box?</h2><div className="summary-lines">
        {cartDetails.map(line=><div className="summary-line" key={line.productId}><div className="summary-product"><img src={line.product!.image} alt=""/><div><strong>{line.product!.name}</strong><span>Qty {line.quantity}</span></div></div><strong>{money(line.product!.price*line.quantity)}</strong></div>)}
      </div><div className="summary-total"><span>Total</span><strong>{money(total)}</strong></div><div className="summary-note"><Check size={15}/><p>Payment can be confirmed with Brenda after the order is received.</p></div></aside>
    </div>

    <style jsx global>{`
      .checkout-page{min-height:100vh;background:#f1ebe2;padding:28px 24px 56px;color:#1a0302}
      .checkout-wrap{max-width:1120px;margin:0 auto}
      .checkout-topbar{display:flex;align-items:center;justify-content:space-between;gap:24px;padding:4px 2px 0}
      .checkout-back{display:inline-flex;align-items:center;gap:7px;font-size:13px;font-weight:800;text-decoration:none;color:#1a0302}
      .checkout-steps{display:flex;align-items:center;gap:9px;font-size:11px;font-weight:800;letter-spacing:.04em;color:#8a8179;text-transform:uppercase}
      .checkout-steps span{display:inline-flex;align-items:center;gap:5px;white-space:nowrap}
      .checkout-steps .done{color:#1a0302}.checkout-steps .current{color:#ae4216}.checkout-steps i{width:26px;height:1px;background:rgba(26,3,2,.16)}
      .checkout-grid{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(310px,.65fr);gap:22px;margin-top:25px;align-items:start}
      .checkout-form-card,.checkout-summary{border:1px solid rgba(26,3,2,.10);border-radius:28px;box-shadow:0 18px 55px rgba(26,3,2,.07)}
      .checkout-form-card{background:#fffaf4;padding:36px}
      .checkout-form-card h1{font-family:Georgia,serif;font-size:clamp(42px,5vw,64px);line-height:.95;margin:10px 0 14px;letter-spacing:-2.5px;max-width:720px}
      .checkout-intro{max-width:620px;margin:0 0 30px;color:#6c625b;line-height:1.65}
      .form-section{border-top:1px solid rgba(26,3,2,.10);padding:26px 0 8px}
      .form-section-heading{display:flex;gap:14px;align-items:flex-start;margin-bottom:19px}
      .form-section-heading>span{font-size:11px;font-weight:900;letter-spacing:.08em;color:#ae4216;padding-top:5px}
      .form-section-heading h2,.checkout-summary h2{font-family:Georgia,serif;font-size:26px;line-height:1;margin:0 0 6px}
      .form-section-heading p{margin:0;color:#827871;font-size:12px}
      .checkout-form-card label{display:flex;flex-direction:column;gap:7px;font-size:12px;font-weight:800;margin-bottom:16px}
      .checkout-form-card label span{font-weight:500;color:#8b817a}
      .checkout-form-card input,.checkout-form-card textarea{width:100%;box-sizing:border-box;border:1px solid rgba(26,3,2,.15);border-radius:13px;background:#fff;padding:14px 15px;font:inherit;font-size:14px;font-weight:500;color:#1a0302;outline:none;transition:border-color .18s,box-shadow .18s,background .18s}
      .checkout-form-card input:focus,.checkout-form-card textarea:focus{border-color:#ae4216;box-shadow:0 0 0 4px rgba(174,66,22,.09);background:#fffdfb}
      .checkout-form-card textarea{min-height:94px;resize:vertical;line-height:1.5}
      .checkout-two{display:grid;grid-template-columns:1fr 1fr;gap:14px}
      .checkout-reassurance{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:13px 0 17px}
      .checkout-reassurance>div{display:flex;gap:10px;align-items:flex-start;border-radius:15px;background:#f5eee5;padding:13px;color:#6f655e;font-size:11px;line-height:1.5}
      .checkout-reassurance svg{flex:0 0 auto;margin-top:1px}.checkout-reassurance strong{display:block;color:#1a0302;font-size:11px;margin-bottom:1px}
      .checkout-error{padding:13px 15px;margin-bottom:14px;border-radius:13px;background:#f7d9d0;border:1px solid #c46b50;color:#6e2412;font-size:13px}
      .submit-order{min-height:52px;border-radius:14px}
      .checkout-summary{height:max-content;position:sticky;top:20px;background:#1a0302;color:#fffaf4;padding:28px}
      .summary-top{display:flex;align-items:center;justify-content:space-between;gap:12px}.summary-top>span{font-size:11px;opacity:.55;font-weight:800}
      .checkout-summary h2{font-size:30px;margin:8px 0 0}
      .summary-lines{display:flex;flex-direction:column;gap:14px;margin:24px 0}
      .summary-line{display:flex;justify-content:space-between;align-items:center;gap:14px;border-bottom:1px solid rgba(255,255,255,.13);padding-bottom:14px;font-size:13px}
      .summary-product{display:flex;align-items:center;gap:11px;min-width:0}.summary-product img{width:48px;height:48px;object-fit:cover;border-radius:11px;flex:0 0 auto}.summary-product>div{display:flex;flex-direction:column;gap:5px;min-width:0}.summary-product strong{font-size:12px;line-height:1.25}.summary-product span{font-size:10px;opacity:.55}.summary-line>strong{white-space:nowrap;font-size:12px}
      .summary-total{display:flex;justify-content:space-between;align-items:end;font-size:16px;padding-top:3px}.summary-total strong{font-family:Georgia,serif;font-size:30px}
      .summary-note{display:flex;gap:8px;align-items:flex-start;margin:22px 0 0;padding-top:17px;border-top:1px solid rgba(255,255,255,.13);font-size:11px;line-height:1.6;opacity:.68}.summary-note svg{flex:0 0 auto;margin-top:2px}.summary-note p{margin:0}
      .checkout-card{max-width:650px;margin:80px auto;padding:50px;border-radius:28px;background:#fffaf4;text-align:center}
      .empty-checkout h1{font-family:Georgia,serif;font-size:50px;margin:15px 0}.empty-checkout p{color:#665c56;margin:0 auto 25px;max-width:480px;line-height:1.6}
      @media(max-width:800px){
        .checkout-page{padding:20px 14px 40px}.checkout-topbar{align-items:flex-start}.checkout-steps{display:none}.checkout-grid{grid-template-columns:1fr;margin-top:18px}.checkout-summary{position:static;order:-1}.checkout-form-card,.checkout-summary{padding:24px;border-radius:22px}.checkout-form-card h1{font-size:44px;letter-spacing:-1.8px}.checkout-two,.checkout-reassurance{grid-template-columns:1fr}.checkout-card{margin:45px auto;padding:30px 22px}.empty-checkout h1{font-size:42px}
      }
    `}</style>
  </div></main>;
}
