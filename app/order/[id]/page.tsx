 "use client";

import Link from "next/link";
import { Check, Clock3, PackageCheck, Truck } from "lucide-react";

export default function OrderPage({ params }: { params: { id: string } }) {
  return (
    <main className="tracking-page">
      <div className="tracking-card">
        <Link href="/" className="back-link">← Brenda&apos;s Bakery</Link>
        <div className="success-mark"><Check/></div>
        <div className="eyebrow">ORDER {params.id}</div>
        <h1>We&apos;ve got it.</h1>
        <p>Your order has been received. We&apos;ll send a confirmation to your email and let you know when it&apos;s ready.</p>
        <div className="timeline">
          <div className="timeline-item active"><span><Check size={16}/></span><div><strong>Order received</strong><small>Just now</small></div></div>
          <div className="timeline-item"><span><Clock3 size={16}/></span><div><strong>Confirmed</strong><small>We&apos;ll confirm your order shortly.</small></div></div>
          <div className="timeline-item"><span><PackageCheck size={16}/></span><div><strong>Being prepared</strong></div></div>
          <div className="timeline-item"><span><Truck size={16}/></span><div><strong>Ready / delivered</strong></div></div>
        </div>
        <Link className="button dark full" href="/">Back to the bakery</Link>
      </div>
    </main>
  );
}
