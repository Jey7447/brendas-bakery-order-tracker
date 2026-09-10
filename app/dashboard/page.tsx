"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bell, CalendarDays, Check, ChevronRight, CircleDollarSign, Filter, LayoutDashboard, Menu, Plus, Search, Settings, X } from "lucide-react";
import { demoOrders } from "@/lib/demo-data";
import { Order, OrderItem, OrderStatus } from "@/lib/types";

const money = (n: number) => `KSh ${n.toLocaleString()}`;

type SheetOrder = {
  row_number?: number;
  "Order ID": string;
  "Created At": string;
  "Customer Name": string;
  Phone: string | number;
  Email: string;
  Items: string;
  Total: string | number;
  "Delivery Date": string;
  "Delivery Time": string;
  Address: string;
  "Payment Status": string;
  "Order Status": string;
  Notes?: string;
  "Updated At"?: string;
};

const statusLabel: Record<OrderStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PREPARING: "Preparing",
  READY: "Ready",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

function getToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function parseItems(value: string): OrderItem[] {
  return value
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const match = part.match(/^(.*?)\s+×\s*(\d+)$/);
      return {
        name: match?.[1]?.trim() || part,
        quantity: match ? Number(match[2]) : 1,
        unitPrice: 0,
      };
    });
}

function mapSheetOrder(order: SheetOrder): Order {
  const paymentStatus = order["Payment Status"] === "PAID" ? "PAID" : "UNPAID";
  const rawStatus = order["Order Status"] as OrderStatus;
  const orderStatus: OrderStatus = Object.keys(statusLabel).includes(rawStatus) ? rawStatus : "PENDING";

  return {
    id: order["Order ID"],
    createdAt: order["Created At"],
    customerName: order["Customer Name"],
    phone: String(order.Phone),
    email: order.Email,
    items: parseItems(order.Items),
    deliveryDate: order["Delivery Date"],
    deliveryTime: order["Delivery Time"],
    address: order.Address,
    total: Number(order.Total) || 0,
    paymentStatus,
    orderStatus,
    notes: order.Notes || "",
  };
}

export default function Dashboard() {
  const [orders, setOrders] = useState<Order[]>(demoOrders);
  const [view, setView] = useState<"today" | "upcoming" | "all" | "unpaid">("today");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Order | null>(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const TODAY = getToday();

  useEffect(() => {
    async function loadOrders() {
      try {
        setLoading(true);
        setLoadError("");
        const response = await fetch("/api/dashboard/orders", { cache: "no-store" });
        const data = await response.json();

        if (!response.ok || !Array.isArray(data?.orders)) {
          throw new Error(data?.message || "Could not load orders.");
        }

        setOrders(data.orders.map(mapSheetOrder));
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : "Could not load live orders.");
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, []);

  const sorted = useMemo(() => {
    return [...orders]
      .filter((o) =>
        view === "today"
          ? o.deliveryDate === TODAY
          : view === "upcoming"
            ? o.deliveryDate > TODAY
            : view === "unpaid"
              ? o.paymentStatus === "UNPAID"
              : true
      )
      .filter((o) => `${o.id} ${o.customerName} ${o.phone}`.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => `${a.deliveryDate} ${a.deliveryTime}`.localeCompare(`${b.deliveryDate} ${b.deliveryTime}`));
  }, [orders, view, query, TODAY]);

  const todayUnpaid = orders.filter((o) => o.deliveryDate === TODAY && o.paymentStatus === "UNPAID").length;
  const todayCount = orders.filter((o) => o.deliveryDate === TODAY).length;
  const todayRevenue = orders.filter((o) => o.deliveryDate === TODAY).reduce((s, o) => s + o.total, 0);

  function markPaid(id: string) {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, paymentStatus: "PAID" } : o)));
  }

  return (
    <div className="dashboard-shell">
      <aside className={`sidebar ${mobileNav ? "open" : ""}`}>
        <div className="dashboard-brand"><span>Brenda&apos;s</span><strong>Bakery</strong></div>
        <div className="side-label">WORKSPACE</div>
        <button className="side-item active"><LayoutDashboard size={17} /> Orders</button>
        <button className="side-item"><CalendarDays size={17} /> Calendar</button>
        <button className="side-item"><CircleDollarSign size={17} /> Products</button>
        <button className="side-item"><Settings size={17} /> Settings</button>
        <Link href="/" className="back-store">← View bakery</Link>
      </aside>

      <main className="dashboard-main">
        <header className="dash-topbar">
          <button className="mobile-menu" onClick={() => setMobileNav(!mobileNav)}><Menu /></button>
          <div><div className="eyebrow">ORDER BOOK</div><h1>Good morning, Brenda.</h1></div>
          <div className="dash-actions"><button className="icon-btn"><Bell size={18} /></button><button className="button dark small"><Plus size={16} /> Add order</button></div>
        </header>

        {loadError && (
          <div className="dashboard-notice">
            <strong>Live orders could not be loaded.</strong> {loadError} Showing the demo orders for now.
          </div>
        )}

        <section className="stats">
          <div className="stat-card"><span>Today&apos;s orders</span><strong>{loading ? "—" : todayCount}</strong><small>Delivery date: {TODAY}</small></div>
          <div className="stat-card accent"><span>Unpaid today</span><strong>{loading ? "—" : todayUnpaid}</strong><small>{todayUnpaid ? "Needs attention" : "All clear"}</small></div>
          <div className="stat-card"><span>Today&apos;s order value</span><strong>{loading ? "—" : money(todayRevenue)}</strong><small>Across today&apos;s orders</small></div>
        </section>

        <section className="orders-card">
          <div className="orders-head">
            <div><h2>{view === "today" ? "Today" : view === "upcoming" ? "Upcoming" : view === "unpaid" ? "Unpaid orders" : "All orders"}</h2><p>Sorted automatically by soonest delivery.</p></div>
            <div className="order-tools"><div className="search"><Search size={16} /><input placeholder="Search orders..." value={query} onChange={(e) => setQuery(e.target.value)} /></div><button className="filter-button"><Filter size={16} /></button></div>
          </div>

          <div className="view-tabs">
            {([["today", "Today"], ["upcoming", "Upcoming"], ["all", "All orders"], ["unpaid", "Unpaid"]] as const).map(([key, label]) => <button key={key} className={view === key ? "active" : ""} onClick={() => setView(key)}>{label}{key === "unpaid" && <span>{orders.filter((o) => o.paymentStatus === "UNPAID").length}</span>}</button>)}
          </div>

          <div className="order-list">
            {sorted.map((order) => (
              <article className={`order-row ${order.paymentStatus === "UNPAID" && order.deliveryDate === TODAY ? "needs-payment" : ""}`} key={order.id}>
                <div className="order-time"><strong>{order.deliveryTime}</strong><span>{order.deliveryDate === TODAY ? "Today" : order.deliveryDate}</span></div>
                <div className="order-customer"><strong>{order.customerName}</strong><span>{order.id} · {order.items.map((i) => `${i.name} ×${i.quantity}`).join(", ")}</span></div>
                <div className="order-status"><span className={`status-dot ${order.orderStatus.toLowerCase()}`}></span>{statusLabel[order.orderStatus]}</div>
                <div className={`payment-pill ${order.paymentStatus.toLowerCase()}`}>{order.paymentStatus === "PAID" ? <Check size={13} /> : <CircleDollarSign size={13} />} {order.paymentStatus === "PAID" ? "Paid" : "Unpaid"}</div>
                <div className="order-total">{money(order.total)}</div>
                {order.paymentStatus === "UNPAID" && <button className="pay-button" onClick={() => markPaid(order.id)}>Mark paid</button>}
                <button className="row-more" onClick={() => setEditing(order)}><ChevronRight size={18} /></button>
              </article>
            ))}
            {sorted.length === 0 && <div className="no-orders"><CalendarDays size={28} /><strong>{loading ? "Loading orders…" : "No orders here."}</strong><span>{loading ? "Connecting to Google Sheets." : "Try another view or search."}</span></div>}
          </div>
        </section>
      </main>

      {editing && <div className="overlay" onClick={() => setEditing(null)}><aside className="edit-panel" onClick={(e) => e.stopPropagation()}>
        <div className="cart-head"><div><div className="eyebrow">ORDER {editing.id}</div><h2>{editing.customerName}</h2></div><button onClick={() => setEditing(null)}><X /></button></div>
        <div className="edit-body">
          <label>Customer name<input value={editing.customerName} onChange={(e) => setEditing({ ...editing, customerName: e.target.value })} /></label>
          <label>Phone<input value={editing.phone} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} /></label>
          <div className="two"><label>Delivery date<input type="date" value={editing.deliveryDate} onChange={(e) => setEditing({ ...editing, deliveryDate: e.target.value })} /></label><label>Time<input type="time" value={editing.deliveryTime} onChange={(e) => setEditing({ ...editing, deliveryTime: e.target.value })} /></label></div>
          <label>Address<textarea value={editing.address} onChange={(e) => setEditing({ ...editing, address: e.target.value })} /></label>
          <div className="two"><label>Payment<select value={editing.paymentStatus} onChange={(e) => setEditing({ ...editing, paymentStatus: e.target.value as Order["paymentStatus"] })}><option>UNPAID</option><option>PAID</option></select></label><label>Status<select value={editing.orderStatus} onChange={(e) => setEditing({ ...editing, orderStatus: e.target.value as OrderStatus })}>{Object.keys(statusLabel).map((s) => <option key={s}>{s}</option>)}</select></label></div>
          <label>Notes<textarea value={editing.notes || ""} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} /></label>
        </div>
        <div className="edit-footer"><button className="button light" onClick={() => setEditing(null)}>Cancel</button><button className="button dark" onClick={() => { setOrders((prev) => prev.map((o) => o.id === editing.id ? editing : o)); setEditing(null); }}>Save changes <Check size={16} /></button></div>
      </aside></div>}
    </div>
  );
}
