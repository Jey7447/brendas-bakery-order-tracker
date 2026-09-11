"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import Link from "next/link";
import { Bell, CalendarDays, Check, ChevronRight, CircleDollarSign, Filter, LayoutDashboard, Menu, Plus, Search, Settings, X } from "lucide-react";
import { demoOrders, products } from "@/lib/demo-data";
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
};

type NewOrderItem = { productId: string; quantity: number };
type PaymentFilter = "ALL" | "PAID" | "UNPAID";
type DeliveryFilter = "ALL" | "TODAY" | "UPCOMING";

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
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

function parseItems(value: string): OrderItem[] {
  return value.split(";").map((part) => part.trim()).filter(Boolean).map((part) => {
    const match = part.match(/^(.*?)\s+×\s*(\d+)$/);
    return { name: match?.[1]?.trim() || part, quantity: match ? Number(match[2]) : 1, unitPrice: 0 };
  });
}

function mapSheetOrder(order: SheetOrder): Order {
  const paymentStatus = order["Payment Status"] === "PAID" ? "PAID" : "UNPAID";
  const rawStatus = order["Order Status"] as OrderStatus;
  const orderStatus: OrderStatus = Object.keys(statusLabel).includes(rawStatus) ? rawStatus : "PENDING";
  return {
    id: order["Order ID"], rowNumber: order.row_number, createdAt: order["Created At"], customerName: order["Customer Name"],
    phone: String(order.Phone), email: order.Email, items: parseItems(order.Items), deliveryDate: order["Delivery Date"],
    deliveryTime: order["Delivery Time"], address: order.Address, total: Number(order.Total) || 0, paymentStatus, orderStatus, notes: order.Notes || "",
  };
}

const panelStyle: CSSProperties = { width: "min(560px,100%)", height: "100%", background: "var(--paper)", padding: 30, overflow: "auto", boxShadow: "-20px 0 60px rgba(0,0,0,.12)" };
const fieldStyle: CSSProperties = { width: "100%", border: "1px solid var(--line)", background: "white", borderRadius: 7, padding: 11, fontSize: 12, outline: "none" };

export default function Dashboard() {
  const [orders, setOrders] = useState<Order[]>(demoOrders);
  const [view, setView] = useState<"today" | "upcoming" | "all" | "unpaid">("today");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Order | null>(null);
  const [adding, setAdding] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [payingId, setPayingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [statusSavingId, setStatusSavingId] = useState<string | null>(null);
  const [addingOrder, setAddingOrder] = useState(false);
  const [newOrder, setNewOrder] = useState({ customerName: "", phone: "", email: "", deliveryDate: getToday(), deliveryTime: "12:00", address: "", notes: "" });
  const [newItems, setNewItems] = useState<NewOrderItem[]>([{ productId: products[0].id, quantity: 1 }]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "ALL">("ALL");
  const [deliveryFilter, setDeliveryFilter] = useState<DeliveryFilter>("ALL");
  const TODAY = getToday();

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true); setLoadError("");
      const response = await fetch("/api/dashboard/orders", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok || !Array.isArray(data?.orders)) throw new Error(data?.message || "Could not load orders.");
      setOrders(data.orders.map(mapSheetOrder));
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Could not load live orders.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const activeFilterCount = [paymentFilter !== "ALL", statusFilter !== "ALL", deliveryFilter !== "ALL"].filter(Boolean).length;

  const sorted = useMemo(() => [...orders]
    .filter((o) => view === "today" ? o.deliveryDate === TODAY : view === "upcoming" ? o.deliveryDate > TODAY : view === "unpaid" ? o.paymentStatus === "UNPAID" : true)
    .filter((o) => deliveryFilter === "ALL" ? true : deliveryFilter === "TODAY" ? o.deliveryDate === TODAY : o.deliveryDate > TODAY)
    .filter((o) => paymentFilter === "ALL" || o.paymentStatus === paymentFilter)
    .filter((o) => statusFilter === "ALL" || o.orderStatus === statusFilter)
    .filter((o) => `${o.id} ${o.customerName} ${o.phone}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => `${a.deliveryDate} ${a.deliveryTime}`.localeCompare(`${b.deliveryDate} ${b.deliveryTime}`)), [orders, view, query, TODAY, paymentFilter, statusFilter, deliveryFilter]);

  const todayUnpaid = orders.filter((o) => o.deliveryDate === TODAY && o.paymentStatus === "UNPAID").length;
  const todayCount = orders.filter((o) => o.deliveryDate === TODAY).length;
  const todayRevenue = orders.filter((o) => o.deliveryDate === TODAY).reduce((s, o) => s + o.total, 0);
  const newOrderTotal = newItems.reduce((sum, item) => {
    const product = products.find((p) => p.id === item.productId);
    return sum + (product?.price || 0) * item.quantity;
  }, 0);

  function resetFilters() {
    setPaymentFilter("ALL");
    setStatusFilter("ALL");
    setDeliveryFilter("ALL");
  }

  function resetNewOrder() {
    setNewOrder({ customerName: "", phone: "", email: "", deliveryDate: TODAY, deliveryTime: "12:00", address: "", notes: "" });
    setNewItems([{ productId: products[0].id, quantity: 1 }]);
  }

  async function submitNewOrder(event: FormEvent) {
    event.preventDefault();
    if (addingOrder || !newOrder.customerName || !newOrder.phone || !newOrder.email || !newOrder.deliveryDate || !newOrder.deliveryTime || !newOrder.address || newOrderTotal <= 0) return;
    try {
      setAddingOrder(true); setLoadError("");
      const items = newItems.map((item) => {
        const product = products.find((p) => p.id === item.productId)!;
        return { name: product.name, quantity: item.quantity, unitPrice: product.price };
      });
      const response = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...newOrder, items, total: newOrderTotal }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data?.ok === false) throw new Error(data?.message || "Could not create the order.");
      const created: Order = { id: data.orderId, createdAt: new Date().toISOString(), customerName: newOrder.customerName, phone: newOrder.phone, email: newOrder.email, items, deliveryDate: newOrder.deliveryDate, deliveryTime: newOrder.deliveryTime, address: newOrder.address, total: newOrderTotal, paymentStatus: "UNPAID", orderStatus: "PENDING", notes: newOrder.notes };
      setOrders((prev) => [...prev, created]); setAdding(false); resetNewOrder(); setView("all");
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Could not create the order.");
    } finally { setAddingOrder(false); }
  }

  async function markPaid(id: string) {
    if (payingId || savingId || statusSavingId) return;
    try {
      setPayingId(id); setLoadError("");
      const response = await fetch("/api/dashboard/mark-paid", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId: id }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data?.success === false || data?.ok === false) throw new Error(data?.message || "Could not mark the order as paid.");
      setOrders((prev) => prev.map((o) => o.id === id ? { ...o, paymentStatus: "PAID" } : o));
    } catch (error) { setLoadError(error instanceof Error ? error.message : "Could not mark the order as paid."); }
    finally { setPayingId(null); }
  }

  async function updateOrderStatus(id: string, nextStatus: OrderStatus) {
    if (statusSavingId || payingId || savingId) return;
    const orderToSave = orders.find((order) => order.id === id);
    if (!orderToSave || orderToSave.orderStatus === nextStatus) return;
    const previousStatus = orderToSave.orderStatus;
    try {
      setStatusSavingId(id); setLoadError("");
      const response = await fetch("/api/dashboard/update-order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId: orderToSave.id, customerName: orderToSave.customerName, phone: orderToSave.phone, deliveryDate: orderToSave.deliveryDate, deliveryTime: orderToSave.deliveryTime, address: orderToSave.address, paymentStatus: orderToSave.paymentStatus, orderStatus: nextStatus, notes: orderToSave.notes || "" }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data?.success === false || data?.ok === false) throw new Error(data?.message || "Could not update the order status.");
      setOrders((prev) => prev.map((o) => o.id === id ? { ...o, orderStatus: nextStatus } : o));
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Could not update the order status.");
      setOrders((prev) => prev.map((o) => o.id === id ? { ...o, orderStatus: previousStatus } : o));
    } finally { setStatusSavingId(null); }
  }

  async function saveOrderChanges() {
    if (!editing || savingId) return;
    const orderToSave = editing;
    try {
      setSavingId(orderToSave.id); setLoadError("");
      const response = await fetch("/api/dashboard/update-order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId: orderToSave.id, customerName: orderToSave.customerName, phone: orderToSave.phone, deliveryDate: orderToSave.deliveryDate, deliveryTime: orderToSave.deliveryTime, address: orderToSave.address, paymentStatus: orderToSave.paymentStatus, orderStatus: orderToSave.orderStatus, notes: orderToSave.notes || "" }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data?.success === false || data?.ok === false) throw new Error(data?.message || "Could not save the order changes.");
      setOrders((prev) => prev.map((o) => o.id === orderToSave.id ? orderToSave : o)); setEditing(null);
    } catch (error) { setLoadError(error instanceof Error ? error.message : "Could not save the order changes."); }
    finally { setSavingId(null); }
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
          <div style={{ display: "flex", alignItems: "center" }}><button className="mobile-menu" onClick={() => setMobileNav(!mobileNav)}><Menu /></button><div><div className="eyebrow">ORDER BOOK</div><h1>Good morning, Brenda.</h1></div></div>
          <div className="dash-actions"><button className="icon-btn"><Bell size={18} /></button><button className="button dark small" onClick={() => { resetNewOrder(); setAdding(true); }}><Plus size={16} /> Add order</button></div>
        </header>
        {loadError && <div className="dashboard-notice"><strong>Action or live-order warning:</strong> {loadError}</div>}
        <section className="stats">
          <div className="stat-card"><span>Today&apos;s orders</span><strong>{loading ? "—" : todayCount}</strong><small>Delivery date: {TODAY}</small></div>
          <div className="stat-card accent"><span>Unpaid today</span><strong>{loading ? "—" : todayUnpaid}</strong><small>{todayUnpaid ? "Needs attention" : "All clear"}</small></div>
          <div className="stat-card"><span>Today&apos;s order value</span><strong>{loading ? "—" : money(todayRevenue)}</strong><small>Across today&apos;s orders</small></div>
        </section>
        <section className="orders-card">
          <div className="orders-head"><div><h2>{view === "today" ? "Today" : view === "upcoming" ? "Upcoming" : view === "unpaid" ? "Unpaid orders" : "All orders"}</h2><p>Sorted automatically by soonest delivery.</p></div><div className="order-tools" style={{ position: "relative" }}><div className="search"><Search size={16} /><input placeholder="Search orders..." value={query} onChange={(e) => setQuery(e.target.value)} /></div><button className={`filter-button ${activeFilterCount ? "active" : ""}`} aria-label="Open filters" aria-expanded={filtersOpen} onClick={() => setFiltersOpen((open) => !open)}><Filter size={16} />{activeFilterCount > 0 && <span style={{ position: "absolute", top: -5, right: -5, minWidth: 16, height: 16, borderRadius: 99, background: "var(--ink)", color: "white", fontSize: 9, display: "grid", placeItems: "center", fontWeight: 800 }}>{activeFilterCount}</span>}</button>
            {filtersOpen && <div style={{ position: "absolute", top: 46, right: 0, zIndex: 20, width: 280, background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 10, padding: 16, boxShadow: "0 18px 45px rgba(0,0,0,.14)" }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}><strong style={{ fontSize: 13 }}>Filter orders</strong><button aria-label="Close filters" onClick={() => setFiltersOpen(false)} style={{ border: 0, background: "transparent", cursor: "pointer", padding: 2 }}><X size={16} /></button></div>
              <label style={{ display: "grid", gap: 6, fontSize: 10, fontWeight: 800, marginBottom: 12 }}>PAYMENT<select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value as PaymentFilter)} style={fieldStyle}><option value="ALL">All payments</option><option value="PAID">Paid</option><option value="UNPAID">Unpaid</option></select></label>
              <label style={{ display: "grid", gap: 6, fontSize: 10, fontWeight: 800, marginBottom: 12 }}>ORDER STATUS<select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as OrderStatus | "ALL")} style={fieldStyle}><option value="ALL">All statuses</option>{Object.entries(statusLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label style={{ display: "grid", gap: 6, fontSize: 10, fontWeight: 800 }}>DELIVERY<select value={deliveryFilter} onChange={(e) => setDeliveryFilter(e.target.value as DeliveryFilter)} style={fieldStyle}><option value="ALL">All delivery dates</option><option value="TODAY">Today</option><option value="UPCOMING">Upcoming</option></select></label>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 15, paddingTop: 13, borderTop: "1px solid var(--line)" }}><span style={{ fontSize: 10, color: "var(--muted)" }}>{sorted.length} matching order{sorted.length === 1 ? "" : "s"}</span><button type="button" className="text-link" onClick={resetFilters}>Clear filters</button></div>
            </div>}
          </div></div>
          <div className="view-tabs">{([["today", "Today"], ["upcoming", "Upcoming"], ["all", "All orders"], ["unpaid", "Unpaid"]] as const).map(([key, label]) => <button key={key} className={view === key ? "active" : ""} onClick={() => setView(key)}>{label}{key === "unpaid" && <span>{orders.filter((o) => o.paymentStatus === "UNPAID").length}</span>}</button>)}</div>
          <div className="order-list">
            {sorted.map((order, index) => <article className={`order-row ${order.paymentStatus === "UNPAID" && order.deliveryDate === TODAY ? "needs-payment" : ""}`} key={`${order.id}-${order.rowNumber ?? index}`}>
              <div className="order-time"><strong>{order.deliveryTime}</strong><span>{order.deliveryDate === TODAY ? "Today" : order.deliveryDate}</span></div>
              <div className="order-customer"><strong>{order.customerName}</strong><span>{order.id} · {order.items.map((i) => `${i.name} ×${i.quantity}`).join(", ")}</span></div>
              <div className="order-status"><span className={`status-dot ${order.orderStatus.toLowerCase()}`}></span><select aria-label={`Change status for ${order.customerName}`} value={order.orderStatus} disabled={statusSavingId === order.id || Boolean(payingId) || Boolean(savingId)} onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)} style={{ border: "0", background: "transparent", outline: "none", fontSize: "11px", color: "inherit", fontWeight: 600, padding: "2px 18px 2px 0", cursor: statusSavingId === order.id ? "wait" : "pointer" }}>{Object.entries(statusLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
              <div className={`payment-pill ${order.paymentStatus.toLowerCase()}`}>{order.paymentStatus === "PAID" ? <Check size={13} /> : <CircleDollarSign size={13} />} {order.paymentStatus === "PAID" ? "Paid" : "Unpaid"}</div>
              <div className="order-total">{money(order.total)}</div>
              {order.paymentStatus === "UNPAID" && <button className="pay-button" disabled={payingId === order.id || savingId === order.id || statusSavingId === order.id} onClick={() => markPaid(order.id)}>{payingId === order.id ? "Saving…" : "Mark paid"}</button>}
              <button className="row-more" disabled={Boolean(statusSavingId)} onClick={() => setEditing(order)}><ChevronRight size={18} /></button>
            </article>)}
            {sorted.length === 0 && <div className="no-orders"><CalendarDays size={28} /><strong>{loading ? "Loading orders…" : "No orders here."}</strong><span>{loading ? "Connecting to Google Sheets." : "Try another view, search, or filter."}</span></div>}
          </div>
        </section>
      </main>

      {editing && <div className="overlay" onClick={() => !savingId && setEditing(null)}><aside className="edit-panel" onClick={(e) => e.stopPropagation()}><div className="cart-head"><div><div className="eyebrow">ORDER {editing.id}</div><h2>{editing.customerName}</h2></div><button disabled={Boolean(savingId)} onClick={() => setEditing(null)}><X /></button></div><div className="edit-body">
        <label>Customer name<input value={editing.customerName} onChange={(e) => setEditing({ ...editing, customerName: e.target.value })} /></label><label>Phone<input value={editing.phone} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} /></label><div className="two"><label>Delivery date<input type="date" value={editing.deliveryDate} onChange={(e) => setEditing({ ...editing, deliveryDate: e.target.value })} /></label><label>Time<input type="time" value={editing.deliveryTime} onChange={(e) => setEditing({ ...editing, deliveryTime: e.target.value })} /></label></div><label>Address<textarea value={editing.address} onChange={(e) => setEditing({ ...editing, address: e.target.value })} /></label><div className="two"><label>Payment<select value={editing.paymentStatus} onChange={(e) => setEditing({ ...editing, paymentStatus: e.target.value as Order["paymentStatus"] })}><option>UNPAID</option><option>PAID</option></select></label><label>Status<select value={editing.orderStatus} onChange={(e) => setEditing({ ...editing, orderStatus: e.target.value as OrderStatus })}>{Object.keys(statusLabel).map((s) => <option key={s}>{s}</option>)}</select></label></div><label>Notes<textarea value={editing.notes || ""} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} /></label>
      </div><div className="edit-footer"><button className="button light" disabled={Boolean(savingId)} onClick={() => setEditing(null)}>Cancel</button><button className="button dark" disabled={savingId === editing.id} onClick={saveOrderChanges}>{savingId === editing.id ? "Saving…" : <>Save changes <Check size={16} /></>}</button></div></aside></div>}

      {adding && <div className="overlay" onClick={() => !addingOrder && setAdding(false)}><aside style={panelStyle} onClick={(e) => e.stopPropagation()}><div className="cart-head"><div><div className="eyebrow">NEW ORDER</div><h2>Add an order</h2></div><button disabled={addingOrder} onClick={() => setAdding(false)}><X /></button></div>
        <form onSubmit={submitNewOrder} style={{ paddingTop: 25, display: "grid", gap: 15 }}>
          <label style={{ fontSize: 10, fontWeight: 800, display: "grid", gap: 6 }}>Customer name<input required style={fieldStyle} value={newOrder.customerName} onChange={(e) => setNewOrder({ ...newOrder, customerName: e.target.value })} /></label>
          <div className="two"><label style={{ fontSize: 10, fontWeight: 800, display: "grid", gap: 6 }}>Phone<input required style={fieldStyle} value={newOrder.phone} onChange={(e) => setNewOrder({ ...newOrder, phone: e.target.value })} /></label><label style={{ fontSize: 10, fontWeight: 800, display: "grid", gap: 6 }}>Email<input required type="email" style={fieldStyle} value={newOrder.email} onChange={(e) => setNewOrder({ ...newOrder, email: e.target.value })} /></label></div>
          <div className="two"><label style={{ fontSize: 10, fontWeight: 800, display: "grid", gap: 6 }}>Delivery date<input required type="date" style={fieldStyle} value={newOrder.deliveryDate} onChange={(e) => setNewOrder({ ...newOrder, deliveryDate: e.target.value })} /></label><label style={{ fontSize: 10, fontWeight: 800, display: "grid", gap: 6 }}>Delivery time<input required type="time" style={fieldStyle} value={newOrder.deliveryTime} onChange={(e) => setNewOrder({ ...newOrder, deliveryTime: e.target.value })} /></label></div>
          <label style={{ fontSize: 10, fontWeight: 800, display: "grid", gap: 6 }}>Address<textarea required style={{ ...fieldStyle, minHeight: 70, resize: "vertical" }} value={newOrder.address} onChange={(e) => setNewOrder({ ...newOrder, address: e.target.value })} /></label>
          <div style={{ borderTop: "1px solid var(--line)", paddingTop: 16 }}><div style={{ fontSize: 10, fontWeight: 800, marginBottom: 10 }}>Items</div>{newItems.map((item, index) => <div key={index} style={{ display: "grid", gridTemplateColumns: "1fr 70px 32px", gap: 8, marginBottom: 8 }}><select style={fieldStyle} value={item.productId} onChange={(e) => setNewItems((prev) => prev.map((x, i) => i === index ? { ...x, productId: e.target.value } : x))}>{products.map((p) => <option key={p.id} value={p.id}>{p.name} — {money(p.price)}</option>)}</select><input min={1} type="number" style={fieldStyle} value={item.quantity} onChange={(e) => setNewItems((prev) => prev.map((x, i) => i === index ? { ...x, quantity: Math.max(1, Number(e.target.value) || 1) } : x))} />{newItems.length > 1 ? <button type="button" style={{ border: "1px solid var(--line)", borderRadius: 7 }} onClick={() => setNewItems((prev) => prev.filter((_, i) => i !== index))}><X size={14} /></button> : <span />}</div>)}<button type="button" className="text-link" onClick={() => setNewItems((prev) => [...prev, { productId: products[0].id, quantity: 1 }])}>+ Add another item</button></div>
          <label style={{ fontSize: 10, fontWeight: 800, display: "grid", gap: 6 }}>Notes<textarea style={{ ...fieldStyle, minHeight: 70, resize: "vertical" }} value={newOrder.notes} onChange={(e) => setNewOrder({ ...newOrder, notes: e.target.value })} /></label>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderTop: "1px solid var(--line)" }}><span style={{ fontSize: 12, fontWeight: 700 }}>Order total</span><strong style={{ fontFamily: "DM Serif Display", fontSize: 26 }}>{money(newOrderTotal)}</strong></div>
          <div className="edit-footer"><button type="button" className="button light" disabled={addingOrder} onClick={() => setAdding(false)}>Cancel</button><button type="submit" className="button dark" disabled={addingOrder || newOrderTotal <= 0}>{addingOrder ? "Adding…" : <>Create order <Check size={16} /></>}</button></div>
        </form>
      </aside></div>}
    </div>
  );
}
