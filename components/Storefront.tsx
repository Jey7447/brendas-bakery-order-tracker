"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ShoppingBag, Sparkles, Minus, Plus, X, Trash2 } from "lucide-react";
import { products } from "@/lib/demo-data";

type CartLine = { productId: string; quantity: number };

const CART_KEY = "brendas-bakery-cart";
const money = (n: number) => `KSh ${n.toLocaleString()}`;

export default function Storefront() {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [openCart, setOpenCart] = useState(false);
  const [category, setCategory] = useState("All");
  const [cartReady, setCartReady] = useState(false);

  const categories = ["All", ...Array.from(new Set(products.map(p => p.category)))];
  const visible = category === "All" ? products : products.filter(p => p.category === category);
  const cartDetails = cart
    .map(line => ({ ...line, product: products.find(p => p.id === line.productId) }))
    .filter(line => line.product);
  const total = cartDetails.reduce((sum, line) => sum + line.product!.price * line.quantity, 0);
  const count = cart.reduce((sum, line) => sum + line.quantity, 0);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setCart(parsed.filter((line) => line && typeof line.productId === "string" && Number.isInteger(line.quantity) && line.quantity > 0));
        }
      }
    } catch {
      localStorage.removeItem(CART_KEY);
    } finally {
      setCartReady(true);
    }
  }, []);

  useEffect(() => {
    if (cartReady) localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart, cartReady]);

  function add(id: string) {
    setCart(current => {
      const existing = current.find(x => x.productId === id);
      if (existing) return current.map(x => x.productId === id ? { ...x, quantity: x.quantity + 1 } : x);
      return [...current, { productId: id, quantity: 1 }];
    });
  }

  function change(id: string, delta: number) {
    setCart(current => current.map(x => x.productId === id ? { ...x, quantity: x.quantity + delta } : x).filter(x => x.quantity > 0));
  }

  function clearCart() {
    setCart([]);
  }

  return (
    <main className="site-shell">
      <header className="nav">
        <Link href="/" className="brand"><span>Brenda&apos;s</span><strong>Bakery</strong></Link>
        <nav className="nav-links">
          <a href="#menu">Menu</a>
          <a href="#story">Our Story</a>
          <Link href="/dashboard">Order Book</Link>
        </nav>
        <button className="cart-button" onClick={() => setOpenCart(true)}>
          <ShoppingBag size={18} /> Cart <span>{count}</span>
        </button>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><Sparkles size={14}/> FRESH FROM THE OVEN</div>
          <h1>Good things<br/><em>take time.</em></h1>
          <p>Beautiful cakes, buttery pastries and little moments of sweetness — baked to order.</p>
          <div className="hero-actions">
            <a className="button dark" href="#menu">Explore the menu <ArrowRight size={17}/></a>
            <span className="hero-note">Made with care in Nairobi</span>
          </div>
        </div>
        <div className="hero-art">
          <div className="hero-circle" />
          <img src={products[0].image} alt="Chocolate celebration cake" />
          <div className="hero-sticker">BAKED<br/>TODAY</div>
          <div className="hero-label">01 / 04</div>
        </div>
      </section>

      <section className="marquee"><span>CAKES · PASTRIES · CUPCAKES · CELEBRATIONS · CAKES · PASTRIES · CUPCAKES · CELEBRATIONS · </span></section>

      <section id="menu" className="menu-section">
        <div className="section-heading">
          <div><div className="eyebrow">THE GOOD STUFF</div><h2>Pick your <em>favourite.</em></h2></div>
          <div className="category-picker">
            {categories.map(c => <button key={c} className={category === c ? "active" : ""} onClick={() => setCategory(c)}>{c}</button>)}
          </div>
        </div>
        <div className="product-grid">
          {visible.map((p, i) => (
            <article className="product-card" key={p.id}>
              <div className="product-image"><img src={p.image} alt={p.name}/><span>0{i+1}</span></div>
              <div className="product-info">
                <div><div className="product-category">{p.category}</div><h3>{p.name}</h3></div>
                <strong>{money(p.price)}</strong>
              </div>
              <button className="add-button" onClick={() => { add(p.id); setOpenCart(true); }}>Add to order <Plus size={16}/></button>
            </article>
          ))}
        </div>
      </section>

      <section id="story" className="story">
        <div className="story-image"><img src={products[3].image} alt="Fresh pastry"/></div>
        <div className="story-copy">
          <div className="eyebrow">A LITTLE ABOUT US</div>
          <h2>Made for the <em>moments</em> worth remembering.</h2>
          <p>From a quiet morning pastry to the cake at the centre of a big celebration, every order is made with the same attention to detail.</p>
          <a href="#menu" className="text-link">Order something lovely <ArrowRight size={16}/></a>
        </div>
      </section>

      <footer className="footer">
        <div><div className="brand"><span>Brenda&apos;s</span><strong>Bakery</strong></div><p>Small-batch bakes for everyday celebrations.</p></div>
        <div className="footer-links"><a href="#menu">Menu</a><Link href="/dashboard">Order Book</Link><Link href="/order/track">Track an order</Link></div>
        <div className="footer-small">© 2026 Brenda&apos;s Bakery</div>
      </footer>

      {openCart && (
        <div className="overlay" onClick={() => setOpenCart(false)}>
          <aside className="cart-panel" onClick={e => e.stopPropagation()}>
            <div className="cart-head">
              <h2>Your order</h2>
              <button onClick={() => setOpenCart(false)} aria-label="Close cart"><X/></button>
            </div>
            {cartDetails.length === 0 ? <div className="empty-cart"><ShoppingBag size={32}/><p>Your basket is waiting.</p></div> : <>
              <div className="cart-lines">
                {cartDetails.map(line => <div className="cart-line" key={line.productId}>
                  <img src={line.product!.image} alt=""/>
                  <div className="cart-line-main"><strong>{line.product!.name}</strong><span>{money(line.product!.price)}</span>
                    <div className="qty"><button onClick={() => change(line.productId, -1)} aria-label={`Decrease ${line.product!.name}`}><Minus size={14}/></button><span>{line.quantity}</span><button onClick={() => change(line.productId, 1)} aria-label={`Increase ${line.product!.name}`}><Plus size={14}/></button></div>
                  </div>
                </div>)}
              </div>
              <div className="cart-total"><span>Total</span><strong>{money(total)}</strong></div>
              <div className="cart-actions">
                <button className="clear-cart" onClick={clearCart}><Trash2 size={15}/> Clear</button>
                <Link className="button dark full" href="/checkout">Continue to checkout <ArrowRight size={17}/></Link>
              </div>
            </>}
          </aside>
        </div>
      )}
    </main>
  );
}
