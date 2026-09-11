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

function parseLocalDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatMonthTitle(date: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(date);
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function calendarDays(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = new Date(first);
  start.setDate(1 - first.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
}

export default function Dashboard() {
  const [orders, setOrders] = useState<Order[]>(demoOrders);
  const [view, setView] = useState<"today" | "upcoming" | "all" | "unpaid">("today");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Order | null>(null);
  const [viewing, setViewing] = useState<Order | null>(null);
  const [adding, setAdding] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [calendarView, setCalendarView] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const today = parseLocalDate(getToday());
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(getToday());
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
  const monthDays = useMemo(() => calendarDays(calendarMonth), [calendarMonth]);
  const selectedDayOrders = useMemo(
    () => orders.filter((order) => order.deliveryDate === selectedCalendarDate).sort((a, b) => a.deliveryTime.localeCompare(b.deliveryTime)),
    [orders, selectedCalendarDate]
  );

  function openCalendar(date = TODAY) {
    const parsed = parseLocalDate(date);
    setCalendarMonth(new Date(parsed.getFullYear(), parsed.getMonth(), 1));
    setSelectedCalendarDate(date);
    setCalendarView(true);
    setMobileNav(false);
  }

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
      setViewing((prev) => prev?.id === id ? { ...prev, paymentStatus: "PAID" } : prev);
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
      setViewing((prev) => prev?.id === id ? { ...prev, orderStatus: nextStatus } : prev);
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
      <style jsx>{`
        .bakery-calendar-grid { display:grid; grid-template-columns:repeat(7,minmax(0,1fr)); border-top:1px solid var(--line); border-left:1px solid var(--line); }
        .bakery-calendar-heading { padding:11px 8px; border-right:1px solid var(--line); border-bottom:1px solid var(--line); font-size:9px; font-weight:800; color:var(--muted); text-transform:uppercase; letter-spacing:.08em; }
        .bakery-calendar-day { min-height:105px; padding:10px; text-align:left; vertical-align:top; border:0; border-right:1px solid var(--line); border-bottom:1px solid var(--line); background:var(--paper); cursor:pointer; outline:none; }
        .bakery-calendar-day.selected { background:#f0e1d6; outline:2px solid var(--rust); outline-offset:-2px; }
        .bakery-calendar-day.today { background:#fff9f4; }
        .bakery-calendar-day.today.selected { background:#f0e1d6; }
        .bakery-calendar-day.outside { opacity:.42; }
        .bakery-calendar-number { display:inline-grid; place-items:center; width:25px; height:25px; border-radius:50%; font-size:11px; font-weight:800; }
        .bakery-calendar-day.today .bakery-calendar-number { background:var(--ink); color:white; }
        .bakery-calendar-badges { margin-top:8px; display:grid; gap:5px; }
        .bakery-calendar-badges span { display:inline-flex; width:fit-content; padding:4px 6px; border-radius:99px; background:var(--ink); color:white; font-size:8px; font-weight:800; }
        .bakery-calendar-badges .unpaid-badge { background:#f8e4d6; color:#9c3e16; }
        .calendar-order-row { width:100%; display:grid; grid-template-columns:75px 1fr auto auto; align-items:center; gap:14px; padding:14px 18px; border:0; border-bottom:1px solid var(--line); background:transparent; text-align:left; }
        .calendar-order-row:hover { background:#fff9f4; }
        .calendar-order-row > span:nth-child(2) > strong { display:block; font-size:12px; }
        .calendar-order-row > span:nth-child(2) > small { display:block; margin-top:3px; color:var(--muted); font-size:9px; }
        @media (max-width:700px) {
          .orders-head { align-items:flex-start; gap:15px; }
          .orders-head > div:last-child { flex-shrink:0; }
          .bakery-calendar-day { min-height:78px; padding:6px; }
          .bakery-calendar-heading { padding:8px 4px; font-size:8px; }
          .bakery-calendar-badges span { font-size:7px; padding:3px 4px; }
          .bakery-calendar-badges .unpaid-badge { display:none; }
          .calendar-order-row { grid-template-columns:52px 1fr auto; gap:9px; padding:12px; }
          .calendar-order-row > strong:last-child { display:none; }
          .calendar-order-row .payment-pill { justify-self:end; }
        }
      `}</style>
      <aside className={`sidebar ${mobileNav ? "open" : ""}`}>
        <div className="dashboard-brand"><span>Brenda&apos;s</span><strong>Bakery</strong></div>
        <div className="side-label">WORKSPACE</div>
        <button type="button" className={`side-item ${!calendarView ? "active" : ""}`} onClick={() => { setCalendarView(false); setMobileNav(false); }}><LayoutDashboard size={17} /> Orders</button>
        <button type="button" className={`side-item ${calendarView ? "active" : ""}`} onClick={() => { setCalendarView(true); setMobileNav(false); }}><CalendarDays size={17} /> Calendar</button>
        <button type="button" className="side-item"><CircleDollarSign size={17} /> Products</button>
        <button type="button" className="side-item"><Settings size={17} /> Settings</button>
        <Link href="/" className="back-store">← View bakery</Link>
      </aside>
      <main className="dashboard-main">
        <header className="dash-topbar">
          <div style={{ display: "flex", alignItems: "center" }}><button type="button" className="mobile-menu" onClick={() => setMobileNav(!mobileNav)}><Menu /></button><div><div className="eyebrow">ORDER BOOK</div><h1>Good morning, Brenda.</h1></div></div>
          <div className="dash-actions"><button type="button" className="icon-btn"><Bell size={18} /></button><button type="button" className="button dark small" onClick={() => { resetNewOrder(); setAdding(true); }}><Plus size={16} /> Add order</button></div>
        </header>
        {loadError && <div className="dashboard-notice"><strong>Action or live-order warning:</strong> {loadError}</div>}
        <section className="stats">
          <div className="stat-card"><span>Today&apos;s orders</span><strong>{loading ? "—" : todayCount}</strong><small>Delivery date: {TODAY}</small></div>
          <div className="stat-card accent"><span>Unpaid today</span><strong>{loading ? "—" : todayUnpaid}</strong><small>{todayUnpaid ? "Needs attention" : "All clear"}</small></div>
          <div className="stat-card"><span>Today&apos;s order value</span><strong>{loading ? "—" : money(todayRevenue)}</strong><small>Across today&apos;s orders</small></div>
        </section>

        {calendarView && <section className="orders-card" style={{ overflow: "visible" }}>
          <div className="orders-head">
            <div><div className="eyebrow">DELIVERY CALENDAR</div><h2>{formatMonthTitle(calendarMonth)}</h2><p>Click a date to see that day&apos;s orders.</p></div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}><button type="button" className="button light small" onClick={() => openCalendar(TODAY)}>Today</button><button type="button" className="icon-btn" aria-label="Previous month" onClick={() => setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}>‹</button><button type="button" className="icon-btn" aria-label="Next month" onClick={() => setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}>›</button></div>
          </div>
          <div style={{ padding: "0 25px 25px" }}>
            <div className="bakery-calendar-grid">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <div key={day} className="bakery-calendar-heading">{day}</div>)}
              {monthDays.map((day) => {
                const key = toDateKey(day);
                const dayOrders = orders.filter((order) => order.deliveryDate === key);
                const isCurrentMonth = day.getFullYear() === calendarMonth.getFullYear() && day.getMonth() === calendarMonth.getMonth();
                const isToday = key === TODAY;
                const isSelected = key === selectedCalendarDate;
                const unpaid = dayOrders.filter((order) => order.paymentStatus === "UNPAID").length;
                return <button key={key} type="button" onClick={() => setSelectedCalendarDate(key)} className={`bakery-calendar-day ${isSelected ? "selected" : ""} ${isToday ? "today" : ""} ${!isCurrentMonth ? "outside" : ""}`}><span className="bakery-calendar-number">{day.getDate()}</span>{dayOrders.length > 0 && <div className="bakery-calendar-badges"><span>{dayOrders.length} order{dayOrders.length === 1 ? "" : "s"}</span>{unpaid > 0 && <span className="unpaid-badge">{unpaid} unpaid</span>}</div>}</button>;
              })}
            </div>
            <div style={{ marginTop: 18, border: "1px solid var(--line)", borderRadius: 10, background: "var(--paper)", overflow: "hidden" }}>
              <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", gap: 15, alignItems: "center" }}><div><div className="eyebrow">SELECTED DAY</div><strong style={{ display: "block", marginTop: 4, fontFamily: "DM Serif Display", fontSize: 23 }}>{new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(parseLocalDate(selectedCalendarDate))}</strong></div><span style={{ fontSize: 10, color: "var(--muted)" }}>{selectedDayOrders.length} order{selectedDayOrders.length === 1 ? "" : "s"}</span></div>
              {selectedDayOrders.length > 0 ? selectedDayOrders.map((order) => <button type="button" key={`${order.id}-${order.rowNumber ?? order.deliveryTime}`} onClick={() => setViewing(order)} className="calendar-order-row"><strong>{order.deliveryTime}</strong><span><strong>{order.customerName}</strong><small>{order.items.map((item) => `${item.name} ×${item.quantity}`).join(", ")}</small></span><span className={`payment-pill ${order.paymentStatus.toLowerCase()}`}>{order.paymentStatus === "PAID" ? "Paid" : "Unpaid"}</span><strong>{money(order.total)}</strong></button>) : <div style={{ padding: 30, textAlign: "center", color: "var(--muted)", fontSize: 11 }}>No orders scheduled for this date.</div>}
            </div>
          </div>
        </section>}

        {!calendarView && <section className="orders-card">
          <div className="orders-head"><div><h2>{view === "today" ? "Today" : view === "upcoming" ? "Upcoming" : view === "unpaid" ? "Unpaid orders" : "All orders"}</h2><p>Sorted automatically by soonest delivery.</p></div><div className="order-tools" style={{ position: "relative" }}><div className="search"><Search size={16} /><input placeholder="Search orders..." value={query} onChange={(e) => setQuery(e.target.value)} /></div><button type="button" className={`filter-button ${activeFilterCount ? "active" : ""}`} aria-label="Open filters" aria-expanded={filtersOpen} onClick={() => setFiltersOpen((open) => !open)}><Filter size={16} />{activeFilterCount > 0 && <span style={{ position: "absolute", top: -5, right: -5, minWidth: 16, height: 16, borderRadius: 99, background: "var(--ink)", color: "white", fontSize: 9, display: "grid", placeItems: "center", fontWeight: 800 }}>{activeFilterCount}</span>}</button>
            {filtersOpen && <div style={{ position: "absolute", top: 46, right: 0, zIndex: 20, width: 280, background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 10, padding: 16, boxShadow: "0 18px 45px rgba(0,0,0,.14)" }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}><strong style={{ fontSize: 13 }}>Filter orders</strong><button type="button" aria-label="Close filters" onClick={() => setFiltersOpen(false)} style={{ border: 0, background: "transparent", cursor: "pointer", padding: 2 }}><X size={16} /></button></div>
              <label style={{ display: "grid", gap: 6, fontSize: 10, fontWeight: 800, marginBottom: 12 }}>PAYMENT<select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value as PaymentFilter)} style={fieldStyle}><option value="ALL">All payments</option><option value="PAID">Paid</option><option value="UNPAID">Unpaid</option></select></label>