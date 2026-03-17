import { useState, useEffect, useRef, useCallback } from "react";

// ─── Utility helpers ───
const uid = () => Math.random().toString(36).slice(2, 10);
const fmt = (n) => "₹" + Number(n || 0).toFixed(2);
const now = () => new Date().toISOString();
const today = () => new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

// ─── localStorage persistence ───
function useStore(key, fallback) {
  const [val, setVal] = useState(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : fallback; }
    catch { return fallback; }
  });
  useEffect(() => { localStorage.setItem(key, JSON.stringify(val)); }, [key, val]);
  return [val, setVal];
}

// ─── Default seed data ───
const DEFAULT_CATEGORIES = [
  { id: "cat_cake", name: "Cakes", icon: "🎂" },
  { id: "cat_pastry", name: "Pastries", icon: "🥐" },
  { id: "cat_icecream", name: "Ice Cream", icon: "🍦" },
  { id: "cat_decoration", name: "Decorations", icon: "🎀" },
  { id: "cat_other", name: "Other Items", icon: "📦" },
];

const DEFAULT_PRODUCTS = [
  { id: uid(), catId: "cat_cake", name: "Black Forest Cake (1kg)", buyPrice: 350, sellPrice: 600, qty: 8 },
  { id: uid(), catId: "cat_cake", name: "Butterscotch Cake (500g)", buyPrice: 200, sellPrice: 380, qty: 12 },
  { id: uid(), catId: "cat_cake", name: "Red Velvet Cake (1kg)", buyPrice: 400, sellPrice: 700, qty: 5 },
  { id: uid(), catId: "cat_cake", name: "Pineapple Cake (500g)", buyPrice: 180, sellPrice: 350, qty: 10 },
  { id: uid(), catId: "cat_pastry", name: "Chocolate Éclair", buyPrice: 25, sellPrice: 50, qty: 30 },
  { id: uid(), catId: "cat_pastry", name: "Veg Puff", buyPrice: 15, sellPrice: 35, qty: 50 },
  { id: uid(), catId: "cat_pastry", name: "Chicken Sandwich", buyPrice: 30, sellPrice: 60, qty: 20 },
  { id: uid(), catId: "cat_icecream", name: "Vanilla Scoop", buyPrice: 20, sellPrice: 50, qty: 100 },
  { id: uid(), catId: "cat_icecream", name: "Butterscotch Cone", buyPrice: 25, sellPrice: 55, qty: 60 },
  { id: uid(), catId: "cat_decoration", name: "Fondant Flowers (set)", buyPrice: 80, sellPrice: 180, qty: 25 },
  { id: uid(), catId: "cat_decoration", name: "Edible Glitter (50g)", buyPrice: 60, sellPrice: 150, qty: 40 },
  { id: uid(), catId: "cat_other", name: "Paper Cups (100pcs)", buyPrice: 45, sellPrice: 90, qty: 200 },
];

// ─── Icons (inline SVG) ───
const Icons = {
  inventory: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  billing: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="18" rx="2"/><line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="11" x2="16" y2="11"/><line x1="8" y1="15" x2="12" y2="15"/></svg>,
  customers: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  orders: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  plus: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  minus: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  trash: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  search: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  whatsapp: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>,
  print: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>,
  edit: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  x: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  chart: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
};

// ─── Modal Component ───
function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", padding: 16 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 12, width: "100%", maxWidth: wide ? 600 : 440, maxHeight: "90vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid #e5e7eb" }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#1e293b" }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 4 }}>{Icons.x}</button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  );
}

// ─── Input Component ───
function Input({ label, ...props }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</label>}
      <input {...props} style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box", transition: "border-color 0.2s", background: "#f8fafc", ...props.style }} onFocus={e => e.target.style.borderColor = "#6366f1"} onBlur={e => e.target.style.borderColor = "#e2e8f0"} />
    </div>
  );
}

function Select({ label, options, ...props }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</label>}
      <select {...props} style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box", background: "#f8fafc", ...props.style }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function Btn({ children, variant = "primary", small, ...props }) {
  const styles = {
    primary: { background: "#4f46e5", color: "#fff", border: "none" },
    success: { background: "#059669", color: "#fff", border: "none" },
    danger: { background: "#dc2626", color: "#fff", border: "none" },
    ghost: { background: "transparent", color: "#64748b", border: "1.5px solid #e2e8f0" },
    whatsapp: { background: "#25D366", color: "#fff", border: "none" },
  };
  return (
    <button {...props} style={{
      ...styles[variant], padding: small ? "6px 12px" : "10px 18px", borderRadius: 8, fontSize: small ? 12 : 14,
      fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6,
      opacity: props.disabled ? 0.5 : 1, transition: "all 0.15s", ...props.style
    }}>
      {children}
    </button>
  );
}

// ══════════════════════════════════════
// ─── INVENTORY MODULE ───
// ══════════════════════════════════════
function InventoryModule({ products, setProducts, categories }) {
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [editProduct, setEditProduct] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const filtered = products.filter(p =>
    (filterCat === "all" || p.catId === filterCat) &&
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalInvestment = filtered.reduce((s, p) => s + p.buyPrice * p.qty, 0);
  const totalValue = filtered.reduce((s, p) => s + p.sellPrice * p.qty, 0);
  const totalProfit = totalValue - totalInvestment;

  function saveProduct(data) {
    if (data.id) {
      setProducts(prev => prev.map(p => p.id === data.id ? data : p));
    } else {
      setProducts(prev => [...prev, { ...data, id: uid() }]);
    }
    setShowForm(false);
    setEditProduct(null);
  }

  function deleteProduct(id) {
    if (confirm("Delete this product?")) setProducts(prev => prev.filter(p => p.id !== id));
  }

  return (
    <div>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total Items", value: filtered.length, color: "#6366f1" },
          { label: "Investment", value: fmt(totalInvestment), color: "#f59e0b" },
          { label: "Sale Value", value: fmt(totalValue), color: "#3b82f6" },
          { label: "Potential Profit", value: fmt(totalProfit), color: totalProfit >= 0 ? "#059669" : "#dc2626" },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", borderRadius: 10, padding: "14px 16px", border: "1px solid #e5e7eb" }}>
            <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color, marginTop: 2 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}>{Icons.search}</span>
          <input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: "100%", padding: "10px 12px 10px 36px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box", background: "#fff" }} />
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
          style={{ padding: "10px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 14, background: "#fff" }}>
          <option value="all">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </select>
        <Btn onClick={() => { setEditProduct(null); setShowForm(true); }}>{Icons.plus} Add Product</Btn>
      </div>

      {/* Product Table */}
      <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              {["Product", "Category", "Buy Price", "Sell Price", "Qty", "Profit/Unit", "Total Profit", "Actions"].map(h => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, borderBottom: "1px solid #e5e7eb", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => {
              const cat = categories.find(c => c.id === p.catId);
              const profitUnit = p.sellPrice - p.buyPrice;
              const totalP = profitUnit * p.qty;
              return (
                <tr key={p.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "10px 14px", fontWeight: 600, color: "#1e293b" }}>{p.name}</td>
                  <td style={{ padding: "10px 14px", color: "#64748b" }}>{cat ? `${cat.icon} ${cat.name}` : "—"}</td>
                  <td style={{ padding: "10px 14px", color: "#64748b" }}>{fmt(p.buyPrice)}</td>
                  <td style={{ padding: "10px 14px", color: "#1e293b", fontWeight: 600 }}>{fmt(p.sellPrice)}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <span style={{ background: p.qty <= 5 ? "#fef2f2" : "#f0fdf4", color: p.qty <= 5 ? "#dc2626" : "#059669", padding: "2px 10px", borderRadius: 20, fontWeight: 700, fontSize: 12 }}>{p.qty}</span>
                  </td>
                  <td style={{ padding: "10px 14px", color: profitUnit >= 0 ? "#059669" : "#dc2626", fontWeight: 600 }}>{fmt(profitUnit)}</td>
                  <td style={{ padding: "10px 14px", color: totalP >= 0 ? "#059669" : "#dc2626", fontWeight: 700 }}>{fmt(totalP)}</td>
                  <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
                    <button onClick={() => { setEditProduct(p); setShowForm(true); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#6366f1", padding: 4, marginRight: 4 }}>{Icons.edit}</button>
                    <button onClick={() => deleteProduct(p.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", padding: 4 }}>{Icons.trash}</button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && <tr><td colSpan={8} style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>No products found</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      <Modal open={showForm} onClose={() => { setShowForm(false); setEditProduct(null); }} title={editProduct ? "Edit Product" : "Add Product"}>
        <ProductForm product={editProduct} categories={categories} onSave={saveProduct} onCancel={() => { setShowForm(false); setEditProduct(null); }} />
      </Modal>
    </div>
  );
}

function ProductForm({ product, categories, onSave, onCancel }) {
  const [name, setName] = useState(product?.name || "");
  const [catId, setCatId] = useState(product?.catId || categories[0]?.id || "");
  const [buyPrice, setBuyPrice] = useState(product?.buyPrice || "");
  const [sellPrice, setSellPrice] = useState(product?.sellPrice || "");
  const [qty, setQty] = useState(product?.qty || "");

  function handleSave() {
    if (!name.trim()) return alert("Product name is required");
    onSave({ id: product?.id, name: name.trim(), catId, buyPrice: Number(buyPrice), sellPrice: Number(sellPrice), qty: Number(qty) });
  }

  return (
    <div>
      <Input label="Product Name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Black Forest Cake (1kg)" />
      <Select label="Category" value={catId} onChange={e => setCatId(e.target.value)} options={categories.map(c => ({ value: c.id, label: `${c.icon} ${c.name}` }))} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        <Input label="Buy Price (₹)" type="number" value={buyPrice} onChange={e => setBuyPrice(e.target.value)} placeholder="0" />
        <Input label="Sell Price (₹)" type="number" value={sellPrice} onChange={e => setSellPrice(e.target.value)} placeholder="0" />
        <Input label="Quantity" type="number" value={qty} onChange={e => setQty(e.target.value)} placeholder="0" />
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 10, justifyContent: "flex-end" }}>
        <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
        <Btn onClick={handleSave}>{product ? "Update" : "Add Product"}</Btn>
      </div>
    </div>
  );
}

// ══════════════════════════════════════
// ─── BILLING / POS MODULE ───
// ══════════════════════════════════════
function BillingModule({ products, setProducts, categories, customers, orders, setOrders }) {
  const [activeCat, setActiveCat] = useState("all");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState("percent");
  const [selCustomer, setSelCustomer] = useState("");
  const [showReceipt, setShowReceipt] = useState(null);

  const available = products.filter(p =>
    p.qty > 0 &&
    (activeCat === "all" || p.catId === activeCat) &&
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  function addToCart(product) {
    setCart(prev => {
      const existing = prev.find(c => c.productId === product.id);
      if (existing) {
        if (existing.qty >= product.qty) return prev;
        return prev.map(c => c.productId === product.id ? { ...c, qty: c.qty + 1 } : c);
      }
      return [...prev, { productId: product.id, name: product.name, price: product.sellPrice, qty: 1, maxQty: product.qty }];
    });
  }

  function updateCartQty(productId, delta) {
    setCart(prev => prev.map(c => {
      if (c.productId !== productId) return c;
      const newQty = c.qty + delta;
      if (newQty <= 0) return null;
      if (newQty > c.maxQty) return c;
      return { ...c, qty: newQty };
    }).filter(Boolean));
  }

  function removeFromCart(productId) {
    setCart(prev => prev.filter(c => c.productId !== productId));
  }

  const subtotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const discountAmt = discountType === "percent" ? subtotal * (discount / 100) : Number(discount);
  const total = Math.max(0, subtotal - discountAmt);

  function checkout() {
    if (cart.length === 0) return alert("Cart is empty");
    const order = {
      id: uid(),
      items: cart.map(c => ({ productId: c.productId, name: c.name, price: c.price, qty: c.qty })),
      subtotal, discountAmt, total,
      customerId: selCustomer || null,
      date: now(),
    };
    // Deduct stock
    setProducts(prev => prev.map(p => {
      const cartItem = cart.find(c => c.productId === p.id);
      if (!cartItem) return p;
      return { ...p, qty: p.qty - cartItem.qty };
    }));
    setOrders(prev => [order, ...prev]);
    setCart([]);
    setDiscount(0);
    setShowReceipt(order);
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 16, minHeight: 500 }}>
      {/* Left: Product Selection */}
      <div>
        {/* Category Tabs */}
        <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
          <button onClick={() => setActiveCat("all")} style={{
            padding: "8px 16px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
            background: activeCat === "all" ? "#4f46e5" : "#f1f5f9", color: activeCat === "all" ? "#fff" : "#64748b"
          }}>All</button>
          {categories.map(c => (
            <button key={c.id} onClick={() => setActiveCat(c.id)} style={{
              padding: "8px 16px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
              background: activeCat === c.id ? "#4f46e5" : "#f1f5f9", color: activeCat === c.id ? "#fff" : "#64748b"
            }}>{c.icon} {c.name}</button>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: "relative", marginBottom: 14 }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}>{Icons.search}</span>
          <input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: "100%", padding: "10px 12px 10px 36px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box", background: "#fff" }} />
        </div>

        {/* Product Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
          {available.map(p => {
            const inCart = cart.find(c => c.productId === p.id);
            return (
              <div key={p.id} onClick={() => addToCart(p)} style={{
                background: "#fff", borderRadius: 10, padding: 14, border: inCart ? "2px solid #4f46e5" : "1.5px solid #e5e7eb",
                cursor: "pointer", transition: "all 0.15s", position: "relative"
              }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>{categories.find(c => c.id === p.catId)?.icon || "📦"}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", lineHeight: 1.3 }}>{p.name}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#4f46e5", marginTop: 4 }}>{fmt(p.sellPrice)}</div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>Stock: {p.qty}</div>
                {inCart && <div style={{ position: "absolute", top: 8, right: 8, background: "#4f46e5", color: "#fff", width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>{inCart.qty}</div>}
              </div>
            );
          })}
          {available.length === 0 && <div style={{ gridColumn: "1/-1", padding: 40, textAlign: "center", color: "#94a3b8" }}>No products available</div>}
        </div>
      </div>

      {/* Right: Cart */}
      <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", padding: 16, display: "flex", flexDirection: "column" }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 700, color: "#1e293b" }}>🛒 Cart ({cart.length})</h3>

        {/* Customer select */}
        <select value={selCustomer} onChange={e => setSelCustomer(e.target.value)}
          style={{ width: "100%", padding: "8px 10px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13, marginBottom: 12, background: "#f8fafc", boxSizing: "border-box" }}>
          <option value="">Walk-in Customer</option>
          {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
        </select>

        {/* Cart Items */}
        <div style={{ flex: 1, overflowY: "auto", marginBottom: 12 }}>
          {cart.length === 0 && <div style={{ padding: 30, textAlign: "center", color: "#cbd5e1", fontSize: 13 }}>Add items to cart</div>}
          {cart.map(item => (
            <div key={item.productId} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{item.name}</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>{fmt(item.price)} × {item.qty} = {fmt(item.price * item.qty)}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <button onClick={() => updateCartQty(item.productId, -1)} style={{ background: "#f1f5f9", border: "none", borderRadius: 6, width: 26, height: 26, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>{Icons.minus}</button>
                <span style={{ fontSize: 13, fontWeight: 700, minWidth: 20, textAlign: "center" }}>{item.qty}</span>
                <button onClick={() => updateCartQty(item.productId, 1)} style={{ background: "#f1f5f9", border: "none", borderRadius: 6, width: 26, height: 26, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>{Icons.plus}</button>
              </div>
              <button onClick={() => removeFromCart(item.productId)} style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", padding: 2 }}>{Icons.trash}</button>
            </div>
          ))}
        </div>

        {/* Discount */}
        <div style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", display: "block", marginBottom: 3 }}>DISCOUNT</label>
            <input type="number" value={discount} onChange={e => setDiscount(e.target.value)} placeholder="0"
              style={{ width: "100%", padding: "8px 10px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 14, boxSizing: "border-box" }} />
          </div>
          <select value={discountType} onChange={e => setDiscountType(e.target.value)}
            style={{ padding: "8px 10px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13, marginBottom: 0 }}>
            <option value="percent">%</option>
            <option value="flat">₹</option>
          </select>
        </div>

        {/* Totals */}
        <div style={{ borderTop: "2px solid #e5e7eb", paddingTop: 10, marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#64748b", marginBottom: 4 }}>
            <span>Subtotal</span><span>{fmt(subtotal)}</span>
          </div>
          {discountAmt > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#dc2626", marginBottom: 4 }}>
            <span>Discount</span><span>-{fmt(discountAmt)}</span>
          </div>}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, fontWeight: 800, color: "#1e293b" }}>
            <span>Total</span><span>{fmt(total)}</span>
          </div>
        </div>

        <Btn variant="success" onClick={checkout} disabled={cart.length === 0} style={{ width: "100%", justifyContent: "center", padding: "12px 0", fontSize: 15 }}>
          Checkout
        </Btn>
      </div>

      {/* Receipt Modal */}
      <Modal open={!!showReceipt} onClose={() => setShowReceipt(null)} title="Order Complete!" wide>
        {showReceipt && <ReceiptView order={showReceipt} customers={customers} />}
      </Modal>
    </div>
  );
}

// ─── Receipt & Print ───
function ReceiptView({ order, customers }) {
  const receiptRef = useRef();
  const customer = customers.find(c => c.id === order.customerId);
  const shopName = "Sweet Delights Bakery";

  function generateReceiptText() {
    let text = `${shopName}\n${"─".repeat(32)}\n`;
    text += `Bill #: ${order.id.toUpperCase()}\n`;
    text += `Date: ${new Date(order.date).toLocaleString("en-IN")}\n`;
    if (customer) text += `Customer: ${customer.name}\n`;
    text += `${"─".repeat(32)}\n`;
    order.items.forEach(item => {
      text += `${item.name}\n  ${item.qty} x ${fmt(item.price)} = ${fmt(item.price * item.qty)}\n`;
    });
    text += `${"─".repeat(32)}\n`;
    text += `Subtotal: ${fmt(order.subtotal)}\n`;
    if (order.discountAmt > 0) text += `Discount: -${fmt(order.discountAmt)}\n`;
    text += `TOTAL: ${fmt(order.total)}\n`;
    text += `${"─".repeat(32)}\nThank you! Visit again 🎂`;
    return text;
  }

  function printReceipt() {
    const printWindow = window.open("", "_blank", "width=302,height=600");
    printWindow.document.write(`
      <html><head><title>Receipt</title>
      <style>
        @page { margin: 0; size: 80mm auto; }
        body { font-family: 'Courier New', monospace; font-size: 12px; width: 72mm; margin: 4mm; line-height: 1.4; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .line { border-top: 1px dashed #000; margin: 6px 0; }
        .row { display: flex; justify-content: space-between; }
        .item-name { font-weight: bold; }
        .total-row { font-size: 16px; font-weight: bold; }
      </style></head><body>
        <div class="center bold" style="font-size:16px">${shopName}</div>
        <div class="center" style="font-size:10px">Shop Address Line 1<br>Phone: +91-XXXXXXXXXX</div>
        <div class="line"></div>
        <div class="row"><span>Bill #:</span><span>${order.id.toUpperCase().slice(0, 8)}</span></div>
        <div class="row"><span>Date:</span><span>${new Date(order.date).toLocaleString("en-IN")}</span></div>
        ${customer ? `<div class="row"><span>Customer:</span><span>${customer.name}</span></div>` : ""}
        <div class="line"></div>
        ${order.items.map(item => `
          <div class="item-name">${item.name}</div>
          <div class="row"><span>${item.qty} x ${fmt(item.price)}</span><span>${fmt(item.price * item.qty)}</span></div>
        `).join("")}
        <div class="line"></div>
        <div class="row"><span>Subtotal</span><span>${fmt(order.subtotal)}</span></div>
        ${order.discountAmt > 0 ? `<div class="row"><span>Discount</span><span>-${fmt(order.discountAmt)}</span></div>` : ""}
        <div class="line"></div>
        <div class="row total-row"><span>TOTAL</span><span>${fmt(order.total)}</span></div>
        <div class="line"></div>
        <div class="center" style="margin-top:8px">Thank you! Visit again 🎂</div>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  }

  function sendWhatsApp() {
    const phone = customer?.phone || "";
    const text = encodeURIComponent(generateReceiptText());
    const url = phone ? `https://wa.me/91${phone.replace(/\D/g, "")}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, "_blank");
  }

  return (
    <div>
      {/* Visual Receipt */}
      <div ref={receiptRef} style={{ background: "#fefce8", border: "1px solid #fde68a", borderRadius: 10, padding: 20, fontFamily: "'Courier New', monospace", fontSize: 13, maxWidth: 320, margin: "0 auto 16px" }}>
        <div style={{ textAlign: "center", fontWeight: 800, fontSize: 16, marginBottom: 4 }}>{shopName}</div>
        <div style={{ textAlign: "center", fontSize: 10, color: "#78716c", marginBottom: 8 }}>Shop Address • Phone</div>
        <div style={{ borderTop: "1px dashed #d6d3d1", margin: "8px 0" }} />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#78716c" }}>
          <span>Bill #{order.id.slice(0, 8).toUpperCase()}</span>
          <span>{new Date(order.date).toLocaleDateString("en-IN")}</span>
        </div>
        {customer && <div style={{ fontSize: 12, marginTop: 4 }}>Customer: {customer.name}</div>}
        <div style={{ borderTop: "1px dashed #d6d3d1", margin: "8px 0" }} />
        {order.items.map((item, i) => (
          <div key={i} style={{ marginBottom: 4 }}>
            <div style={{ fontWeight: 700, fontSize: 12 }}>{item.name}</div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#78716c" }}>
              <span>{item.qty} × {fmt(item.price)}</span>
              <span>{fmt(item.price * item.qty)}</span>
            </div>
          </div>
        ))}
        <div style={{ borderTop: "1px dashed #d6d3d1", margin: "8px 0" }} />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
          <span>Subtotal</span><span>{fmt(order.subtotal)}</span>
        </div>
        {order.discountAmt > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#dc2626" }}>
          <span>Discount</span><span>-{fmt(order.discountAmt)}</span>
        </div>}
        <div style={{ borderTop: "2px solid #1c1917", margin: "8px 0" }} />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, fontWeight: 800 }}>
          <span>TOTAL</span><span>{fmt(order.total)}</span>
        </div>
        <div style={{ textAlign: "center", fontSize: 11, color: "#78716c", marginTop: 10 }}>Thank you! Visit again 🎂</div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
        <Btn variant="whatsapp" onClick={sendWhatsApp}>{Icons.whatsapp} Send WhatsApp</Btn>
        <Btn onClick={printReceipt}>{Icons.print} Print Receipt</Btn>
      </div>
    </div>
  );
}

// ══════════════════════════════════════
// ─── CUSTOMERS MODULE ───
// ══════════════════════════════════════
function CustomersModule({ customers, setCustomers, orders }) {
  const [showForm, setShowForm] = useState(false);
  const [editCust, setEditCust] = useState(null);
  const [search, setSearch] = useState("");

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  );

  function save(data) {
    if (data.id) {
      setCustomers(prev => prev.map(c => c.id === data.id ? data : c));
    } else {
      setCustomers(prev => [...prev, { ...data, id: uid() }]);
    }
    setShowForm(false);
    setEditCust(null);
  }

  function remove(id) {
    if (confirm("Delete this customer?")) setCustomers(prev => prev.filter(c => c.id !== id));
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}>{Icons.search}</span>
          <input placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: "100%", padding: "10px 12px 10px 36px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box", background: "#fff" }} />
        </div>
        <Btn onClick={() => { setEditCust(null); setShowForm(true); }}>{Icons.plus} Add Customer</Btn>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
        {filtered.map(c => {
          const custOrders = orders.filter(o => o.customerId === c.id);
          const totalSpent = custOrders.reduce((s, o) => s + o.total, 0);
          return (
            <div key={c.id} style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b" }}>{c.name}</div>
                  <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>📞 {c.phone}</div>
                  {c.address && <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>📍 {c.address}</div>}
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  <button onClick={() => { setEditCust(c); setShowForm(true); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#6366f1", padding: 4 }}>{Icons.edit}</button>
                  <button onClick={() => remove(c.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", padding: 4 }}>{Icons.trash}</button>
                </div>
              </div>
              <div style={{ display: "flex", gap: 16, marginTop: 10, paddingTop: 10, borderTop: "1px solid #f1f5f9" }}>
                <div><div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600 }}>ORDERS</div><div style={{ fontSize: 16, fontWeight: 800, color: "#4f46e5" }}>{custOrders.length}</div></div>
                <div><div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600 }}>TOTAL SPENT</div><div style={{ fontSize: 16, fontWeight: 800, color: "#059669" }}>{fmt(totalSpent)}</div></div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <div style={{ gridColumn: "1/-1", padding: 40, textAlign: "center", color: "#94a3b8" }}>No customers found</div>}
      </div>

      <Modal open={showForm} onClose={() => { setShowForm(false); setEditCust(null); }} title={editCust ? "Edit Customer" : "Add Customer"}>
        <CustomerForm customer={editCust} onSave={save} onCancel={() => { setShowForm(false); setEditCust(null); }} />
      </Modal>
    </div>
  );
}

function CustomerForm({ customer, onSave, onCancel }) {
  const [name, setName] = useState(customer?.name || "");
  const [phone, setPhone] = useState(customer?.phone || "");
  const [address, setAddress] = useState(customer?.address || "");

  function handleSave() {
    if (!name.trim() || !phone.trim()) return alert("Name and phone are required");
    onSave({ id: customer?.id, name: name.trim(), phone: phone.trim(), address: address.trim() });
  }

  return (
    <div>
      <Input label="Customer Name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Rajesh Kumar" />
      <Input label="Phone Number" value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. 9876543210" />
      <Input label="Address (optional)" value={address} onChange={e => setAddress(e.target.value)} placeholder="e.g. MG Road, Nagpur" />
      <div style={{ display: "flex", gap: 10, marginTop: 10, justifyContent: "flex-end" }}>
        <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
        <Btn onClick={handleSave}>{customer ? "Update" : "Add Customer"}</Btn>
      </div>
    </div>
  );
}

// ══════════════════════════════════════
// ─── ORDERS / HISTORY MODULE ───
// ══════════════════════════════════════
function OrdersModule({ orders, customers }) {
  const [showReceipt, setShowReceipt] = useState(null);
  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
  const totalDiscount = orders.reduce((s, o) => s + o.discountAmt, 0);

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total Orders", value: orders.length, color: "#6366f1" },
          { label: "Revenue", value: fmt(totalRevenue), color: "#059669" },
          { label: "Discounts Given", value: fmt(totalDiscount), color: "#f59e0b" },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", borderRadius: 10, padding: "14px 16px", border: "1px solid #e5e7eb" }}>
            <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color, marginTop: 2 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              {["Order ID", "Date", "Customer", "Items", "Discount", "Total", "Actions"].map(h => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, borderBottom: "1px solid #e5e7eb", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.map(o => {
              const cust = customers.find(c => c.id === o.customerId);
              return (
                <tr key={o.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "10px 14px", fontFamily: "monospace", fontSize: 12, color: "#64748b" }}>#{o.id.slice(0, 8).toUpperCase()}</td>
                  <td style={{ padding: "10px 14px", color: "#64748b" }}>{new Date(o.date).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</td>
                  <td style={{ padding: "10px 14px", color: "#1e293b" }}>{cust?.name || "Walk-in"}</td>
                  <td style={{ padding: "10px 14px", color: "#64748b" }}>{o.items.length} items</td>
                  <td style={{ padding: "10px 14px", color: o.discountAmt > 0 ? "#dc2626" : "#94a3b8" }}>{o.discountAmt > 0 ? `-${fmt(o.discountAmt)}` : "—"}</td>
                  <td style={{ padding: "10px 14px", fontWeight: 700, color: "#059669" }}>{fmt(o.total)}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <Btn small variant="ghost" onClick={() => setShowReceipt(o)}>{Icons.print} View</Btn>
                  </td>
                </tr>
              );
            })}
            {orders.length === 0 && <tr><td colSpan={7} style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>No orders yet</td></tr>}
          </tbody>
        </table>
      </div>

      <Modal open={!!showReceipt} onClose={() => setShowReceipt(null)} title="Order Receipt" wide>
        {showReceipt && <ReceiptView order={showReceipt} customers={customers} />}
      </Modal>
    </div>
  );
}

// ══════════════════════════════════════
// ─── MAIN APP ───
// ══════════════════════════════════════
export default function App() {
  const [page, setPage] = useState("billing");
  const [categories] = useStore("cakeshop_categories", DEFAULT_CATEGORIES);
  const [products, setProducts] = useStore("cakeshop_products", DEFAULT_PRODUCTS);
  const [customers, setCustomers] = useStore("cakeshop_customers", [
    { id: "cust1", name: "Rajesh Sharma", phone: "9876543210", address: "MG Road, Nagpur" },
    { id: "cust2", name: "Priya Patel", phone: "8765432109", address: "Sadar, Nagpur" },
  ]);
  const [orders, setOrders] = useStore("cakeshop_orders", []);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { id: "billing", label: "Billing / POS", icon: Icons.billing },
    { id: "inventory", label: "Inventory", icon: Icons.inventory },
    { id: "customers", label: "Customers", icon: Icons.customers },
    { id: "orders", label: "Order History", icon: Icons.orders },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f1f5f9", fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      {/* Mobile hamburger */}
      <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{
        position: "fixed", top: 12, left: 12, zIndex: 1100, background: "#4f46e5", border: "none", borderRadius: 8,
        width: 40, height: 40, display: "none", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff",
        ...(window.innerWidth < 768 ? { display: "flex" } : {})
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
      </button>

      {/* Sidebar */}
      {(sidebarOpen || true) && <div style={{
        width: 220, background: "#1e1b4b", color: "#fff", padding: "20px 0", display: "flex", flexDirection: "column",
        position: window.innerWidth < 768 ? "fixed" : "sticky", top: 0, left: sidebarOpen || window.innerWidth >= 768 ? 0 : -260,
        height: "100vh", zIndex: 1050, transition: "left 0.3s",
        ...(window.innerWidth < 768 && !sidebarOpen ? { left: -260 } : {})
      }}>
        <div style={{ padding: "0 20px 20px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ fontSize: 22, fontWeight: 800 }}>🎂 Sweet</div>
          <div style={{ fontSize: 12, color: "#a5b4fc", marginTop: 2 }}>Delights Bakery</div>
        </div>
        <nav style={{ flex: 1, padding: "12px 0" }}>
          {navItems.map(item => (
            <button key={item.id} onClick={() => { setPage(item.id); setSidebarOpen(false); }} style={{
              display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "12px 20px", border: "none",
              background: page === item.id ? "rgba(99,102,241,0.3)" : "transparent", color: page === item.id ? "#fff" : "#c7d2fe",
              fontSize: 14, fontWeight: page === item.id ? 700 : 500, cursor: "pointer", textAlign: "left",
              borderLeft: page === item.id ? "3px solid #818cf8" : "3px solid transparent",
              transition: "all 0.15s"
            }}>
              {item.icon}{item.label}
            </button>
          ))}
        </nav>
        <div style={{ padding: "12px 20px", borderTop: "1px solid rgba(255,255,255,0.1)", fontSize: 11, color: "#6366f1" }}>
          v1.0 • Prototype
        </div>
      </div>}

      {/* Main Content */}
      <div style={{ flex: 1, padding: "20px 24px", overflow: "auto", maxWidth: 1200, margin: "0 auto", width: "100%" }}>
        <div style={{ marginBottom: 20, paddingLeft: window.innerWidth < 768 ? 48 : 0 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#1e293b" }}>
            {navItems.find(n => n.id === page)?.label}
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#94a3b8" }}>{today()}</p>
        </div>

        {page === "inventory" && <InventoryModule products={products} setProducts={setProducts} categories={categories} />}
        {page === "billing" && <BillingModule products={products} setProducts={setProducts} categories={categories} customers={customers} orders={orders} setOrders={setOrders} />}
        {page === "customers" && <CustomersModule customers={customers} setCustomers={setCustomers} orders={orders} />}
        {page === "orders" && <OrdersModule orders={orders} customers={customers} />}
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && window.innerWidth < 768 && (
        <div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1040 }} />
      )}
    </div>
  );
}
