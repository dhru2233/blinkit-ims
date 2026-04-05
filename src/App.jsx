import { useState, useEffect, useRef, useCallback, useMemo } from "react";

/* ─── Brand tokens ─────────────────────────────────────────────────────── */
const YLW = "#F8C200";
const BLK = "#1C1C1C";
const GRN = "#0EA472";
const RED = "#E53935";
const BLU = "#1A73E8";
const GRAY1 = "#F5F5F5";
const GRAY2 = "#E8E8E8";
const GRAY3 = "#9E9E9E";
const GRAY4 = "#424242";
const WHITE = "#FFFFFF";

/* ─── Data ──────────────────────────────────────────────────────────────── */
const INIT_INV = [
  { id:1,  sku:"AMU-001", name:"Amul Milk 500ml",       cat:"Dairy",         emoji:"🥛", price:28,  cost:22,  qty:120, msL:30, expiry:"2026-03-20", vendor:"Amul",        desc:"Fresh full-cream milk" },
  { id:2,  sku:"LAY-002", name:"Lay's Classic Salted",  cat:"Snacks",        emoji:"🍟", price:20,  cost:14,  qty:45,  msL:20, expiry:"2026-08-10", vendor:"PepsiCo",     desc:"Crispy potato chips" },
  { id:3,  sku:"BAN-003", name:"Bananas (Dozen)",        cat:"Fruits",        emoji:"🍌", price:45,  cost:30,  qty:60,  msL:15, expiry:"2026-03-15", vendor:"FreshFarm",   desc:"Fresh ripe bananas" },
  { id:4,  sku:"COC-004", name:"Coca-Cola 750ml",        cat:"Beverages",     emoji:"🥤", price:45,  cost:32,  qty:30,  msL:25, expiry:"2026-12-01", vendor:"Coca-Cola",   desc:"Ice-cold refreshing cola" },
  { id:5,  sku:"SUR-005", name:"Surf Excel 1kg",         cat:"Household",     emoji:"🧺", price:220, cost:170, qty:35,  msL:10, expiry:"2027-06-01", vendor:"HUL",         desc:"Premium detergent powder" },
  { id:6,  sku:"BRI-006", name:"Britannia Bread",        cat:"Bakery",        emoji:"🍞", price:42,  cost:30,  qty:18,  msL:12, expiry:"2026-03-14", vendor:"Britannia",   desc:"Soft sandwich bread" },
  { id:7,  sku:"MAG-007", name:"Maggi 2-Min Noodles",    cat:"Snacks",        emoji:"🍜", price:14,  cost:9,   qty:200, msL:50, expiry:"2026-11-01", vendor:"Nestle",      desc:"Quick 2-minute noodles" },
  { id:8,  sku:"DOV-008", name:"Dove Soap 75g",          cat:"Personal Care", emoji:"🧼", price:55,  cost:40,  qty:18,  msL:20, expiry:"2028-01-01", vendor:"HUL",         desc:"Moisturising beauty bar" },
  { id:9,  sku:"EGG-009", name:"Eggs (12 pcs)",          cat:"Dairy",         emoji:"🥚", price:84,  cost:65,  qty:40,  msL:20, expiry:"2026-03-18", vendor:"Country Eggs",desc:"Farm-fresh white eggs" },
  { id:10, sku:"ONI-010", name:"Onions 1kg",             cat:"Fruits",        emoji:"🧅", price:30,  cost:20,  qty:55,  msL:15, expiry:"2026-03-22", vendor:"FreshFarm",   desc:"Fresh red onions" },
  { id:11, sku:"TOM-011", name:"Tomatoes 500g",          cat:"Fruits",        emoji:"🍅", price:25,  cost:15,  qty:12,  msL:15, expiry:"2026-03-13", vendor:"FreshFarm",   desc:"Vine-ripened tomatoes" },
  { id:12, sku:"YOG-012", name:"Amul Curd 400g",         cat:"Dairy",         emoji:"🍶", price:40,  cost:30,  qty:22,  msL:20, expiry:"2026-03-16", vendor:"Amul",        desc:"Thick & creamy curd" },
  { id:13, sku:"RIC-013", name:"Basmati Rice 1kg",       cat:"Household",     emoji:"🍚", price:99,  cost:72,  qty:80,  msL:15, expiry:"2027-01-01", vendor:"India Gate",  desc:"Long-grain premium rice" },
  { id:14, sku:"CHA-014", name:"Haldiram's Bhujia",      cat:"Snacks",        emoji:"🫘", price:60,  cost:42,  qty:50,  msL:20, expiry:"2026-09-01", vendor:"Haldiram's",  desc:"Crunchy sev bhujia" },
  { id:15, sku:"COF-015", name:"Nescafé Classic 50g",    cat:"Beverages",     emoji:"☕", price:135, cost:95,  qty:25,  msL:10, expiry:"2027-06-01", vendor:"Nestle",      desc:"Rich instant coffee" },
];

const CUSTOMERS = ["Rahul Sharma","Priya Mehta","Ankit Rao","Sneha Gupta","Vikram Singh","Neha Joshi","Arjun Nair","Kavya Reddy","Rohan Das","Pooja Iyer"];
const AREAS     = ["Saket","Lajpat Nagar","Green Park","Hauz Khas","Malviya Nagar","Vasant Kunj","Defence Colony","South Ex"];
const STATUS_FLOW = ["placed","confirmed","picking","packed","out_for_delivery","delivered"];
const SM = {
  placed:           { label:"Order Placed",  color:"#7C3AED", icon:"📱", msg:"Your order has been placed!" },
  confirmed:        { label:"Confirmed",     color:"#D97706", icon:"✅", msg:"Store confirmed your order" },
  picking:          { label:"Picking Items", color:"#0284C7", icon:"🧺", msg:"Picker collecting your items" },
  packed:           { label:"Packed",        color:"#7C3AED", icon:"📦", msg:"Order packed & ready" },
  out_for_delivery: { label:"On the Way",    color:"#EA580C", icon:"🛵", msg:"Delivery partner on the way!" },
  delivered:        { label:"Delivered",     color:"#16A34A", icon:"🎉", msg:"Order delivered. Enjoy!" },
};
const CATS = ["All","Dairy","Snacks","Fruits","Beverages","Household","Bakery","Personal Care"];

const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick = arr => arr[rand(0, arr.length - 1)];
const ts = () => new Date().toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit", second:"2-digit" });
let oidSeq = 200;

/* ─── Live Geolocation hook ─────────────────────────────────────────────── */
function useGeolocation() {
  const [location, setLocation] = useState({ address: "Locating...", lat: null, lng: null, loading: true, error: null });

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocation(p => ({ ...p, address: "Location unavailable", loading: false, error: "not supported" }));
      return;
    }

    const success = async (pos) => {
      const { latitude: lat, longitude: lng } = pos.coords;
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
        );
        const data = await res.json();
        const a = data.address || {};
        const parts = [
          a.road || a.pedestrian || a.neighbourhood,
          a.suburb || a.city_district,
          a.city || a.town || a.village,
        ].filter(Boolean);
        const address = parts.length ? parts.join(", ") : data.display_name?.split(",").slice(0, 2).join(", ") || "Your location";
        setLocation({ address, lat, lng, loading: false, error: null });
      } catch {
        setLocation({ address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`, lat, lng, loading: false, error: null });
      }
    };

    const error = (err) => {
      const msgs = { 1: "Permission denied", 2: "Position unavailable", 3: "Timeout" };
      setLocation({ address: "Enable location for delivery", lat: null, lng: null, loading: false, error: msgs[err.code] || "Location error" });
    };

    navigator.geolocation.getCurrentPosition(success, error, { timeout: 10000 });

    const watcher = navigator.geolocation.watchPosition(success, error, { timeout: 15000, maximumAge: 60000 });
    return () => navigator.geolocation.clearWatch(watcher);
  }, []);

  return location;
}

/* ─── Shared store ──────────────────────────────────────────────────────── */
function useSharedStore() {
  const [inv, setInv]                 = useState(INIT_INV);
  const [orders, setOrders]           = useState([]);
  const [movements, setMovements]     = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [adminToast, setAdminToast]   = useState(null);
  const [custToast, setCustToast]     = useState(null);

  const pushNotif = useCallback((msg, type = "info", target = "both") => {
    const n = { id: Date.now() + Math.random(), msg, type, time: ts() };
    setNotifications(p => [n, ...p].slice(0, 100));
    if (target === "admin" || target === "both") { setAdminToast(n); setTimeout(() => setAdminToast(null), 3200); }
    if (target === "cust"  || target === "both") { setCustToast(n);  setTimeout(() => setCustToast(null),  3200); }
  }, []);

  const logMove = useCallback((sku, name, type, qty, note) => {
    setMovements(p => [{ id: Date.now() + Math.random(), sku, name, type, qty, note, time: ts() }, ...p].slice(0, 200));
  }, []);

  const deductStock = useCallback((items, orderId) => {
    setInv(p => p.map(inv => { const it = items.find(i => i.sku === inv.sku); if (!it) return inv; return { ...inv, qty: Math.max(0, inv.qty - it.qty) }; }));
    items.forEach(i => logMove(i.sku, i.name, "OUT", i.qty, "Order " + orderId));
  }, [logMove]);

  const advanceOrder = useCallback((orderId, isCustomer = false) => {
    setOrders(prev => {
      const o = prev.find(x => x.id === orderId);
      if (!o || o.statusIdx >= STATUS_FLOW.length - 1) return prev;
      const next = o.statusIdx + 1, ns = STATUS_FLOW[next];
      const newLog = [...o.log, { status: ns, time: ts(), msg: SM[ns].msg }];
      if (ns === "delivered") { deductStock(o.items, orderId); pushNotif(`🎉 Order ${orderId} delivered to ${o.customer}!`, "success", isCustomer ? "both" : "admin"); }
      else if (isCustomer || o.isCustomer) pushNotif(`${SM[ns].icon} Your order ${orderId}: ${SM[ns].msg}`, "info", "cust");
      else pushNotif(`${SM[ns].icon} ${orderId} → ${SM[ns].label}`, "info", "admin");
      return prev.map(x => x.id === orderId ? { ...x, status: ns, statusIdx: next, log: newLog } : x);
    });
  }, [deductStock, pushNotif]);

  const placeOrder = useCallback((items, customer, area, isCustomer = false) => {
    const o = { id:`ORD-${++oidSeq}`, customer, area, items, total: items.reduce((a, i) => a + i.qty * i.price, 0), status:"placed", statusIdx:0, isCustomer, time:ts(), eta:rand(8,15), log:[{ status:"placed", time:ts(), msg:SM.placed.msg }] };
    setOrders(p => [o, ...p].slice(0, 80));
    pushNotif(`📱 New order ${o.id} from ${o.customer} (${o.area}) — ₹${o.total}`, "order", "admin");
    if (isCustomer) pushNotif(`✅ Order ${o.id} placed! ETA ~${o.eta} mins`, "success", "cust");
    let d = rand(2500, 4000);
    STATUS_FLOW.slice(1).forEach(() => { const sd = d + rand(2000, 5000); d = sd; setTimeout(() => advanceOrder(o.id, isCustomer), sd); });
    return o;
  }, [advanceOrder, pushNotif]);

  return { inv, setInv, orders, setOrders, movements, notifications, adminToast, custToast, pushNotif, logMove, placeOrder, advanceOrder, deductStock };
}

/* ─── Toast ─────────────────────────────────────────────────────────────── */
const Toast = ({ t }) => {
  if (!t) return null;
  const bg = t.type === "danger" ? RED : t.type === "success" ? GRN : t.type === "order" ? BLU : "#424242";
  return (
    <div style={{ position:"fixed", top:72, right:16, zIndex:9999, background:bg, color:WHITE, padding:"12px 18px", borderRadius:12, fontWeight:600, fontSize:13, maxWidth:300, boxShadow:"0 4px 16px rgba(0,0,0,0.18)" }}>
      {t.msg}
    </div>
  );
};

/* ─── Order tracker ─────────────────────────────────────────────────────── */
const OrderTracker = ({ order }) => (
  <div>
    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
      {STATUS_FLOW.map((s, i) => {
        const done = i <= order.statusIdx, curr = i === order.statusIdx;
        return (
          <div key={s} style={{ display:"flex", flexDirection:"column", alignItems:"center", flex:1 }}>
            <div style={{ width:28, height:28, borderRadius:"50%", background:done ? SM[s].color : GRAY2, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, border:curr ? `2px solid ${SM[s].color}` : "2px solid transparent", color:done ? WHITE : GRAY3, fontWeight:700, transition:"all 0.3s" }}>
              {curr ? SM[s].icon : done ? "✓" : "·"}
            </div>
            <div style={{ fontSize:9, color:done ? GRAY4 : GRAY3, marginTop:3, textAlign:"center", maxWidth:44, lineHeight:1.2, fontWeight:done ? 600 : 400 }}>{SM[s].label}</div>
          </div>
        );
      })}
    </div>
    <div style={{ height:4, background:GRAY2, borderRadius:10, overflow:"hidden" }}>
      <div style={{ height:"100%", background:`linear-gradient(90deg, ${YLW}, #F59E0B)`, width:`${(order.statusIdx / (STATUS_FLOW.length - 1)) * 100}%`, transition:"width 0.8s ease", borderRadius:10 }} />
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════════
   ADMIN PANEL
═══════════════════════════════════════════════════════════════════════════ */
function AdminPanel({ store }) {
  const { inv, setInv, orders, movements, notifications, adminToast, pushNotif, logMove, placeOrder } = store;
  const [tab, setTab]         = useState("live");
  const [aTab, setATab]       = useState("overview");
  const [liveOn, setLiveOn]   = useState(true);
  const [selOrder, setSelOrder] = useState(null);
  const [invSearch, setInvSearch] = useState("");
  const [showForm, setShowForm]   = useState(false);
  const [editId, setEditId]       = useState(null);
  const [form, setForm]           = useState({});
  const [stockMod, setStockMod]   = useState(null);
  const [sAdj, setSAdj]           = useState({ type:"IN", qty:"", note:"" });
  const liveRef = useRef();

  const active    = orders.filter(o => o.status !== "delivered");
  const delivered = orders.filter(o => o.status === "delivered");
  const revenue   = delivered.reduce((a, o) => a + o.total, 0);
  const outOfStock = inv.filter(i => i.qty === 0);
  const lowStock   = inv.filter(i => i.qty > 0 && i.qty <= i.msL);

  useEffect(() => {
    if (!liveOn) return;
    liveRef.current = setInterval(() => {
      setInv(cur => {
        const avail = cur.filter(i => i.qty > 0);
        if (!avail.length) return cur;
        const n = rand(1, Math.min(4, avail.length));
        const items = [...avail].sort(() => Math.random() - 0.5).slice(0, n).map(p => ({ sku:p.sku, name:p.name, emoji:p.emoji, qty:rand(1, Math.min(3, p.qty)), price:p.price }));
        placeOrder(items, pick(CUSTOMERS), pick(AREAS), false);
        return cur;
      });
    }, rand(5000, 9000));
    return () => clearInterval(liveRef.current);
  }, [liveOn, placeOrder, setInv]);

  const saveInv = () => {
    if (!form.name || !form.sku || !form.price || !form.qty) { pushNotif("Fill required fields", "danger", "admin"); return; }
    const e = { ...form, price:+form.price, cost:+form.cost, qty:+form.qty, msL:+form.msL };
    if (editId) setInv(p => p.map(i => i.id === editId ? { ...i, ...e } : i));
    else setInv(p => [...p, { ...e, id:Date.now() }]);
    pushNotif(editId ? "Product updated!" : "Product added!", "success", "admin");
    setShowForm(false); setEditId(null);
  };

  const adjStock = () => {
    if (!sAdj.qty || +sAdj.qty <= 0) { pushNotif("Enter valid qty", "danger", "admin"); return; }
    const q = +sAdj.qty;
    setInv(p => p.map(i => i.id !== stockMod.id ? i : { ...i, qty: sAdj.type === "IN" ? i.qty + q : Math.max(0, i.qty - q) }));
    logMove(stockMod.sku, stockMod.name, sAdj.type, q, sAdj.note || "-");
    pushNotif(`Stock ${sAdj.type} for ${stockMod.name}`, "success", "admin");
    setStockMod(null);
  };

  /* style helpers */
  const s = {
    card:   { background:WHITE, borderRadius:12, padding:20, border:`1px solid ${GRAY2}`, boxShadow:"0 1px 4px rgba(0,0,0,0.07)" },
    inp:    { width:"100%", padding:"9px 12px", borderRadius:8, border:`1px solid ${GRAY2}`, background:WHITE, color:BLK, fontSize:13, outline:"none", boxSizing:"border-box" },
    th:     { background:GRAY1, color:GRAY4, padding:"10px 12px", fontSize:11, fontWeight:700, textAlign:"left", borderBottom:`1px solid ${GRAY2}`, textTransform:"uppercase", letterSpacing:"0.5px" },
    td:     { padding:"10px 12px", fontSize:13, color:GRAY4, borderBottom:`1px solid ${GRAY1}` },
    btn:    (bg, fg = WHITE, p = "8px 16px") => ({ cursor:"pointer", border:"none", borderRadius:8, padding:p, fontWeight:600, fontSize:12, background:bg, color:fg, transition:"all 0.18s" }),
    pill:   (bg, fg = WHITE) => ({ display:"inline-block", background:bg, color:fg, borderRadius:20, padding:"3px 10px", fontSize:11, fontWeight:600 }),
    badge:  (n) => n > 0 ? { display:"inline-flex", alignItems:"center", justifyContent:"center", background:RED, color:WHITE, borderRadius:10, minWidth:18, height:18, fontSize:10, fontWeight:700, marginLeft:6, padding:"0 5px" } : { display:"none" },
  };

  const navs = [
    { id:"live",      label:"Live Orders",  badge:active.length },
    { id:"inventory", label:"Inventory",    badge:outOfStock.length + lowStock.length },
    { id:"admin",     label:"Admin",        badge:0 },
    { id:"log",       label:"Activity Log", badge:0 },
  ];

  return (
    <div style={{ minHeight:"100vh", background:GRAY1, fontFamily:"'Segoe UI',system-ui,sans-serif", color:BLK, display:"flex", flexDirection:"column" }}>
      <Toast t={adminToast} />

      {/* Header */}
      <div style={{ background:WHITE, borderBottom:`1px solid ${GRAY2}`, padding:"0 20px", display:"flex", alignItems:"center", justifyContent:"space-between", height:58, position:"sticky", top:0, zIndex:50, boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ background:YLW, borderRadius:8, padding:"5px 13px", fontWeight:900, fontSize:17, color:BLK, letterSpacing:1.5 }}>blinkit</div>
          <div style={{ width:1, height:22, background:GRAY2 }} />
          <span style={{ fontSize:12, color:GRAY3, fontWeight:600, letterSpacing:0.5 }}>Admin · Dark Store Delhi-01</span>
          <div style={{ display:"flex", alignItems:"center", gap:5, background:liveOn ? "#F0FDF4" : "#FEF2F2", borderRadius:20, padding:"3px 10px", border:`1px solid ${liveOn ? "#BBF7D0" : "#FECACA"}` }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:liveOn ? GRN : RED }} />
            <span style={{ fontSize:11, color:liveOn ? GRN : RED, fontWeight:700 }}>{liveOn ? "LIVE" : "PAUSED"}</span>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:12, color:GRAY3 }}>{orders.length} orders · <strong style={{ color:BLK }}>₹{revenue.toLocaleString()}</strong></span>
          <button onClick={() => setLiveOn(p => !p)} style={{ ...s.btn(liveOn ? RED : GRN, WHITE, "7px 16px"), fontSize:12 }}>
            {liveOn ? "⏸ Pause" : "▶ Resume"}
          </button>
        </div>
      </div>

      {/* Nav tabs */}
      <div style={{ background:WHITE, borderBottom:`1px solid ${GRAY2}`, padding:"0 20px", display:"flex", gap:2 }}>
        {navs.map(n => (
          <button key={n.id} onClick={() => setTab(n.id)} style={{ ...s.btn("transparent", tab === n.id ? BLK : GRAY3, "12px 16px"), borderBottom:tab === n.id ? `2px solid ${YLW}` : "2px solid transparent", borderRadius:0, fontSize:13, fontWeight:tab === n.id ? 700 : 500 }}>
            {n.label}
            {n.badge > 0 && <span style={s.badge(n.badge)}>{n.badge}</span>}
          </button>
        ))}
      </div>

      <div style={{ flex:1, padding:20, overflowY:"auto" }}>

        {/* LIVE ORDERS */}
        {tab === "live" && (
          <div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
              {[
                { l:"Active Orders", v:active.length,            c:YLW,   sub:"In progress" },
                { l:"Delivered",     v:delivered.length,          c:GRN,   sub:"Completed" },
                { l:"Revenue",       v:`₹${revenue.toLocaleString()}`, c:BLU, sub:"Today" },
                { l:"Alerts",        v:outOfStock.length + lowStock.length, c:RED, sub:"Stock issues" },
              ].map(k => (
                <div key={k.l} style={{ ...s.card, borderTop:`3px solid ${k.c}` }}>
                  <div style={{ fontSize:11, color:GRAY3, fontWeight:600, marginBottom:4, textTransform:"uppercase", letterSpacing:"0.5px" }}>{k.l}</div>
                  <div style={{ fontSize:26, fontWeight:800, color:BLK }}>{k.v}</div>
                  <div style={{ fontSize:11, color:GRAY3, marginTop:2 }}>{k.sub}</div>
                </div>
              ))}
            </div>

            {orders.length === 0 && (
              <div style={{ ...s.card, textAlign:"center", padding:80, color:GRAY3 }}>
                <div style={{ fontSize:48, marginBottom:12 }}>⏳</div>
                <div style={{ fontSize:16, fontWeight:600, color:GRAY4 }}>Waiting for live orders...</div>
                <div style={{ fontSize:13, marginTop:6 }}>Orders will appear here automatically</div>
              </div>
            )}

            <div style={{ display:"grid", gap:12 }}>
              {orders.map(o => (
                <div key={o.id} onClick={() => setSelOrder(o)} style={{ ...s.card, borderLeft:`4px solid ${SM[o.status].color}`, cursor:"pointer", transition:"box-shadow 0.18s" }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.12)"}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.07)"}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                    <div>
                      <span style={{ fontWeight:800, fontSize:14, color:BLK }}>{o.id}</span>
                      <span style={{ color:GRAY3, fontSize:12, marginLeft:8 }}>{o.customer} · {o.area}</span>
                      {o.isCustomer && <span style={{ ...s.pill(BLU), fontSize:9, marginLeft:8 }}>CUSTOMER</span>}
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <span style={{ ...s.pill(SM[o.status].color), padding:"5px 12px" }}>{SM[o.status].label}</span>
                      <span style={{ fontWeight:800, color:GRN, fontSize:15 }}>₹{o.total}</span>
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:12 }}>
                    {o.items.map(i => <span key={i.sku} style={{ background:GRAY1, border:`1px solid ${GRAY2}`, borderRadius:6, padding:"3px 8px", fontSize:11, color:GRAY4 }}>{i.emoji} {i.name} ×{i.qty}</span>)}
                  </div>
                  <OrderTracker order={o} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* INVENTORY */}
        {tab === "inventory" && (
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <div>
                <h2 style={{ fontSize:18, fontWeight:800, color:BLK }}>Inventory Management</h2>
                <p style={{ color:GRAY3, fontSize:12, marginTop:2 }}>{inv.length} SKUs · <span style={{ color:RED }}>{outOfStock.length} out of stock</span> · <span style={{ color:"#D97706" }}>{lowStock.length} low stock</span></p>
              </div>
              <button onClick={() => { setForm({ name:"", sku:"", cat:"Dairy", emoji:"📦", price:"", cost:"", qty:"", msL:"", expiry:"", vendor:"", desc:"" }); setEditId(null); setShowForm(true); }} style={s.btn(YLW, BLK, "10px 20px")}>
                + Add Product
              </button>
            </div>

            <input placeholder="Search by name or SKU..." value={invSearch} onChange={e => setInvSearch(e.target.value)} style={{ ...s.inp, maxWidth:280, marginBottom:14 }} />

            <div style={{ background:WHITE, borderRadius:12, overflow:"hidden", border:`1px solid ${GRAY2}` }}>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead>
                  <tr>{["","SKU","Product","Category","Stock","Min Level","Price","Expiry","Actions"].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {inv.filter(i => i.name.toLowerCase().includes(invSearch.toLowerCase()) || i.sku.toLowerCase().includes(invSearch.toLowerCase())).map((item, idx) => {
                    const st = item.qty === 0 ? "out" : item.qty <= item.msL ? "low" : "ok";
                    const ew = item.expiry && item.expiry <= new Date(Date.now() + 3 * 864e5).toISOString().slice(0, 10);
                    return (
                      <tr key={item.id} style={{ background:idx % 2 === 0 ? WHITE : GRAY1 }}>
                        <td style={{ ...s.td, fontSize:22, textAlign:"center" }}>{item.emoji}</td>
                        <td style={s.td}><code style={{ background:GRAY1, padding:"2px 7px", borderRadius:5, fontSize:10, color:BLK, border:`1px solid ${GRAY2}` }}>{item.sku}</code></td>
                        <td style={{ ...s.td, fontWeight:600, color:BLK }}>{item.name}</td>
                        <td style={s.td}><span style={{ ...s.pill(GRAY1, GRAY4), fontSize:10, border:`1px solid ${GRAY2}` }}>{item.cat}</span></td>
                        <td style={s.td}>
                          <span style={{ fontWeight:800, fontSize:15, color:st === "out" ? RED : st === "low" ? "#D97706" : GRN }}>{item.qty}</span>
                          {st === "out" && <span style={{ ...s.pill(RED), marginLeft:6, fontSize:9 }}>OUT</span>}
                          {st === "low" && <span style={{ ...s.pill("#F59E0B", BLK), marginLeft:6, fontSize:9 }}>LOW</span>}
                        </td>
                        <td style={{ ...s.td, color:GRAY3 }}>{item.msL}</td>
                        <td style={{ ...s.td, fontWeight:700, color:BLK }}>₹{item.price}</td>
                        <td style={{ ...s.td, color:ew ? RED : GRAY3, fontWeight:ew ? 700 : 400, fontSize:11 }}>{item.expiry || "—"}{ew && " ⚠️"}</td>
                        <td style={s.td}>
                          <div style={{ display:"flex", gap:4 }}>
                            <button onClick={() => { setStockMod(item); setSAdj({ type:"IN", qty:"", note:"" }); }} style={{ ...s.btn(GRN, WHITE, "5px 10px"), fontSize:11 }}>Stock</button>
                            <button onClick={() => { setForm({ ...item, price:String(item.price), cost:String(item.cost), qty:String(item.qty), msL:String(item.msL) }); setEditId(item.id); setShowForm(true); }} style={{ ...s.btn(BLU, WHITE, "5px 10px"), fontSize:11 }}>Edit</button>
                            <button onClick={() => { if (window.confirm("Delete this product?")) setInv(p => p.filter(i => i.id !== item.id)); }} style={{ ...s.btn("#FEF2F2", RED, "5px 10px"), border:`1px solid #FECACA`, fontSize:11 }}>Del</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ADMIN */}
        {tab === "admin" && (
          <div>
            <h2 style={{ fontSize:18, fontWeight:800, color:BLK, marginBottom:16 }}>Store Management</h2>
            <div style={{ display:"flex", gap:8, marginBottom:18, flexWrap:"wrap" }}>
              {["overview","alerts","replenishment","staff"].map(t => (
                <button key={t} onClick={() => setATab(t)} style={{ ...s.btn(aTab === t ? YLW : WHITE, aTab === t ? BLK : GRAY4, "8px 18px"), textTransform:"capitalize", border:`1px solid ${aTab === t ? YLW : GRAY2}`, fontWeight:600, fontSize:12 }}>{t}</button>
              ))}
            </div>

            {aTab === "overview" && (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                <div style={s.card}>
                  <div style={{ fontWeight:700, marginBottom:14, fontSize:14, color:BLK }}>Inventory Health</div>
                  {[{ l:"Healthy",       v:inv.filter(i => i.qty > i.msL).length, c:GRN },
                    { l:"Low Stock",     v:lowStock.length,   c:"#D97706" },
                    { l:"Out of Stock",  v:outOfStock.length, c:RED }].map(r => (
                    <div key={r.l} style={{ marginBottom:12 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:4 }}>
                        <span style={{ color:GRAY3 }}>{r.l}</span>
                        <span style={{ color:r.c, fontWeight:700 }}>{r.v}</span>
                      </div>
                      <div style={{ background:GRAY2, borderRadius:8, height:6 }}>
                        <div style={{ background:r.c, width:`${(r.v / inv.length) * 100}%`, height:6, borderRadius:8, transition:"width 0.5s" }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div style={s.card}>
                  <div style={{ fontWeight:700, marginBottom:14, fontSize:14, color:BLK }}>Financials</div>
                  {[{ l:"Inventory Cost",     v:`₹${inv.reduce((a,i) => a + i.qty * i.cost,  0).toLocaleString()}`, c:"#7C3AED" },
                    { l:"Revenue Potential",  v:`₹${inv.reduce((a,i) => a + i.qty * i.price, 0).toLocaleString()}`, c:GRN },
                    { l:"Today's Revenue",    v:`₹${revenue.toLocaleString()}`,                                      c:BLU }].map(r => (
                    <div key={r.l} style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:`1px solid ${GRAY1}`, fontSize:13 }}>
                      <span style={{ color:GRAY3 }}>{r.l}</span>
                      <span style={{ fontWeight:700, color:r.c }}>{r.v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {aTab === "alerts" && (
              <div>
                {outOfStock.length === 0 && lowStock.length === 0
                  ? <div style={{ ...s.card, textAlign:"center", padding:48, color:GRAY3 }}><div style={{ fontSize:36, marginBottom:8 }}>✅</div>All stock levels are healthy</div>
                  : [...outOfStock.map(i => ({ ...i, _t:"out" })), ...lowStock.map(i => ({ ...i, _t:"low" }))].map(i => (
                    <div key={i.id} style={{ ...s.card, borderLeft:`4px solid ${i._t === "out" ? RED : "#D97706"}`, marginBottom:10, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <div style={{ fontSize:13 }}>
                        <span style={{ fontSize:20, marginRight:10 }}>{i.emoji}</span>
                        <strong style={{ color:i._t === "out" ? RED : "#D97706" }}>{i._t === "out" ? "Out of Stock" : "Low Stock"}</strong>
                        {" — "}{i.name} <span style={{ color:GRAY3 }}>({i.qty} units left)</span>
                      </div>
                    </div>
                  ))
                }
              </div>
            )}

            {aTab === "replenishment" && (
              <div>
                <div style={{ ...s.card, marginBottom:12, borderLeft:`4px solid ${GRN}`, display:"flex", gap:10, alignItems:"center" }}>
                  <span style={{ fontSize:20 }}>🤖</span>
                  <span style={{ fontSize:13, color:GRAY4 }}>Auto-replenishment <strong style={{ color:GRN }}>ACTIVE</strong></span>
                </div>
                {[...outOfStock, ...lowStock].map(item => (
                  <div key={item.id} style={{ ...s.card, display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                    <div style={{ fontSize:13, color:GRAY4 }}>{item.emoji} <strong style={{ color:BLK }}>{item.name}</strong> — needs <span style={{ color:YLW, fontWeight:800 }}>{Math.max(0, item.msL * 3 - item.qty)}</span> units from {item.vendor}</div>
                    <span style={{ ...s.pill(GRN), fontSize:10 }}>PO Sent</span>
                  </div>
                ))}
                {[...outOfStock, ...lowStock].length === 0 && <div style={{ ...s.card, textAlign:"center", color:GRAY3, padding:40 }}>No replenishment needed</div>}
              </div>
            )}

            {aTab === "staff" && (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
                {[{ n:"Ravi Kumar", r:"Store Manager", s:"active", t:12, em:"👨‍💼" },
                  { n:"Suresh M.",  r:"Picker",        s:"active", t:34, em:"🧺" },
                  { n:"Amit Singh", r:"Picker",        s:"active", t:28, em:"🧺" },
                  { n:"Priya D.",   r:"Packer",        s:"active", t:31, em:"📦" },
                  { n:"Rohit S.",   r:"Delivery",      s:"active", t:18, em:"🛵" },
                  { n:"Neha B.",    r:"Quality Check", s:"break",  t:15, em:"🔍" }].map(st => (
                  <div key={st.n} style={{ ...s.card, textAlign:"center", borderTop:`3px solid ${st.s === "active" ? GRN : "#D97706"}` }}>
                    <div style={{ fontSize:32, marginBottom:8 }}>{st.em}</div>
                    <div style={{ fontWeight:700, fontSize:13, color:BLK }}>{st.n}</div>
                    <div style={{ color:GRAY3, fontSize:11, marginBottom:8 }}>{st.r}</div>
                    <span style={{ ...s.pill(st.s === "active" ? GRN : "#F59E0B", st.s === "active" ? WHITE : BLK), fontSize:10 }}>{st.s.toUpperCase()}</span>
                    <div style={{ marginTop:8, fontSize:12, color:GRAY4, fontWeight:600 }}>{st.t} tasks today</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* LOG */}
        {tab === "log" && (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
            <div>
              <div style={{ fontWeight:700, marginBottom:10, fontSize:14, color:BLK }}>Notifications</div>
              <div style={{ maxHeight:500, overflowY:"auto", display:"grid", gap:6 }}>
                {notifications.length === 0 && <div style={{ ...s.card, textAlign:"center", color:GRAY3, padding:30 }}>No notifications yet</div>}
                {notifications.map(n => (
                  <div key={n.id} style={{ background:WHITE, borderRadius:8, padding:"8px 12px", borderLeft:`3px solid ${n.type === "danger" ? RED : n.type === "success" ? GRN : n.type === "order" ? BLU : "#D97706"}`, display:"flex", justifyContent:"space-between", gap:8, border:`1px solid ${GRAY2}` }}>
                    <span style={{ fontSize:12, color:GRAY4 }}>{n.msg}</span>
                    <span style={{ fontSize:10, color:GRAY3, whiteSpace:"nowrap" }}>{n.time}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontWeight:700, marginBottom:10, fontSize:14, color:BLK }}>Stock Movements</div>
              <div style={{ background:WHITE, borderRadius:12, overflow:"hidden", maxHeight:530, overflowY:"auto", border:`1px solid ${GRAY2}` }}>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead><tr>{["Time","SKU","Type","Qty","Note"].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {movements.length === 0 && <tr><td colSpan={5} style={{ ...s.td, textAlign:"center", color:GRAY3, padding:30 }}>No movements yet</td></tr>}
                    {movements.map((m, i) => (
                      <tr key={m.id} style={{ background:i % 2 === 0 ? WHITE : GRAY1 }}>
                        <td style={{ ...s.td, color:GRAY3, fontSize:11 }}>{m.time}</td>
                        <td style={s.td}><code style={{ background:GRAY1, padding:"1px 5px", borderRadius:4, fontSize:10, border:`1px solid ${GRAY2}` }}>{m.sku}</code></td>
                        <td style={s.td}><span style={{ ...s.pill(m.type === "IN" ? GRN : m.type === "OUT" ? RED : "#F59E0B", m.type === "IN" ? WHITE : m.type === "OUT" ? WHITE : BLK), fontSize:9 }}>{m.type}</span></td>
                        <td style={{ ...s.td, fontWeight:700, color:m.type === "IN" ? GRN : RED }}>{m.type === "IN" ? "+" : "-"}{m.qty}</td>
                        <td style={{ ...s.td, color:GRAY3, fontSize:11 }}>{m.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Order detail modal */}
      {selOrder && (() => {
        const live = orders.find(o => o.id === selOrder.id) || selOrder;
        return (
          <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:300, padding:16 }} onClick={e => { if (e.target === e.currentTarget) setSelOrder(null); }}>
            <div style={{ background:WHITE, borderRadius:16, padding:24, width:"100%", maxWidth:500, maxHeight:"90vh", overflowY:"auto", boxShadow:"0 20px 60px rgba(0,0,0,0.25)" }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:16 }}>
                <div>
                  <div style={{ fontWeight:800, fontSize:17, color:BLK }}>{live.id}</div>
                  <div style={{ color:GRAY3, fontSize:12, marginTop:2 }}>{live.customer} · {live.area} · {live.time}</div>
                </div>
                <button onClick={() => setSelOrder(null)} style={{ cursor:"pointer", border:`1px solid ${GRAY2}`, background:GRAY1, color:GRAY4, borderRadius:8, padding:"4px 12px", fontSize:12, fontWeight:600 }}>Close</button>
              </div>
              <OrderTracker order={live} />
              <div style={{ marginTop:14 }}>
                {live.items.map(i => (
                  <div key={i.sku} style={{ display:"flex", justifyContent:"space-between", background:GRAY1, borderRadius:8, padding:"9px 12px", marginBottom:6, fontSize:13 }}>
                    <span style={{ color:GRAY4 }}>{i.emoji} {i.name} ×{i.qty}</span>
                    <span style={{ fontWeight:700, color:BLK }}>₹{i.qty * i.price}</span>
                  </div>
                ))}
                <div style={{ display:"flex", justifyContent:"space-between", fontWeight:800, fontSize:15, padding:"12px 0", borderTop:`1px solid ${GRAY2}` }}>
                  <span style={{ color:GRAY3 }}>Total</span>
                  <span style={{ color:GRN }}>₹{live.total}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Add/Edit product modal */}
      {showForm && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:300, padding:16 }} onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div style={{ background:WHITE, borderRadius:16, padding:24, width:"100%", maxWidth:460, maxHeight:"90vh", overflowY:"auto", boxShadow:"0 20px 60px rgba(0,0,0,0.25)" }}>
            <h3 style={{ marginBottom:18, fontWeight:800, fontSize:16, color:BLK }}>{editId ? "Edit Product" : "Add New Product"}</h3>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {[{ l:"Name *", k:"name", t:"text", f:true }, { l:"SKU *", k:"sku", t:"text" }, { l:"Emoji", k:"emoji", t:"text" }, { l:"MRP ₹ *", k:"price", t:"number" }, { l:"Cost ₹", k:"cost", t:"number" }, { l:"Stock *", k:"qty", t:"number" }, { l:"Min Level", k:"msL", t:"number" }, { l:"Expiry Date", k:"expiry", t:"date" }, { l:"Vendor", k:"vendor", t:"text", f:true }].map(f => (
                <div key={f.k} style={{ gridColumn:f.f ? "span 2" : "span 1" }}>
                  <label style={{ fontSize:11, color:GRAY3, display:"block", marginBottom:4, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.4px" }}>{f.l}</label>
                  <input type={f.t} value={form[f.k] || ""} onChange={e => setForm(p => ({ ...p, [f.k]:e.target.value }))} style={s.inp} />
                </div>
              ))}
              <div style={{ gridColumn:"span 2" }}>
                <label style={{ fontSize:11, color:GRAY3, display:"block", marginBottom:4, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.4px" }}>Category</label>
                <select value={form.cat || "Dairy"} onChange={e => setForm(p => ({ ...p, cat:e.target.value }))} style={{ ...s.inp }}>
                  {CATS.slice(1).map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display:"flex", gap:8, marginTop:18 }}>
              <button onClick={saveInv} style={{ ...s.btn(YLW, BLK, "11px 0"), flex:1, fontSize:13, fontWeight:700 }}>{editId ? "Save Changes" : "Add Product"}</button>
              <button onClick={() => setShowForm(false)} style={{ ...s.btn(GRAY1, GRAY4, "11px 0"), border:`1px solid ${GRAY2}`, flex:1, fontSize:13 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Stock adjust modal */}
      {stockMod && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:300, padding:16 }} onClick={e => { if (e.target === e.currentTarget) setStockMod(null); }}>
          <div style={{ background:WHITE, borderRadius:16, padding:24, width:"100%", maxWidth:360, boxShadow:"0 20px 60px rgba(0,0,0,0.25)" }}>
            <h3 style={{ marginBottom:4, fontWeight:800, color:BLK, fontSize:15 }}>Adjust Stock</h3>
            <p style={{ color:GRAY3, fontSize:12, marginBottom:16 }}>{stockMod.emoji} {stockMod.name} · Current: <strong style={{ color:BLK }}>{stockMod.qty}</strong></p>
            <div style={{ display:"flex", gap:6, marginBottom:12 }}>
              {[["IN", GRN, WHITE], ["OUT", RED, WHITE], ["DAMAGE", "#F59E0B", BLK]].map(([t, bg, fg]) => (
                <button key={t} onClick={() => setSAdj(p => ({ ...p, type:t }))} style={{ ...s.btn(sAdj.type === t ? bg : GRAY1, sAdj.type === t ? fg : GRAY4, "9px 0"), flex:1, border:`1px solid ${sAdj.type === t ? bg : GRAY2}`, fontWeight:700 }}>{t}</button>
              ))}
            </div>
            <input type="number" min="1" value={sAdj.qty} onChange={e => setSAdj(p => ({ ...p, qty:e.target.value }))} placeholder="Quantity" style={{ ...s.inp, marginBottom:8 }} />
            <input value={sAdj.note} onChange={e => setSAdj(p => ({ ...p, note:e.target.value }))} placeholder="Reason (optional)" style={{ ...s.inp, marginBottom:16 }} />
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={adjStock} style={{ ...s.btn(sAdj.type === "IN" ? GRN : sAdj.type === "OUT" ? RED : "#F59E0B", sAdj.type === "DAMAGE" ? BLK : WHITE, "11px 0"), flex:1, fontWeight:700 }}>Confirm</button>
              <button onClick={() => setStockMod(null)} style={{ ...s.btn(GRAY1, GRAY4, "11px 0"), border:`1px solid ${GRAY2}`, flex:1 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   CUSTOMER PANEL
═══════════════════════════════════════════════════════════════════════════ */
function CustomerPanel({ store }) {
  const { inv, orders, custToast, placeOrder } = store;
  const geo = useGeolocation();

  const [page, setPage]       = useState("home");
  const [cat, setCat]         = useState("All");
  const [search, setSearch]   = useState("");
  const [cart, setCart]       = useState([]);
  const [selProd, setSelProd] = useState(null);
  const [myOrders, setMyOrders] = useState([]);
  const [trackId, setTrackId]   = useState(null);

  const custName    = "You (Customer)";
  const displayAddr = geo.loading ? "Detecting location..." : geo.address;

  const liveMyOrders = useMemo(() => orders.filter(o => myOrders.includes(o.id)), [orders, myOrders]);

  const addCart    = (item, qty = 1) => setCart(p => { const ex = p.find(x => x.sku === item.sku); if (ex) return p.map(x => x.sku === item.sku ? { ...x, qty:Math.min(x.qty + qty, item.qty) } : x); return [...p, { ...item, qty }]; });
  const removeCart = (sku) => setCart(p => p.filter(x => x.sku !== sku));
  const changeQty  = (sku, d) => setCart(p => p.map(x => x.sku === sku ? { ...x, qty:Math.max(1, x.qty + d) } : x));
  const cartTotal  = cart.reduce((a, i) => a + i.qty * i.price, 0);
  const cartCount  = cart.reduce((a, i) => a + i.qty, 0);

  const checkout = () => {
    if (!cart.length) return;
    const items = cart.map(c => ({ sku:c.sku, name:c.name, emoji:c.emoji, qty:c.qty, price:c.price }));
    const o = placeOrder(items, custName, geo.address.split(",")[0] || "Your Location", true);
    setMyOrders(p => [o.id, ...p]);
    setCart([]);
    setTrackId(o.id);
    setPage("tracking");
  };

  const filtered = useMemo(() => inv.filter(i => i.qty > 0 && (cat === "All" || i.cat === cat) && i.name.toLowerCase().includes(search.toLowerCase())), [inv, cat, search]);

  const s = {
    card: { background:WHITE, borderRadius:12, padding:20, boxShadow:"0 1px 4px rgba(0,0,0,0.07)", border:`1px solid ${GRAY2}` },
    btn:  (bg, fg = WHITE, p = "9px 18px") => ({ cursor:"pointer", border:"none", borderRadius:8, padding:p, fontWeight:600, fontSize:13, background:bg, color:fg, transition:"all 0.18s" }),
    pill: (bg, fg = WHITE) => ({ display:"inline-block", background:bg, color:fg, borderRadius:20, padding:"3px 10px", fontSize:11, fontWeight:600 }),
  };

  return (
    <div style={{ minHeight:"100vh", background:GRAY1, fontFamily:"'Segoe UI',system-ui,sans-serif", color:BLK, display:"flex", flexDirection:"column" }}>
      <Toast t={custToast} />

      {/* Header */}
      <div style={{ background:WHITE, borderBottom:`1px solid ${GRAY2}`, padding:"0 16px", display:"flex", alignItems:"center", justifyContent:"space-between", height:58, position:"sticky", top:0, zIndex:50, boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ background:YLW, borderRadius:8, padding:"5px 13px", fontWeight:900, fontSize:17, color:BLK, letterSpacing:1.5, cursor:"pointer" }} onClick={() => setPage("home")}>blinkit</div>
          <div style={{ width:1, height:22, background:GRAY2 }} />
          {/* Live location */}
          <div style={{ display:"flex", alignItems:"center", gap:5 }}>
            <span style={{ fontSize:14 }}>📍</span>
            <div>
              <div style={{ fontSize:11, color:GRAY3, fontWeight:600, lineHeight:1 }}>Deliver to</div>
              <div style={{ fontSize:12, color:BLK, fontWeight:700, maxWidth:180, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                {geo.loading ? <span style={{ color:GRAY3 }}>Locating...</span> : geo.error === "Permission denied" ? <span style={{ color:RED }}>Enable location</span> : displayAddr}
              </div>
            </div>
            {geo.loading && <span style={{ fontSize:12, color:YLW, animation:"spin 1s linear infinite" }}>◌</span>}
          </div>
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <button onClick={() => setPage("orders")} style={{ ...s.btn(GRAY1, GRAY4, "7px 13px"), border:`1px solid ${GRAY2}`, fontSize:12 }}>
            Orders
            {liveMyOrders.length > 0 && <span style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", background:BLU, color:WHITE, borderRadius:10, minWidth:16, height:16, fontSize:10, fontWeight:700, marginLeft:5, padding:"0 4px" }}>{liveMyOrders.length}</span>}
          </button>
          <button onClick={() => setPage("cart")} style={{ ...s.btn(YLW, BLK, "7px 14px"), fontWeight:700, fontSize:13 }}>
            🛒 Cart{cartCount > 0 && ` (${cartCount}) · ₹${cartTotal}`}
          </button>
        </div>
      </div>

      {page === "home" && (
        <div style={{ flex:1, padding:16 }}>
          {/* Hero */}
          <div style={{ background:BLK, borderRadius:16, padding:"28px 32px", marginBottom:20, display:"flex", justifyContent:"space-between", alignItems:"center", overflow:"hidden" }}>
            <div>
              <div style={{ fontSize:12, color:YLW, fontWeight:700, letterSpacing:1, marginBottom:6 }}>⚡ Quick Commerce</div>
              <div style={{ fontSize:26, fontWeight:900, color:WHITE, lineHeight:1.2, marginBottom:6 }}>Groceries in <span style={{ color:YLW }}>10 minutes</span></div>
              <div style={{ fontSize:12, color:GRAY3 }}>Fresh products from our dark store to your door</div>
              {geo.lat && <div style={{ marginTop:10, fontSize:11, color:GRAY3 }}>📍 Live GPS · {geo.lat.toFixed(4)}, {geo.lng.toFixed(4)}</div>}
            </div>
            <div style={{ fontSize:72 }}>🛵</div>
          </div>

          {/* Search */}
          <input placeholder="Search groceries, brands & more..." value={search} onChange={e => setSearch(e.target.value)} style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:`1px solid ${GRAY2}`, background:WHITE, fontSize:13, outline:"none", maxWidth:340, boxSizing:"border-box", marginBottom:14 }} />

          {/* Category pills */}
          <div style={{ display:"flex", gap:8, marginBottom:18, flexWrap:"wrap" }}>
            {CATS.map(c => (
              <button key={c} onClick={() => setCat(c)} style={{ ...s.btn(cat === c ? YLW : WHITE, cat === c ? BLK : GRAY4, "6px 14px"), border:`1px solid ${cat === c ? YLW : GRAY2}`, fontSize:12, fontWeight:cat === c ? 700 : 500 }}>{c}</button>
            ))}
          </div>

          {/* Product grid */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(158px,1fr))", gap:12 }}>
            {filtered.map(item => {
              const inCart = cart.find(x => x.sku === item.sku);
              return (
                <div key={item.id} style={{ background:WHITE, borderRadius:12, overflow:"hidden", border:`1px solid ${GRAY2}`, transition:"box-shadow 0.18s", cursor:"pointer" }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.1)"}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
                  <div onClick={() => { setSelProd(item); setPage("product"); }} style={{ background:GRAY1, padding:20, textAlign:"center", fontSize:52 }}>{item.emoji}</div>
                  <div style={{ padding:"10px 12px" }}>
                    <div style={{ fontSize:12, fontWeight:700, marginBottom:2, color:BLK, lineHeight:1.3 }}>{item.name}</div>
                    <div style={{ fontSize:10, color:GRAY3, marginBottom:8 }}>{item.desc}</div>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                      <span style={{ fontWeight:800, fontSize:15, color:BLK }}>₹{item.price}</span>
                      <span style={{ fontSize:9, color:item.qty < 10 ? RED : item.qty < 20 ? "#D97706" : GRN, fontWeight:600 }}>{item.qty < 10 ? `Only ${item.qty} left` : `${item.qty} in stock`}</span>
                    </div>
                    {inCart ? (
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:YLW, borderRadius:8, padding:"5px 8px" }}>
                        <button onClick={() => changeQty(item.sku, -1)} style={{ ...s.btn("transparent", BLK, "0 8px"), fontSize:17, fontWeight:800 }}>−</button>
                        <span style={{ fontWeight:800, fontSize:13, color:BLK }}>{inCart.qty}</span>
                        <button onClick={() => addCart(item)}  style={{ ...s.btn("transparent", BLK, "0 8px"), fontSize:17, fontWeight:800 }}>+</button>
                      </div>
                    ) : (
                      <button onClick={() => addCart(item)} style={{ ...s.btn(BLK, YLW, "8px 0"), width:"100%", fontSize:12, fontWeight:700 }}>+ Add to Cart</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {page === "product" && selProd && (() => {
        const live    = inv.find(i => i.id === selProd.id) || selProd;
        const inCart  = cart.find(x => x.sku === live.sku);
        return (
          <div style={{ flex:1, padding:16, maxWidth:520, margin:"0 auto", width:"100%", boxSizing:"border-box" }}>
            <button onClick={() => setPage("home")} style={{ ...s.btn(WHITE, GRAY4, "7px 14px"), border:`1px solid ${GRAY2}`, marginBottom:14, fontSize:12 }}>← Back</button>
            <div style={{ ...s.card, overflow:"hidden", padding:0 }}>
              <div style={{ background:GRAY1, padding:48, textAlign:"center", fontSize:90 }}>{live.emoji}</div>
              <div style={{ padding:20 }}>
                <div style={{ fontWeight:800, fontSize:20, marginBottom:3 }}>{live.name}</div>
                <div style={{ color:GRAY3, fontSize:13, marginBottom:12 }}>{live.desc}</div>
                <div style={{ fontSize:26, fontWeight:800, marginBottom:18 }}>₹{live.price}</div>
                {inCart ? (
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:22, background:YLW, borderRadius:10, padding:"12px 18px" }}>
                    <button onClick={() => changeQty(live.sku, -1)} style={{ ...s.btn("rgba(0,0,0,0.08)", BLK, "0 14px"), fontSize:20, fontWeight:800 }}>−</button>
                    <span style={{ fontWeight:800, fontSize:18, color:BLK }}>{inCart.qty} in cart</span>
                    <button onClick={() => addCart(live)}  style={{ ...s.btn("rgba(0,0,0,0.08)", BLK, "0 14px"), fontSize:20, fontWeight:800 }}>+</button>
                  </div>
                ) : (
                  <button onClick={() => addCart(live)} style={{ ...s.btn(BLK, YLW, "13px 0"), width:"100%", fontSize:14, fontWeight:700 }}>🛒 Add to Cart — ₹{live.price}</button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {page === "cart" && (
        <div style={{ flex:1, padding:16, maxWidth:500, margin:"0 auto", width:"100%", boxSizing:"border-box" }}>
          <button onClick={() => setPage("home")} style={{ ...s.btn(WHITE, GRAY4, "7px 14px"), border:`1px solid ${GRAY2}`, marginBottom:14, fontSize:12 }}>← Continue Shopping</button>
          <h2 style={{ fontWeight:800, fontSize:20, marginBottom:14 }}>Your Cart</h2>
          {cart.length === 0 && (
            <div style={{ textAlign:"center", padding:60, color:GRAY3 }}>
              <div style={{ fontSize:44, marginBottom:10 }}>🛒</div>
              <div style={{ fontWeight:600, fontSize:15, color:GRAY4 }}>Your cart is empty</div>
              <button onClick={() => setPage("home")} style={{ ...s.btn(BLK, YLW, "11px 24px"), marginTop:14, fontSize:13, fontWeight:700 }}>Shop Now</button>
            </div>
          )}
          {cart.map(item => (
            <div key={item.sku} style={{ ...s.card, display:"flex", gap:12, alignItems:"center", marginBottom:8, padding:12 }}>
              <div style={{ fontSize:34, background:GRAY1, borderRadius:8, padding:8, flexShrink:0 }}>{item.emoji}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:13 }}>{item.name}</div>
                <div style={{ color:GRAY3, fontSize:11, marginTop:1 }}>₹{item.price} each</div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ display:"flex", alignItems:"center", gap:6, background:GRAY1, borderRadius:8, padding:"5px 10px" }}>
                  <button onClick={() => changeQty(item.sku, -1)} style={{ ...s.btn("transparent", GRAY4, "0 4px"), fontSize:16, fontWeight:800 }}>−</button>
                  <span style={{ fontWeight:700, minWidth:18, textAlign:"center" }}>{item.qty}</span>
                  <button onClick={() => addCart(item)}  style={{ ...s.btn("transparent", GRAY4, "0 4px"), fontSize:16, fontWeight:800 }}>+</button>
                </div>
                <span style={{ fontWeight:800, fontSize:14 }}>₹{item.qty * item.price}</span>
                <button onClick={() => removeCart(item.sku)} style={{ ...s.btn(WHITE, RED, "3px 8px"), border:`1px solid #FECACA`, fontSize:14 }}>✕</button>
              </div>
            </div>
          ))}
          {cart.length > 0 && (
            <div style={{ ...s.card, marginTop:10 }}>
              <div style={{ fontWeight:800, fontSize:15, marginBottom:12 }}>Order Summary</div>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6, fontSize:13 }}><span style={{ color:GRAY3 }}>Subtotal</span><span>₹{cartTotal}</span></div>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6, fontSize:13 }}><span style={{ color:GRAY3 }}>Delivery fee</span><span style={{ color:GRN, fontWeight:600 }}>FREE</span></div>
              <div style={{ display:"flex", justifyContent:"space-between", fontWeight:800, fontSize:17, padding:"12px 0", borderTop:`1px solid ${GRAY2}` }}><span>Total</span><span>₹{cartTotal}</span></div>
              <div style={{ background:"#F0FDF4", borderRadius:8, padding:10, marginBottom:12, fontSize:12, color:"#166534", border:"1px solid #BBF7D0" }}>
                ⚡ Delivery in ~{rand(8, 14)} minutes · 📍 {displayAddr}
              </div>
              <button onClick={checkout} style={{ ...s.btn(BLK, YLW, "13px 0"), width:"100%", fontSize:14, fontWeight:700 }}>⚡ Place Order — ₹{cartTotal}</button>
            </div>
          )}
        </div>
      )}

      {page === "orders" && (
        <div style={{ flex:1, padding:16, maxWidth:520, margin:"0 auto", width:"100%", boxSizing:"border-box" }}>
          <button onClick={() => setPage("home")} style={{ ...s.btn(WHITE, GRAY4, "7px 14px"), border:`1px solid ${GRAY2}`, marginBottom:14, fontSize:12 }}>← Back</button>
          <h2 style={{ fontWeight:800, fontSize:20, marginBottom:14 }}>My Orders</h2>
          {liveMyOrders.length === 0 && (
            <div style={{ textAlign:"center", padding:60, color:GRAY3 }}>
              <div style={{ fontSize:44, marginBottom:10 }}>📦</div>
              <div style={{ fontWeight:600, color:GRAY4 }}>No orders yet</div>
              <button onClick={() => setPage("home")} style={{ ...s.btn(BLK, YLW, "11px 24px"), marginTop:14, fontWeight:700 }}>Shop Now</button>
            </div>
          )}
          {liveMyOrders.map(o => (
            <div key={o.id} onClick={() => { setTrackId(o.id); setPage("tracking"); }} style={{ ...s.card, marginBottom:10, borderLeft:`4px solid ${SM[o.status].color}`, cursor:"pointer", transition:"box-shadow 0.18s" }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.1)"}
              onMouseLeave={e => e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.07)"}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
                <div><div style={{ fontWeight:700, fontSize:14 }}>{o.id}</div><div style={{ color:GRAY3, fontSize:11, marginTop:2 }}>🕐 {o.time}</div></div>
                <div style={{ textAlign:"right" }}>
                  <span style={{ ...s.pill(SM[o.status].color), fontSize:11, padding:"4px 10px" }}>{SM[o.status].label}</span>
                  <div style={{ fontWeight:800, fontSize:15, marginTop:5 }}>₹{o.total}</div>
                </div>
              </div>
              <OrderTracker order={o} />
              <div style={{ marginTop:8, fontSize:11, color:BLU, fontWeight:600 }}>Tap to track →</div>
            </div>
          ))}
        </div>
      )}

      {page === "tracking" && (() => {
        const o = orders.find(x => x.id === trackId) || liveMyOrders[0];
        if (!o) return (
          <div style={{ flex:1, padding:40, textAlign:"center", color:GRAY3 }}>
            Order not found.
            <button onClick={() => setPage("home")} style={{ ...s.btn(BLK, YLW, "9px 20px"), marginLeft:10, fontSize:12, fontWeight:700 }}>Home</button>
          </div>
        );
        return (
          <div style={{ flex:1, padding:16, maxWidth:500, margin:"0 auto", width:"100%", boxSizing:"border-box" }}>
            <button onClick={() => setPage("orders")} style={{ ...s.btn(WHITE, GRAY4, "7px 14px"), border:`1px solid ${GRAY2}`, marginBottom:14, fontSize:12 }}>← My Orders</button>
            <div style={{ ...s.card, overflow:"hidden", padding:0 }}>
              <div style={{ background:`${SM[o.status].color}12`, padding:28, textAlign:"center", borderBottom:`1px solid ${GRAY2}` }}>
                <div style={{ fontSize:46, marginBottom:8 }}>{SM[o.status].icon}</div>
                <div style={{ fontSize:20, fontWeight:800, color:BLK }}>{SM[o.status].label}</div>
                <div style={{ fontSize:13, color:GRAY3, marginTop:4 }}>{SM[o.status].msg}</div>
                {o.status !== "delivered" && <div style={{ marginTop:8, display:"inline-block", background:SM[o.status].color, color:WHITE, borderRadius:20, padding:"5px 14px", fontSize:12, fontWeight:600 }}>ETA ~{o.eta} minutes</div>}
              </div>
              <div style={{ padding:20 }}>
                <OrderTracker order={o} />
                <div style={{ marginTop:14 }}>
                  {o.items.map(i => (
                    <div key={i.sku} style={{ display:"flex", justifyContent:"space-between", padding:"9px 0", borderBottom:`1px solid ${GRAY1}`, fontSize:13 }}>
                      <span style={{ color:GRAY4 }}>{i.emoji} {i.name} ×{i.qty}</span>
                      <span style={{ fontWeight:700 }}>₹{i.qty * i.price}</span>
                    </div>
                  ))}
                  <div style={{ display:"flex", justifyContent:"space-between", fontWeight:800, fontSize:16, paddingTop:12 }}><span>Total</span><span>₹{o.total}</span></div>
                </div>
                <div style={{ marginTop:14, background:GRAY1, borderRadius:10, padding:12, border:`1px solid ${GRAY2}` }}>
                  <div style={{ fontWeight:700, fontSize:11, marginBottom:8, color:GRAY4, textTransform:"uppercase", letterSpacing:"0.5px" }}>Live Updates</div>
                  {[...o.log].reverse().map((l, i) => (
                    <div key={i} style={{ display:"flex", gap:10, marginBottom:4, fontSize:12 }}>
                      <span style={{ color:SM[l.status]?.color, fontWeight:600, minWidth:72 }}>{l.time}</span>
                      <span style={{ color:GRAY4 }}>{SM[l.status]?.icon} {l.msg}</span>
                    </div>
                  ))}
                </div>
                {o.status === "delivered" && (
                  <div style={{ marginTop:14, background:"#F0FDF4", borderRadius:12, padding:18, textAlign:"center", border:"1px solid #BBF7D0" }}>
                    <div style={{ fontSize:40, marginBottom:6 }}>🎉</div>
                    <div style={{ fontWeight:800, color:"#166534", fontSize:16 }}>Order Delivered!</div>
                    <button onClick={() => setPage("home")} style={{ ...s.btn(BLK, YLW, "10px 26px"), marginTop:10, fontSize:13, fontWeight:700 }}>Order Again</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ROOT APP
═══════════════════════════════════════════════════════════════════════════ */
export default function App() {
  const store = useSharedStore();
  const [view, setView] = useState("split");

  return (
    <div style={{ minHeight:"100vh", background:GRAY1, fontFamily:"'Segoe UI',system-ui,sans-serif" }}>
      {/* Top bar */}
      <div style={{ background:WHITE, borderBottom:`1px solid ${GRAY2}`, padding:"0 20px", display:"flex", alignItems:"center", justifyContent:"space-between", height:50, position:"sticky", top:0, zIndex:100, boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ background:YLW, borderRadius:8, padding:"4px 13px", fontWeight:900, fontSize:16, color:BLK, letterSpacing:1.5 }}>blinkit</div>
          <span style={{ fontSize:11, color:GRAY3, fontWeight:600, letterSpacing:"0.5px" }}>Full Stack Real-Time IMS</span>
        </div>
        <div style={{ display:"flex", gap:6 }}>
          {[["split","Split View"], ["admin","Admin"], ["customer","Customer"]].map(([v, l]) => (
            <button key={v} onClick={() => setView(v)} style={{ cursor:"pointer", border:`1px solid ${view === v ? YLW : GRAY2}`, borderRadius:8, padding:"6px 15px", fontWeight:700, fontSize:12, background:view === v ? YLW : WHITE, color:view === v ? BLK : GRAY4, transition:"all 0.18s" }}>{l}</button>
          ))}
        </div>
      </div>

      {view === "split" && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", height:"calc(100vh - 50px)" }}>
          <div style={{ overflowY:"auto", borderRight:`2px solid ${YLW}` }}>
            <div style={{ background:YLW, padding:"4px 12px", fontSize:11, fontWeight:800, color:BLK, letterSpacing:"0.5px", position:"sticky", top:0, zIndex:10 }}>🛡️ ADMIN PANEL — DARK STORE DELHI-01</div>
            <AdminPanel store={store} />
          </div>
          <div style={{ overflowY:"auto" }}>
            <div style={{ background:BLK, padding:"4px 12px", fontSize:11, fontWeight:800, color:YLW, letterSpacing:"0.5px", position:"sticky", top:0, zIndex:10 }}>🛍️ CUSTOMER PANEL — LIVE SHOPPING</div>
            <CustomerPanel store={store} />
          </div>
        </div>
      )}
      {view === "admin"    && <div style={{ height:"calc(100vh - 50px)", overflowY:"auto" }}><AdminPanel    store={store} /></div>}
      {view === "customer" && <div style={{ height:"calc(100vh - 50px)", overflowY:"auto" }}><CustomerPanel store={store} /></div>}
    </div>
  );
}