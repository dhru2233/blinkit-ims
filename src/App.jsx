import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { auth, db, googleProvider } from "./firebase";
import {
  signInWithPopup, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signOut, onAuthStateChanged,
  updateProfile, RecaptchaVerifier, signInWithPhoneNumber
} from "firebase/auth";
import {
  collection, addDoc, onSnapshot, doc, setDoc,
  getDoc, updateDoc, query, orderBy, serverTimestamp
} from "firebase/firestore";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  C, PRODUCTS, CATS, LOCAL_STORES, DARK_STORE,
  RIDERS, STATUS_FLOW, SM, rand, pick, ts, fmtINR
} from "./constants";

/* ── Leaflet icon fix ──────────────────────────────────────────────────── */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl:"https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png", iconUrl:"https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png", shadowUrl:"https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png" });
const mkIcon = html => L.divIcon({ className:"", html, iconSize:[40,40], iconAnchor:[20,20] });
const riderIconL = mkIcon(`<div class="rider-dot">🛵</div>`);
const storeIconL = mkIcon(`<div class="store-dot">🏪</div>`);
const homeIconL  = mkIcon(`<div class="home-dot">🏠</div>`);
const localIconL = mkIcon(`<div class="local-dot">🛒</div>`);

/* ── Geo hook ──────────────────────────────────────────────────────────── */
function useGeo() {
  const [g, setG] = useState({ address:"Detecting...", lat:null, lng:null, loading:true });
  useEffect(() => {
    if (!navigator.geolocation) { setG(p=>({...p,address:"Location unavailable",loading:false})); return; }
    const ok = async pos => {
      const { latitude:lat, longitude:lng } = pos.coords;
      try {
        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
        const d = await r.json();
        const a = d.address||{};
        const parts = [a.road||a.neighbourhood, a.suburb||a.city_district, a.city||a.town].filter(Boolean);
        setG({ address:parts.slice(0,2).join(", ")||"Your location", lat, lng, loading:false });
      } catch { setG({ address:`${lat.toFixed(4)},${lng.toFixed(4)}`, lat, lng, loading:false }); }
    };
    const err = () => setG({ address:"Enable location", lat:28.5274, lng:77.2167, loading:false });
    navigator.geolocation.getCurrentPosition(ok, err, { timeout:10000 });
    const w = navigator.geolocation.watchPosition(ok, err, { timeout:15000, maximumAge:60000 });
    return () => navigator.geolocation.clearWatch(w);
  }, []);
  return g;
}

/* ── Notifications ─────────────────────────────────────────────────────── */
const reqNotif = async () => { if ("Notification" in window) await Notification.requestPermission(); };
const pushBrowser = (title, body) => { if (Notification.permission==="granted") new Notification(title, { body, icon:"/favicon.svg" }); };

/* ── Skeleton ──────────────────────────────────────────────────────────── */
const Sk = ({ w="100%", h=14, r=8, mb=0 }) => <div className="skeleton" style={{ width:w, height:h, borderRadius:r, marginBottom:mb }} />;
const ProdSk = () => (
  <div style={{ background:C.white, borderRadius:14, overflow:"hidden", border:`1px solid ${C.gray2}` }}>
    <Sk h={150} r={0} />
    <div style={{ padding:12 }}><Sk h={12} mb={6} /><Sk w="55%" h={10} mb={10} /><Sk h={34} r={8} /></div>
  </div>
);

/* ── Toast ─────────────────────────────────────────────────────────────── */
function Toast({ t }) {
  if (!t) return null;
  const bg = { danger:C.red, success:C.green, order:C.purple, warning:C.orange }[t.type] || C.dark2;
  return (
    <div className="fade-up" style={{ position:"fixed", top:70, right:16, zIndex:9999, background:bg, color:C.white, padding:"12px 18px", borderRadius:12, fontWeight:600, fontSize:13, maxWidth:310, boxShadow:"0 8px 24px rgba(0,0,0,0.2)", display:"flex", gap:10, alignItems:"center" }}>
      <span>{t.msg}</span>
    </div>
  );
}

/* ── Notification bell ─────────────────────────────────────────────────── */
function Bell({ notifs, onClear }) {
  const [open, setOpen] = useState(false);
  const unread = notifs.filter(n=>!n.read).length;
  return (
    <div style={{ position:"relative" }}>
      <button onClick={()=>setOpen(p=>!p)} style={{ background:open?"#f0f0f0":"transparent", border:`1px solid ${C.gray2}`, borderRadius:10, padding:"7px 10px", fontSize:18, position:"relative", cursor:"pointer", transition:"background .2s" }}>
        🔔
        {unread > 0 && <span style={{ position:"absolute", top:-3, right:-3, background:C.red, color:C.white, borderRadius:10, minWidth:16, height:16, fontSize:9, fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center", padding:"0 4px" }}>{unread}</span>}
      </button>
      {open && (
        <div className="scale-in" style={{ position:"fixed", top:66, right:16, background:C.white, border:`1px solid ${C.gray2}`, borderRadius:16, width:310, maxHeight:380, overflowY:"auto", boxShadow:"0 12px 40px rgba(0,0,0,0.15)", zIndex:300 }}>
          <div style={{ padding:"12px 16px", borderBottom:`1px solid ${C.gray2}`, display:"flex", justifyContent:"space-between", alignItems:"center", position:"sticky", top:0, background:C.white }}>
            <span style={{ fontWeight:700, fontSize:14 }}>Notifications</span>
            <button onClick={()=>{onClear();setOpen(false);}} style={{ background:"transparent", border:"none", color:C.gray3, fontSize:11, cursor:"pointer" }}>Clear all</button>
          </div>
          {notifs.length===0 && <div style={{ padding:28, textAlign:"center", color:C.gray3, fontSize:13 }}>All caught up! 🎉</div>}
          {notifs.map(n => (
            <div key={n.id} style={{ padding:"10px 16px", borderBottom:`1px solid ${C.gray1}`, background:n.read?C.white:"#FFFBEB", transition:"background .3s" }}>
              <div style={{ fontSize:12, color:C.dark2, lineHeight:1.4 }}>{n.msg}</div>
              <div style={{ fontSize:10, color:C.gray3, marginTop:3 }}>{n.time}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Order status tracker ──────────────────────────────────────────────── */
function Tracker({ order }) {
  return (
    <div style={{ padding:"0 4px" }}>
      <div className="status-track">
        {STATUS_FLOW.map((s, i) => {
          const done = i <= order.statusIdx, curr = i === order.statusIdx, after = i < order.statusIdx;
          return (
            <div key={s} style={{ display:"flex", alignItems:"center", flex:i < STATUS_FLOW.length-1 ? 1 : "none" }}>
              <div className={`status-dot${done?" done":""}${curr?" curr":""}`} style={{ background:done?SM[s].color:C.gray2, color:done?C.white:C.gray3, border:`2.5px solid ${curr?SM[s].color:done?"transparent":C.gray2}` }}>
                {curr ? SM[s].icon : done ? "✓" : i+1}
              </div>
              {i < STATUS_FLOW.length-1 && <div className="status-line" style={{ background:after?"linear-gradient(90deg,"+SM[STATUS_FLOW[i]].color+","+SM[STATUS_FLOW[i+1]].color+")":C.gray2 }} />}
            </div>
          );
        })}
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", marginTop:6 }}>
        {STATUS_FLOW.map((s,i) => (
          <div key={s} style={{ flex:1, textAlign:i===0?"left":i===STATUS_FLOW.length-1?"right":"center", fontSize:8, color:i<=order.statusIdx?C.dark2:C.gray3, fontWeight:i===order.statusIdx?700:400, lineHeight:1.2 }}>{SM[s].label}</div>
        ))}
      </div>
    </div>
  );
}

/* ── Countdown timer ───────────────────────────────────────────────────── */
function Countdown({ eta, status }) {
  const [secs, setSecs] = useState((eta||10)*60);
  useEffect(() => {
    if (status==="delivered") return;
    const iv = setInterval(() => setSecs(p=>Math.max(0,p-1)), 1000);
    return () => clearInterval(iv);
  }, [status]);
  const m = Math.floor(secs/60), s = secs%60;
  const pct = eta ? (secs/((eta||10)*60)) : 0;
  const r = 44, circ = 2*Math.PI*r;
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
      <svg width={108} height={108} className="countdown-ring">
        <circle cx={54} cy={54} r={r} fill="none" stroke={C.gray2} strokeWidth={6}/>
        <circle cx={54} cy={54} r={r} fill="none" stroke={C.yellow} strokeWidth={6} strokeDasharray={circ} strokeDashoffset={circ*(1-pct)} strokeLinecap="round" transform="rotate(-90 54 54)" style={{transition:"stroke-dashoffset 1s linear"}}/>
        <text x={54} y={50} textAnchor="middle" fontSize={22} fontWeight={800} fill={C.dark1}>{m}:{s.toString().padStart(2,"0")}</text>
        <text x={54} y={66} textAnchor="middle" fontSize={9} fill={C.gray3}>mins left</text>
      </svg>
    </div>
  );
}

/* ── Map component ─────────────────────────────────────────────────────── */
function FlyTo({ pos }) { const map=useMap(); useEffect(()=>{if(pos)map.flyTo(pos,14,{duration:1});},[pos,map]); return null; }

function LiveMap({ order, destPos }) {
  const [riderPos, setRiderPos] = useState(DARK_STORE.pos);
  const stepRef = useRef(0);
  const srcPos = order.localStoreId ? LOCAL_STORES.find(s=>s.id===order.localStoreId)?.pos || DARK_STORE.pos : DARK_STORE.pos;
  const STEPS = 30;

  useEffect(() => {
    if (order.statusIdx < 4) { setRiderPos(srcPos); stepRef.current=0; return; }
    if (order.statusIdx >= 5) { setRiderPos(destPos); return; }
    stepRef.current = 0;
    const iv = setInterval(() => {
      stepRef.current = Math.min(stepRef.current+1, STEPS);
      const t = stepRef.current/STEPS;
      setRiderPos([ srcPos[0]+(destPos[0]-srcPos[0])*t, srcPos[1]+(destPos[1]-srcPos[1])*t ]);
      if (stepRef.current >= STEPS) clearInterval(iv);
    }, 600);
    return () => clearInterval(iv);
  }, [order.statusIdx]);

  return (
    <div style={{ borderRadius:16, overflow:"hidden", border:`1px solid ${C.gray2}` }}>
      <MapContainer center={srcPos} zoom={13} style={{ height:240, width:"100%" }} zoomControl={false} scrollWheelZoom={false}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
        <Marker position={srcPos} icon={order.localStoreId?localIconL:storeIconL}/>
        <Marker position={destPos} icon={homeIconL}/>
        <Marker position={riderPos} icon={riderIconL}/>
        <Polyline positions={[srcPos,destPos]} pathOptions={{color:C.yellow,weight:3,dashArray:"8 6",opacity:.8}}/>
        <FlyTo pos={riderPos}/>
      </MapContainer>
      <div style={{ background:C.white, padding:"8px 14px", display:"flex", gap:16, fontSize:11, color:C.gray3, borderTop:`1px solid ${C.gray1}` }}>
        <span>🏪 {order.localStoreId?"Local Store":"Dark Store"}</span>
        <span>🛵 Rider (live)</span>
        <span>🏠 Your location</span>
      </div>
    </div>
  );
}

/* ── Picker journey cards ──────────────────────────────────────────────── */
function PickerJourney({ order }) {
  const rider = order.rider || RIDERS[0];
  const steps = [
    { s:"placed",           icon:"📱", title:"Order Received",   desc:`Order ${order.id} placed at ${order.time}` },
    { s:"confirmed",        icon:"✅", title:"Store Confirmed",  desc:"Dark store accepted your order" },
    { s:"picking",          icon:"🧺", title:"Picking Items",    desc:`Picker is collecting ${order.items?.length||0} items` },
    { s:"packed",           icon:"📦", title:"Order Packed",     desc:"Items packed & quality checked" },
    { s:"out_for_delivery", icon:"🛵", title:"Rider Assigned",   desc:rider?`${rider.name} (⭐${rider.rating}) • ${rider.phone}`:"Rider on the way" },
    { s:"delivered",        icon:"🎉", title:"Delivered!",       desc:"Order delivered successfully" },
  ];
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
      {steps.map((step,i) => {
        const done = i <= order.statusIdx, curr = i === order.statusIdx;
        return (
          <div key={step.s} style={{ display:"flex", gap:12, position:"relative" }}>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
              <div style={{ width:36, height:36, borderRadius:"50%", background:done?SM[step.s].color:C.gray2, display:"flex", alignItems:"center", justifyContent:"center", fontSize:curr?18:14, flexShrink:0, border:curr?`2px solid ${SM[step.s].color}`:"2px solid transparent", transition:"all .4s", boxShadow:curr?"0 0 0 4px "+SM[step.s].color+"25":"none" }}>
                {done ? step.icon : <span style={{ fontSize:11, fontWeight:700, color:C.gray3 }}>{i+1}</span>}
              </div>
              {i < steps.length-1 && <div style={{ width:2, flex:1, minHeight:28, background:i<order.statusIdx?"linear-gradient(180deg,"+SM[step.s].color+","+SM[STATUS_FLOW[i+1]].color+")":C.gray2, margin:"3px 0", borderRadius:2, transition:"background .4s" }}/>}
            </div>
            <div style={{ paddingBottom:i<steps.length-1?20:0, paddingTop:4, flex:1 }}>
              <div style={{ fontWeight:curr?700:600, fontSize:13, color:done?C.dark1:C.gray3 }}>{step.title}</div>
              <div style={{ fontSize:11, color:done?C.gray4:C.gray3, marginTop:2, lineHeight:1.4 }}>{step.desc}</div>
              {curr && <div style={{ marginTop:4, fontSize:10, color:SM[step.s].color, fontWeight:600 }} className="pulse-anim">● Live</div>}
            </div>
            {curr && <div style={{ fontSize:18 }} className="pulse-anim">{step.icon}</div>}
          </div>
        );
      })}
    </div>
  );
}

/* ── Mock Payment ──────────────────────────────────────────────────────── */
function PayModal({ total, onSuccess, onClose }) {
  const [step, setStep] = useState("choose");
  const [upi, setUpi]   = useState("");
  const [card, setCard] = useState({ num:"", exp:"", cvv:"", name:"" });

  const process = method => {
    setStep("processing");
    setTimeout(() => { setStep("done"); setTimeout(() => onSuccess(method), 1400); }, 2000);
  };

  const ov  = { position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:600, padding:16 };
  const box = { background:C.white, borderRadius:22, width:"100%", maxWidth:380, overflow:"hidden", boxShadow:"0 28px 60px rgba(0,0,0,0.3)" };
  const inp = { width:"100%", padding:"11px 13px", borderRadius:10, border:`1.5px solid ${C.gray2}`, fontSize:13, outline:"none", boxSizing:"border-box", marginBottom:10, transition:"border .2s" };
  const btn = (bg,fg=C.white) => ({ cursor:"pointer", border:"none", borderRadius:11, padding:"13px 0", fontWeight:700, fontSize:14, background:bg, color:fg, width:"100%", transition:"all .2s" });

  return (
    <div style={ov} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={box} className="scale-in">
        {/* Header */}
        <div style={{ background:`linear-gradient(135deg,${C.dark1},${C.dark2})`, padding:"18px 20px" }}>
          <div style={{ color:C.gray3, fontSize:11, fontWeight:600, letterSpacing:1 }}>SECURE CHECKOUT</div>
          <div style={{ color:C.white, fontWeight:900, fontSize:22, marginTop:2 }}>{fmtINR(total)}</div>
          <div style={{ display:"flex", gap:8, marginTop:10 }}>
            {["🔒 256-bit SSL","✅ PCI Compliant","🛡️ Safe"].map(t=><span key={t} style={{ background:"rgba(255,255,255,0.1)", color:C.gray3, borderRadius:6, padding:"2px 8px", fontSize:10, fontWeight:600 }}>{t}</span>)}
          </div>
        </div>

        {step==="choose" && (
          <div style={{ padding:20 }}>
            <div style={{ fontWeight:700, fontSize:14, marginBottom:14, color:C.dark1 }}>Choose payment method</div>
            {[
              { id:"upi",  icon:"📱", label:"UPI / GPay / PhonePe", sub:"Instant • No charges" },
              { id:"card", icon:"💳", label:"Credit / Debit Card",   sub:"Visa, Mastercard, RuPay" },
              { id:"cod",  icon:"💵", label:"Cash on Delivery",      sub:"Pay when delivered" },
            ].map(m => (
              <div key={m.id} onClick={()=>m.id==="cod"?process("COD"):setStep(m.id)}
                style={{ display:"flex", gap:14, alignItems:"center", padding:"13px 14px", borderRadius:12, border:`1.5px solid ${C.gray2}`, marginBottom:9, cursor:"pointer", transition:"all .18s" }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=C.yellow;e.currentTarget.style.background=C.gray1;}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=C.gray2;e.currentTarget.style.background=C.white;}}>
                <span style={{ fontSize:26 }}>{m.icon}</span>
                <div style={{ flex:1 }}><div style={{ fontWeight:600, fontSize:13, color:C.dark1 }}>{m.label}</div><div style={{ fontSize:11, color:C.gray3, marginTop:1 }}>{m.sub}</div></div>
                <span style={{ color:C.gray3, fontSize:16 }}>›</span>
              </div>
            ))}
          </div>
        )}

        {step==="upi" && (
          <div style={{ padding:20 }}>
            <button onClick={()=>setStep("choose")} style={{ background:"transparent", border:"none", color:C.gray3, fontSize:12, cursor:"pointer", marginBottom:14 }}>← Back</button>
            <div style={{ fontWeight:700, fontSize:14, marginBottom:14 }}>Enter UPI ID</div>
            <input value={upi} onChange={e=>setUpi(e.target.value)} placeholder="name@okicici / 9876543210@ybl" style={inp}/>
            <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
              {[{l:"GPay",id:"gpay"},{l:"PhonePe",id:"phonepe"},{l:"Paytm",id:"paytm"},{l:"BHIM",id:"bhim"}].map(a=>(
                <button key={a.id} onClick={()=>setUpi(`demo@${a.id}`)} style={{ padding:"5px 13px", borderRadius:20, border:`1px solid ${C.gray2}`, background:C.gray1, fontSize:11, fontWeight:600, cursor:"pointer" }}>{a.l}</button>
              ))}
            </div>
            <button onClick={()=>upi&&process("UPI")} style={btn(upi?C.black:C.gray2,upi?C.yellow:C.gray3)}>Pay {fmtINR(total)}</button>
          </div>
        )}

        {step==="card" && (
          <div style={{ padding:20 }}>
            <button onClick={()=>setStep("choose")} style={{ background:"transparent", border:"none", color:C.gray3, fontSize:12, cursor:"pointer", marginBottom:14 }}>← Back</button>
            <div style={{ fontWeight:700, fontSize:14, marginBottom:14 }}>Card Details</div>
            <input value={card.num} onChange={e=>setCard(p=>({...p,num:e.target.value.replace(/\D/g,"").slice(0,16)}))} placeholder="Card number" style={inp}/>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              <input value={card.exp} onChange={e=>setCard(p=>({...p,exp:e.target.value}))} placeholder="MM/YY" style={{...inp,marginBottom:0}}/>
              <input value={card.cvv} onChange={e=>setCard(p=>({...p,cvv:e.target.value.slice(0,4)}))} placeholder="CVV" style={{...inp,marginBottom:0}}/>
            </div>
            <input value={card.name} onChange={e=>setCard(p=>({...p,name:e.target.value}))} placeholder="Name on card" style={{...inp,marginTop:8}}/>
            <button onClick={()=>card.num.length>=16&&process("Card")} style={btn(card.num.length>=16?C.black:C.gray2,card.num.length>=16?C.yellow:C.gray3)}>Pay {fmtINR(total)}</button>
          </div>
        )}

        {step==="processing" && (
          <div style={{ padding:52, textAlign:"center" }}>
            <div style={{ fontSize:52, marginBottom:16 }} className="spin">⚙️</div>
            <div style={{ fontWeight:700, fontSize:17, color:C.dark1 }}>Processing payment...</div>
            <div style={{ color:C.gray3, fontSize:12, marginTop:6 }}>Please don't close this window</div>
            <div style={{ marginTop:20, height:5, background:C.gray2, borderRadius:10, overflow:"hidden" }}>
              <div style={{ height:"100%", background:`linear-gradient(90deg,${C.yellow},${C.orange})`, borderRadius:10, animation:"shimmer 1.2s ease infinite", backgroundSize:"400px 100%" }}/>
            </div>
          </div>
        )}

        {step==="done" && (
          <div style={{ padding:52, textAlign:"center" }}>
            <div style={{ fontSize:60, marginBottom:12 }} className="scale-in">✅</div>
            <div style={{ fontWeight:800, fontSize:19, color:C.green }}>Payment Successful!</div>
            <div style={{ color:C.gray3, fontSize:13, marginTop:6 }}>{fmtINR(total)} paid • Redirecting...</div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   LOGIN PAGE
═══════════════════════════════════════════════════════════════════════ */
function LoginPage({ onLogin }) {
  const [mode, setMode]     = useState("login");
  const [tab, setTab]       = useState("email"); // email | phone
  const [role, setRole]     = useState("customer");
  const [email, setEmail]   = useState("");
  const [pw, setPw]         = useState("");
  const [name, setName]     = useState("");
  const [phone, setPhone]   = useState("");
  const [otp, setOtp]       = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr]       = useState("");
  const recapRef = useRef(null);
  const cfmRef   = useRef(null);

  const ADMIN_EMAIL = "admin@blinkit.com";

  const saveUser = async (u, r) => {
    await setDoc(doc(db,"users",u.uid), { name:u.displayName||name||"User", email:u.email||"", phone:u.phoneNumber||phone||"", role:r, photo:u.photoURL||"", createdAt:serverTimestamp(), updatedAt:serverTimestamp() }, { merge:true });
  };

  const handleGoogle = async () => {
    setLoading(true); setErr("");
    try {
      const r = await signInWithPopup(auth, googleProvider);
      const role2 = r.user.email===ADMIN_EMAIL?"admin":"customer";
      await saveUser(r.user, role2);
      onLogin(r.user, role2);
    } catch(e) { setErr(e.message); } finally { setLoading(false); }
  };

  const handleEmail = async () => {
    if (!email||!pw) { setErr("Please fill all fields"); return; }
    setLoading(true); setErr("");
    try {
      let r;
      if (mode==="signup") {
        r = await createUserWithEmailAndPassword(auth,email,pw);
        if (name) await updateProfile(r.user,{displayName:name});
      } else {
        r = await signInWithEmailAndPassword(auth,email,pw);
      }
      const role2 = email===ADMIN_EMAIL||role==="admin" ? "admin":"customer";
      await saveUser(r.user, role2);
      onLogin(r.user, role2);
    } catch(e) {
      const m = {"auth/user-not-found":"No account found","auth/wrong-password":"Incorrect password","auth/email-already-in-use":"Email already registered","auth/weak-password":"Weak password (min 6 chars)"};
      setErr(m[e.code]||e.message);
    } finally { setLoading(false); }
  };

  const setupRecap = () => {
    if (!recapRef.current) {
      recapRef.current = new RecaptchaVerifier(auth, "recaptcha-container", { size:"invisible" });
    }
    return recapRef.current;
  };

  const sendOtp = async () => {
    if (!phone||phone.length<10) { setErr("Enter valid phone number"); return; }
    setLoading(true); setErr("");
    try {
      const verifier = setupRecap();
      const num = phone.startsWith("+")? phone : `+91${phone}`;
      cfmRef.current = await signInWithPhoneNumber(auth, num, verifier);
      setOtpSent(true);
    } catch(e) { setErr("OTP failed: "+e.message); } finally { setLoading(false); }
  };

  const verifyOtp = async () => {
    if (!otp||otp.length<6) { setErr("Enter 6-digit OTP"); return; }
    setLoading(true); setErr("");
    try {
      const r = await cfmRef.current.confirm(otp);
      await saveUser(r.user, "customer");
      onLogin(r.user, "customer");
    } catch(e) { setErr("Invalid OTP"); } finally { setLoading(false); }
  };

  const inp = { width:"100%", padding:"12px 14px", borderRadius:11, border:`1.5px solid ${C.gray2}`, fontSize:13, outline:"none", boxSizing:"border-box", transition:"border .2s", fontFamily:"inherit" };
  const btn2 = (bg,fg=C.white) => ({ cursor:"pointer", border:"none", borderRadius:11, padding:"13px 0", fontWeight:700, fontSize:14, background:bg, color:fg, width:"100%", transition:"all .2s", opacity:loading?.65:1, fontFamily:"inherit" });

  return (
    <div style={{ minHeight:"100vh", background:`linear-gradient(135deg,${C.dark1} 0%,${C.dark2} 60%,#1a1a2e 100%)`, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <div style={{ width:"100%", maxWidth:420 }}>
        {/* Logo */}
        <div className="fade-up" style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ background:C.yellow, borderRadius:14, padding:"10px 28px", fontWeight:900, fontSize:30, color:C.black, letterSpacing:2, display:"inline-block", marginBottom:10 }}>blinkit</div>
          <div style={{ color:C.gray3, fontSize:13 }}>India's fastest grocery delivery ⚡</div>
        </div>

        <div className="fade-up" style={{ background:"rgba(255,255,255,0.97)", borderRadius:22, padding:28, boxShadow:"0 28px 60px rgba(0,0,0,0.4)" }}>
          {/* Role toggle */}
          <div style={{ display:"flex", gap:6, marginBottom:22, background:C.gray1, borderRadius:12, padding:4 }}>
            {["customer","admin"].map(r => (
              <button key={r} onClick={()=>setRole(r)} style={{ flex:1, padding:"9px 0", borderRadius:10, border:"none", background:role===r?C.white:"transparent", fontWeight:700, fontSize:12, color:role===r?C.black:C.gray3, cursor:"pointer", transition:"all .2s", boxShadow:role===r?"0 2px 8px rgba(0,0,0,0.1)":"none" }}>
                {r==="admin"?"🛡️ Admin":"🛒 Customer"}
              </button>
            ))}
          </div>

          <h2 style={{ fontWeight:800, fontSize:21, marginBottom:3, color:C.dark1 }}>{mode==="login"?"Welcome back!":"Create account"}</h2>
          <p style={{ color:C.gray3, fontSize:12, marginBottom:18 }}>{mode==="login"?"Sign in to continue shopping":"Join 10M+ blinkit customers"}</p>

          {err && <div className="slide-r" style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:9, padding:"9px 12px", fontSize:12, color:C.red, marginBottom:14, fontWeight:600 }}>{err}</div>}

          {/* Tab: email / phone */}
          <div style={{ display:"flex", gap:6, marginBottom:18, background:C.gray1, borderRadius:10, padding:3 }}>
            {["email","phone"].map(t => (
              <button key={t} onClick={()=>{setTab(t);setErr("");}} style={{ flex:1, padding:"7px 0", borderRadius:8, border:"none", background:tab===t?C.white:"transparent", fontWeight:600, fontSize:12, color:tab===t?C.dark1:C.gray3, cursor:"pointer", textTransform:"capitalize", transition:"all .2s" }}>{t==="email"?"📧 Email":"📱 Phone"}</button>
            ))}
          </div>

          {tab==="email" && (
            <div>
              {mode==="signup" && (
                <div style={{ marginBottom:10 }}>
                  <label style={{ fontSize:11, color:C.gray3, display:"block", marginBottom:4, fontWeight:700, textTransform:"uppercase", letterSpacing:".4px" }}>Full Name</label>
                  <input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" style={inp}/>
                </div>
              )}
              <div style={{ marginBottom:10 }}>
                <label style={{ fontSize:11, color:C.gray3, display:"block", marginBottom:4, fontWeight:700, textTransform:"uppercase", letterSpacing:".4px" }}>Email</label>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder={role==="admin"?"admin@blinkit.com":"you@gmail.com"} style={inp}/>
              </div>
              <div style={{ marginBottom:18 }}>
                <label style={{ fontSize:11, color:C.gray3, display:"block", marginBottom:4, fontWeight:700, textTransform:"uppercase", letterSpacing:".4px" }}>Password</label>
                <input type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="••••••••" style={inp} onKeyDown={e=>e.key==="Enter"&&handleEmail()}/>
              </div>
              <button onClick={handleEmail} disabled={loading} style={btn2(C.black,C.yellow)} className="ripple-btn">
                {loading?<span className="spin">⚙️</span>:mode==="login"?"Sign In →":"Create Account →"}
              </button>
            </div>
          )}

          {tab==="phone" && (
            <div>
              <div id="recaptcha-container"/>
              {!otpSent ? (
                <>
                  <label style={{ fontSize:11, color:C.gray3, display:"block", marginBottom:4, fontWeight:700, textTransform:"uppercase", letterSpacing:".4px" }}>Phone Number</label>
                  <div style={{ display:"flex", gap:8, marginBottom:16 }}>
                    <div style={{ background:C.gray1, border:`1.5px solid ${C.gray2}`, borderRadius:11, padding:"12px 13px", fontSize:13, fontWeight:600, color:C.dark1, whiteSpace:"nowrap" }}>🇮🇳 +91</div>
                    <input value={phone} onChange={e=>setPhone(e.target.value.replace(/\D/g,"").slice(0,10))} placeholder="9876543210" style={{...inp,flex:1}}/>
                  </div>
                  <button onClick={sendOtp} disabled={loading} style={btn2(C.black,C.yellow)} className="ripple-btn">
                    {loading?<span className="spin">⚙️</span>:"Send OTP →"}
                  </button>
                </>
              ) : (
                <>
                  <div style={{ background:"#F0FDF4", borderRadius:10, padding:"9px 12px", fontSize:12, color:"#166534", marginBottom:14, border:"1px solid #BBF7D0" }}>OTP sent to +91{phone} ✅</div>
                  <label style={{ fontSize:11, color:C.gray3, display:"block", marginBottom:4, fontWeight:700, textTransform:"uppercase" }}>Enter OTP</label>
                  <input value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,"").slice(0,6))} placeholder="6-digit OTP" style={{...inp,marginBottom:16,letterSpacing:6,fontSize:18,textAlign:"center"}}/>
                  <button onClick={verifyOtp} disabled={loading} style={btn2(C.green)}>
                    {loading?<span className="spin">⚙️</span>:"Verify & Login →"}
                  </button>
                  <button onClick={()=>{setOtpSent(false);setOtp("");}} style={{ ...btn2(C.gray1,C.gray4), marginTop:8 }}>Change number</button>
                </>
              )}
            </div>
          )}

          <div style={{ display:"flex", alignItems:"center", gap:10, margin:"16px 0" }}>
            <div style={{ flex:1, height:1, background:C.gray2 }}/><span style={{ fontSize:11, color:C.gray3 }}>or</span><div style={{ flex:1, height:1, background:C.gray2 }}/>
          </div>

          <button onClick={handleGoogle} disabled={loading} style={{ ...btn2(C.gray1,C.dark1), border:`1.5px solid ${C.gray2}`, display:"flex", alignItems:"center", justifyContent:"center", gap:10 }} className="ripple-btn">
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width={18} height={18} alt="G"/>
            Continue with Google
          </button>

          <div style={{ textAlign:"center", marginTop:16, fontSize:12, color:C.gray3 }}>
            {mode==="login"?"Don't have an account? ":"Already registered? "}
            <span onClick={()=>{setMode(p=>p==="login"?"signup":"login");setErr("");}} style={{ color:C.dark1, fontWeight:700, cursor:"pointer" }}>
              {mode==="login"?"Sign up free":"Sign in"}
            </span>
          </div>

          {role==="admin" && (
            <div style={{ marginTop:14, background:"#FFFBEB", border:"1px solid #FDE68A", borderRadius:9, padding:"8px 12px", fontSize:11, color:"#92400E", textAlign:"center" }}>
              Admin login: admin@blinkit.com
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   ADMIN PANEL
═══════════════════════════════════════════════════════════════════════ */
function AdminPanel({ user, onLogout }) {
  const [inv, setInv]           = useState(PRODUCTS);
  const [orders, setOrders]     = useState([]);
  const [customers, setCustomers] = useState([]);
  const [tab, setTab]           = useState("live");
  const [aTab, setATab]         = useState("overview");
  const [liveOn, setLiveOn]     = useState(true);
  const [selOrder, setSelOrder] = useState(null);
  const [invSearch, setInvSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId]     = useState(null);
  const [form, setForm]         = useState({});
  const [stockMod, setStockMod] = useState(null);
  const [sAdj, setSAdj]         = useState({ type:"IN", qty:"", note:"" });
  const [notifs, setNotifs]     = useState([]);
  const [toast, setToast]       = useState(null);
  const [imgOk, setImgOk]       = useState({});
  const [loading, setLoading]   = useState(true);
  const liveRef = useRef();

  const pushN = useCallback((msg,type="info")=>{
    const n={id:Date.now()+Math.random(),msg,type,time:ts(),read:false};
    setNotifs(p=>[n,...p].slice(0,60));
    setToast(n); setTimeout(()=>setToast(null),3200);
    pushBrowser("Blinkit Admin",msg);
  },[]);

  /* Firestore listeners */
  useEffect(()=>{
    reqNotif();
    const uO=onSnapshot(query(collection(db,"orders"),orderBy("createdAt","desc")),snap=>{
      setOrders(snap.docs.map(d=>({fid:d.id,...d.data()})));
      setLoading(false);
    },()=>setLoading(false));
    const uC=onSnapshot(collection(db,"users"),snap=>{
      setCustomers(snap.docs.map(d=>({fid:d.id,...d.data()})).filter(u=>u.role!=="admin"));
    });
    return()=>{uO();uC();};
  },[]);

  /* Auto-advance orders */
  useEffect(()=>{
    const pending=orders.filter(o=>o.status!=="delivered"&&o.status!=="placed");
    pending.forEach(o=>{
      const delay=rand(8000,14000);
      const t=setTimeout(async()=>{
        if(o.statusIdx<STATUS_FLOW.length-1){
          const next=o.statusIdx+1;
          const ns=STATUS_FLOW[next];
          const newLog=[...(o.log||[]),{status:ns,time:ts(),msg:SM[ns].msg}];
          try{
            await updateDoc(doc(db,"orders",o.fid),{status:ns,statusIdx:next,log:newLog});
            pushN(`${SM[ns].icon} ${o.id} → ${SM[ns].label}`,"info");
          }catch(e){console.error(e);}
        }
      },delay);
      return()=>clearTimeout(t);
    });
  },[orders]);

  /* Live order simulation */
  const NAMES=["Rahul Sharma","Priya Mehta","Ankit Rao","Sneha Gupta","Vikram Singh","Neha Joshi","Arjun Nair","Kavya Reddy"];
  const AREAS=["Saket","Green Park","Hauz Khas","Vasant Kunj","South Ex","Malviya Nagar"];

  useEffect(()=>{
    if(!liveOn)return;
    liveRef.current=setInterval(()=>{
      const avail=inv.filter(i=>i.qty>0);
      if(!avail.length)return;
      const n=rand(1,3);
      const items=[...avail].sort(()=>Math.random()-.5).slice(0,n).map(p=>({sku:p.sku,name:p.name,emoji:p.emoji,qty:rand(1,2),price:p.price}));
      const customer=pick(NAMES),area=pick(AREAS);
      const total=items.reduce((a,i)=>a+i.qty*i.price,0);
      const oid=`ORD-${rand(300,999)}`;
      const rider=pick(RIDERS);
      const o={id:oid,customer,area,items,total,status:"placed",statusIdx:0,rider,time:ts(),eta:rand(8,14),isSimulated:true,paymentMethod:"COD",log:[{status:"placed",time:ts(),msg:SM.placed.msg}],createdAt:serverTimestamp()};
      addDoc(collection(db,"orders"),o).catch(console.error);
      pushN(`📱 New order ${oid} from ${customer} — ${fmtINR(total)}`,"order");
      // Advance through all statuses with delays
      let delay=rand(4000,7000);
      STATUS_FLOW.slice(1).forEach((ns,si)=>{
        delay+=rand(5000,10000);
        setTimeout(async()=>{
          const newStatusIdx=si+1;
          const newLog=[...(o.log||[]),{status:ns,time:ts(),msg:SM[ns].msg}];
          try{
            const snap=await onSnapshot(query(collection(db,"orders")),()=>{});
            // find by id and update
            const allOrders=orders;
            const found=allOrders.find(x=>x.id===oid);
            if(found?.fid){
              await updateDoc(doc(db,"orders",found.fid),{status:ns,statusIdx:newStatusIdx,log:newLog});
            }
          }catch(e){console.error(e);}
        },delay);
      });
    },rand(8000,14000));
    return()=>clearInterval(liveRef.current);
  },[liveOn,inv]);

  const active    = orders.filter(o=>o.status!=="delivered");
  const delivered = orders.filter(o=>o.status==="delivered");
  const revenue   = delivered.reduce((a,o)=>a+(o.total||0),0);
  const outOfStock= inv.filter(i=>i.qty===0);
  const lowStock  = inv.filter(i=>i.qty>0&&i.qty<=i.msL);

  /* Assign local store to order */
  const assignLocalStore = async (order, storeId) => {
    if(!order.fid)return;
    await updateDoc(doc(db,"orders",order.fid),{localStoreId:storeId,localStoreName:LOCAL_STORES.find(s=>s.id===storeId)?.name});
    pushN(`🏪 Local store assigned to ${order.id}`,"success");
  };

  const adjStock=()=>{
    if(!sAdj.qty||+sAdj.qty<=0){pushN("Enter valid qty","danger");return;}
    const q=+sAdj.qty;
    setInv(p=>p.map(i=>i.id!==stockMod.id?i:{...i,qty:sAdj.type==="IN"?i.qty+q:Math.max(0,i.qty-q)}));
    pushN(`Stock ${sAdj.type}: ${stockMod.name}`,"success");
    setStockMod(null);
  };

  const saveInv=()=>{
    if(!form.name||!form.sku||!form.price||!form.qty){pushN("Fill required fields","danger");return;}
    const e={...form,price:+form.price,cost:+form.cost,qty:+form.qty,msL:+form.msL||10};
    if(editId) setInv(p=>p.map(i=>i.id===editId?{...i,...e}:i));
    else setInv(p=>[...p,{...e,id:Date.now()}]);
    pushN(editId?"Product updated":"Product added","success");
    setShowForm(false);setEditId(null);
  };

  const sd = {
    card: { background:C.white,borderRadius:14,padding:20,border:`1px solid ${C.gray2}`,boxShadow:"0 1px 4px rgba(0,0,0,0.05)" },
    inp:  { width:"100%",padding:"9px 12px",borderRadius:9,border:`1px solid ${C.gray2}`,background:C.white,color:C.black,fontSize:13,outline:"none",boxSizing:"border-box",fontFamily:"inherit" },
    th:   { background:C.gray1,color:C.gray4,padding:"10px 12px",fontSize:11,fontWeight:700,textAlign:"left",borderBottom:`1px solid ${C.gray2}`,textTransform:"uppercase",letterSpacing:".5px" },
    td:   { padding:"10px 12px",fontSize:13,color:C.gray4,borderBottom:`1px solid ${C.gray1}` },
    btn:  (bg,fg=C.white,p="8px 16px")=>({cursor:"pointer",border:"none",borderRadius:9,padding:p,fontWeight:600,fontSize:12,background:bg,color:fg,transition:"all .18s",fontFamily:"inherit"}),
    pill: (bg,fg=C.white)=>({display:"inline-block",background:bg,color:fg,borderRadius:20,padding:"3px 10px",fontSize:11,fontWeight:600}),
  };

  const NAVS=[{id:"live",label:"Live Orders",badge:active.length},{id:"inventory",label:"Inventory",badge:outOfStock.length+lowStock.length},{id:"customers",label:"Customers",badge:0},{id:"stores",label:"Local Stores",badge:0},{id:"admin",label:"Analytics",badge:0}];

  return (
    <div style={{ minHeight:"100vh", background:C.gray1, fontFamily:"'Segoe UI',system-ui,sans-serif" }}>
      <Toast t={toast}/>

      {/* Header */}
      <div style={{ background:C.white, borderBottom:`1px solid ${C.gray2}`, padding:"0 20px", display:"flex", alignItems:"center", justifyContent:"space-between", height:58, position:"sticky", top:0, zIndex:50, boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ background:C.yellow, borderRadius:8, padding:"5px 13px", fontWeight:900, fontSize:17, color:C.black, letterSpacing:1.5 }}>blinkit</div>
          <div style={{ width:1, height:22, background:C.gray2 }}/>
          <span style={{ fontSize:12, color:C.gray3, fontWeight:600 }}>Admin · Dark Store – Saket, Delhi</span>
          <div style={{ display:"flex", alignItems:"center", gap:5, background:liveOn?"#F0FDF4":"#FEF2F2", borderRadius:20, padding:"3px 10px", border:`1px solid ${liveOn?"#BBF7D0":"#FECACA"}` }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:liveOn?C.green:C.red, ...(liveOn?{animation:"pulse 1.5s ease infinite"}:{}) }}/>
            <span style={{ fontSize:11, color:liveOn?C.green:C.red, fontWeight:700 }}>{liveOn?"LIVE":"PAUSED"}</span>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <Bell notifs={notifs} onClear={()=>setNotifs([])}/>
          <div style={{ display:"flex", alignItems:"center", gap:8, background:C.gray1, borderRadius:10, padding:"5px 10px", border:`1px solid ${C.gray2}` }}>
            {user.photoURL?<img src={user.photoURL} width={24} height={24} style={{ borderRadius:"50%" }} alt=""/>:<div style={{ width:24, height:24, borderRadius:"50%", background:C.yellow, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:11, color:C.black }}>{(user.displayName||"A")[0].toUpperCase()}</div>}
            <span style={{ fontSize:12, fontWeight:600, color:C.gray4 }}>{user.displayName||"Admin"}</span>
          </div>
          <button onClick={()=>setLiveOn(p=>!p)} style={sd.btn(liveOn?C.red:C.green,C.white,"7px 14px")}>{liveOn?"⏸ Pause":"▶ Resume"}</button>
          <button onClick={onLogout} style={sd.btn(C.gray1,C.gray4,"7px 14px")}>Sign out</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background:C.white, borderBottom:`1px solid ${C.gray2}`, padding:"0 20px", display:"flex", gap:2, overflowX:"auto" }}>
        {NAVS.map(n=>(
          <button key={n.id} onClick={()=>setTab(n.id)} style={{ ...sd.btn("transparent",tab===n.id?C.black:C.gray3,"12px 16px"), borderBottom:tab===n.id?`2.5px solid ${C.yellow}`:"2.5px solid transparent", borderRadius:0, fontWeight:tab===n.id?700:500, fontSize:13, whiteSpace:"nowrap" }}>
            {n.label}
            {n.badge>0&&<span style={{ ...sd.pill(C.red), fontSize:9, marginLeft:5, padding:"1px 6px" }}>{n.badge}</span>}
          </button>
        ))}
      </div>

      <div style={{ padding:20 }}>

        {/* ── LIVE ORDERS ── */}
        {tab==="live"&&(
          <div className="fade-up">
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
              {[{l:"Active",v:active.length,c:C.yellow,sub:"In progress"},{l:"Delivered",v:delivered.length,c:C.green,sub:"Completed"},{l:"Revenue",v:fmtINR(revenue),c:C.blue,sub:"Today"},{l:"Alerts",v:outOfStock.length+lowStock.length,c:C.red,sub:"Stock issues"}].map(k=>(
                <div key={k.l} style={{ ...sd.card, borderTop:`3px solid ${k.c}` }}>
                  <div style={{ fontSize:11, color:C.gray3, fontWeight:600, marginBottom:4, textTransform:"uppercase", letterSpacing:".5px" }}>{k.l}</div>
                  <div style={{ fontSize:28, fontWeight:900, color:C.dark1 }}>{k.v}</div>
                  <div style={{ fontSize:11, color:C.gray3, marginTop:2 }}>{k.sub}</div>
                </div>
              ))}
            </div>

            {loading&&[1,2,3].map(i=><div key={i} style={{ ...sd.card, marginBottom:12 }}><Sk w="40%" h={16} mb={12}/><Sk h={10} mb={8}/><Sk h={8}/></div>)}

            {!loading&&orders.length===0&&(
              <div style={{ ...sd.card, textAlign:"center", padding:80, color:C.gray3 }}>
                <div style={{ fontSize:48, marginBottom:12 }} className="pulse-anim">⏳</div>
                <div style={{ fontSize:16, fontWeight:600, color:C.gray4 }}>Waiting for orders...</div>
              </div>
            )}

            <div style={{ display:"grid", gap:12 }}>
              {orders.map(o=>(
                <div key={o.fid||o.id} className="fade-up" onClick={()=>setSelOrder(o)} style={{ ...sd.card, borderLeft:`4px solid ${SM[o.status]?.color||C.gray2}`, cursor:"pointer", transition:"box-shadow .18s" }}
                  onMouseEnter={e=>e.currentTarget.style.boxShadow="0 4px 18px rgba(0,0,0,0.12)"}
                  onMouseLeave={e=>e.currentTarget.style.boxShadow=sd.card.boxShadow}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                    <div>
                      <span style={{ fontWeight:800, fontSize:14, color:C.dark1 }}>{o.id}</span>
                      <span style={{ color:C.gray3, fontSize:12, marginLeft:8 }}>{o.customer} · {o.area}</span>
                      {o.localStoreId&&<span style={{ ...sd.pill(C.orange), fontSize:9, marginLeft:6 }}>LOCAL STORE</span>}
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <span style={{ ...sd.pill(SM[o.status]?.color||C.gray3), padding:"5px 12px" }}>{SM[o.status]?.label}</span>
                      <span style={{ fontWeight:800, color:C.green, fontSize:15 }}>{fmtINR(o.total)}</span>
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:12 }}>
                    {(o.items||[]).map(i=><span key={i.sku} style={{ background:C.gray1, border:`1px solid ${C.gray2}`, borderRadius:6, padding:"3px 8px", fontSize:11, color:C.gray4 }}>{i.emoji} {i.name} ×{i.qty}</span>)}
                  </div>
                  <Tracker order={o}/>
                  {/* Assign local store if out of stock items */}
                  {!o.localStoreId && (o.items||[]).some(i=>inv.find(p=>p.sku===i.sku)?.qty===0) && (
                    <div style={{ marginTop:10, padding:"8px 10px", background:"#FFFBEB", borderRadius:8, border:"1px solid #FDE68A", fontSize:12, color:"#92400E" }}>
                      ⚠️ Some items out of stock — assign local store:
                      <div style={{ display:"flex", gap:6, marginTop:6, flexWrap:"wrap" }}>
                        {LOCAL_STORES.map(ls=>(
                          <button key={ls.id} onClick={e=>{e.stopPropagation();assignLocalStore(o,ls.id);}} style={{ ...sd.btn(C.orange,C.white,"4px 10px"), fontSize:10 }}>{ls.name}</button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── INVENTORY ── */}
        {tab==="inventory"&&(
          <div className="fade-up">
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <div>
                <h2 style={{ fontSize:18, fontWeight:800, color:C.dark1 }}>Inventory</h2>
                <p style={{ color:C.gray3, fontSize:12, marginTop:2 }}>{inv.length} products · <span style={{ color:C.red }}>{outOfStock.length} out</span> · <span style={{ color:"#D97706" }}>{lowStock.length} low</span></p>
              </div>
              <button onClick={()=>{setForm({name:"",sku:"",cat:"Dairy",emoji:"📦",img:"",price:"",cost:"",qty:"",msL:"",expiry:"",vendor:"",desc:""});setEditId(null);setShowForm(true);}} style={sd.btn(C.yellow,C.black,"10px 20px")}>+ Add Product</button>
            </div>
            <input placeholder="Search products..." value={invSearch} onChange={e=>setInvSearch(e.target.value)} style={{ ...sd.inp, maxWidth:260, marginBottom:14 }}/>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:14 }}>
              {inv.filter(i=>i.name.toLowerCase().includes(invSearch.toLowerCase())||i.sku.toLowerCase().includes(invSearch.toLowerCase())).map(item=>{
                const st=item.qty===0?"out":item.qty<=item.msL?"low":"ok";
                return(
                  <div key={item.id} className="prod-card" style={{ background:C.white, borderRadius:14, overflow:"hidden", border:`1px solid ${C.gray2}`, boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
                    <div style={{ position:"relative", height:130, overflow:"hidden", background:C.gray1 }}>
                      {!imgOk[item.id]&&<Sk h={130} r={0}/>}
                      {item.img&&<img src={item.img} alt={item.name} onLoad={()=>setImgOk(p=>({...p,[item.id]:true}))} onError={()=>setImgOk(p=>({...p,[item.id]:true}))} style={{ width:"100%", height:130, objectFit:"cover", display:imgOk[item.id]?"block":"none" }}/>}
                      {st!=="ok"&&<div style={{ position:"absolute", top:8, right:8, ...sd.pill(st==="out"?C.red:"#F59E0B",st==="out"?C.white:C.black), fontSize:9 }}>{st==="out"?"OUT":"LOW"}</div>}
                    </div>
                    <div style={{ padding:12 }}>
                      <div style={{ fontWeight:700, fontSize:12, color:C.dark1, marginBottom:2 }}>{item.name}</div>
                      <div style={{ fontSize:10, color:C.gray3, marginBottom:8 }}>{item.cat} · Qty: <strong style={{ color:st==="out"?C.red:st==="low"?"#D97706":C.green }}>{item.qty}</strong></div>
                      <div style={{ fontWeight:800, fontSize:15, marginBottom:8 }}>{fmtINR(item.price)}</div>
                      <div style={{ display:"flex", gap:4 }}>
                        <button onClick={()=>{setStockMod(item);setSAdj({type:"IN",qty:"",note:""}); }} style={{ ...sd.btn(C.green,C.white,"5px 0"), flex:1, fontSize:10 }}>Stock</button>
                        <button onClick={()=>{setForm({...item,price:String(item.price),cost:String(item.cost),qty:String(item.qty),msL:String(item.msL)});setEditId(item.id);setShowForm(true);}} style={{ ...sd.btn(C.blue,C.white,"5px 0"), flex:1, fontSize:10 }}>Edit</button>
                        <button onClick={()=>{if(window.confirm("Delete?"))setInv(p=>p.filter(i=>i.id!==item.id));}} style={{ ...sd.btn("#FEF2F2",C.red,"5px 0"), border:`1px solid #FECACA`, flex:1, fontSize:10 }}>Del</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── CUSTOMERS ── */}
        {tab==="customers"&&(
          <div className="fade-up">
            <h2 style={{ fontSize:18, fontWeight:800, color:C.dark1, marginBottom:16 }}>Customer Profiles</h2>
            {customers.length===0&&<div style={{ ...sd.card, textAlign:"center", padding:40, color:C.gray3 }}>No customers yet</div>}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:14 }}>
              {customers.map(cu=>{
                const custOrders=orders.filter(o=>o.userId===cu.fid);
                const spent=custOrders.reduce((a,o)=>a+(o.total||0),0);
                return(
                  <div key={cu.fid} style={{ ...sd.card }} className="fade-up">
                    <div style={{ display:"flex", gap:12, alignItems:"center", marginBottom:14 }}>
                      {cu.photo?<img src={cu.photo} width={44} height={44} style={{ borderRadius:"50%", objectFit:"cover" }} alt=""/>:<div style={{ width:44, height:44, borderRadius:"50%", background:`linear-gradient(135deg,${C.yellow},${C.orange})`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:18, color:C.black, flexShrink:0 }}>{(cu.name||"U")[0].toUpperCase()}</div>}
                      <div>
                        <div style={{ fontWeight:700, fontSize:14, color:C.dark1 }}>{cu.name||"Customer"}</div>
                        <div style={{ fontSize:11, color:C.gray3 }}>{cu.email||cu.phone||"—"}</div>
                      </div>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10 }}>
                      {[{l:"Orders",v:custOrders.length},{l:"Spent",v:fmtINR(spent)}].map(s=>(
                        <div key={s.l} style={{ background:C.gray1, borderRadius:8, padding:"8px 10px" }}>
                          <div style={{ fontSize:10, color:C.gray3, marginBottom:2, fontWeight:600 }}>{s.l}</div>
                          <div style={{ fontWeight:800, fontSize:15, color:C.dark1 }}>{s.v}</div>
                        </div>
                      ))}
                    </div>
                    {cu.phone&&<div style={{ fontSize:11, color:C.gray3 }}>📱 {cu.phone}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── LOCAL STORES ── */}
        {tab==="stores"&&(
          <div className="fade-up">
            <h2 style={{ fontSize:18, fontWeight:800, color:C.dark1, marginBottom:6 }}>Local Store Network</h2>
            <p style={{ color:C.gray3, fontSize:13, marginBottom:20 }}>Auto-assigned when dark store runs out of stock. You can also manually override per order.</p>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:14, marginBottom:24 }}>
              {LOCAL_STORES.map(ls=>(
                <div key={ls.id} style={{ ...sd.card, borderLeft:`4px solid ${C.orange}` }} className="fade-up">
                  <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:12 }}>
                    <div style={{ fontSize:32 }}>🏪</div>
                    <div>
                      <div style={{ fontWeight:700, fontSize:14, color:C.dark1 }}>{ls.name}</div>
                      <div style={{ fontSize:11, color:C.gray3 }}>{ls.area}</div>
                    </div>
                    <span style={{ ...sd.pill(C.green), fontSize:10, marginLeft:"auto" }}>Active</span>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, fontSize:12, color:C.gray4 }}>
                    <div style={{ background:C.gray1, borderRadius:8, padding:"7px 10px" }}><div style={{ fontSize:10, color:C.gray3 }}>Delivery</div><div style={{ fontWeight:700 }}>{ls.deliveryTime}</div></div>
                    <div style={{ background:C.gray1, borderRadius:8, padding:"7px 10px" }}><div style={{ fontSize:10, color:C.gray3 }}>Rating</div><div style={{ fontWeight:700 }}>⭐ {ls.rating}</div></div>
                  </div>
                  <div style={{ marginTop:10, fontSize:11, color:C.gray3 }}>📞 {ls.phone}</div>
                </div>
              ))}
            </div>
            {/* Map of stores */}
            <div style={{ ...sd.card, padding:0, overflow:"hidden" }}>
              <MapContainer center={DARK_STORE.pos} zoom={13} style={{ height:300, width:"100%" }} zoomControl={false} scrollWheelZoom={false}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
                <Marker position={DARK_STORE.pos} icon={storeIconL}/>
                {LOCAL_STORES.map(ls=><Marker key={ls.id} position={ls.pos} icon={localIconL}/>)}
              </MapContainer>
              <div style={{ padding:"8px 14px", fontSize:11, color:C.gray3, display:"flex", gap:14 }}>
                <span>🏪 Dark Store (Saket)</span>
                <span>🛒 Local stores</span>
              </div>
            </div>
          </div>
        )}

        {/* ── ANALYTICS ── */}
        {tab==="admin"&&(
          <div className="fade-up">
            <h2 style={{ fontSize:18, fontWeight:800, color:C.dark1, marginBottom:16 }}>Analytics & Management</h2>
            <div style={{ display:"flex", gap:8, marginBottom:18, flexWrap:"wrap" }}>
              {["overview","alerts","staff"].map(t=>(
                <button key={t} onClick={()=>setATab(t)} style={{ ...sd.btn(aTab===t?C.yellow:C.white,aTab===t?C.black:C.gray4,"8px 18px"), border:`1px solid ${aTab===t?C.yellow:C.gray2}`, fontWeight:600, fontSize:12, textTransform:"capitalize" }}>{t}</button>
              ))}
            </div>

            {aTab==="overview"&&(
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                <div style={sd.card}>
                  <div style={{ fontWeight:700, fontSize:14, marginBottom:14 }}>Inventory Health</div>
                  {[{l:"Healthy",v:inv.filter(i=>i.qty>i.msL).length,c:C.green},{l:"Low Stock",v:lowStock.length,c:"#D97706"},{l:"Out of Stock",v:outOfStock.length,c:C.red}].map(r=>(
                    <div key={r.l} style={{ marginBottom:12 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:4 }}><span style={{ color:C.gray3 }}>{r.l}</span><span style={{ color:r.c, fontWeight:700 }}>{r.v}</span></div>
                      <div style={{ background:C.gray2, borderRadius:8, height:7 }}><div style={{ background:r.c, width:`${(r.v/inv.length)*100}%`, height:7, borderRadius:8, transition:"width .5s" }}/></div>
                    </div>
                  ))}
                </div>
                <div style={sd.card}>
                  <div style={{ fontWeight:700, fontSize:14, marginBottom:14 }}>Revenue Summary</div>
                  {[{l:"Inventory Cost",v:fmtINR(inv.reduce((a,i)=>a+i.qty*i.cost,0)),c:C.purple},{l:"Revenue Potential",v:fmtINR(inv.reduce((a,i)=>a+i.qty*i.price,0)),c:C.green},{l:"Today's Revenue",v:fmtINR(revenue),c:C.blue}].map(r=>(
                    <div key={r.l} style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:`1px solid ${C.gray1}`, fontSize:13 }}>
                      <span style={{ color:C.gray3 }}>{r.l}</span><span style={{ fontWeight:700, color:r.c }}>{r.v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {aTab==="alerts"&&(
              <div>
                {[...outOfStock,...lowStock].length===0
                  ?<div style={{ ...sd.card, textAlign:"center", padding:48, color:C.gray3 }}><div style={{ fontSize:36, marginBottom:8 }}>✅</div>All stock healthy</div>
                  :[...outOfStock.map(i=>({...i,_t:"out"})),...lowStock.map(i=>({...i,_t:"low"}))].map(i=>(
                    <div key={i.id} style={{ ...sd.card, borderLeft:`4px solid ${i._t==="out"?C.red:"#D97706"}`, marginBottom:10, display:"flex", gap:14, alignItems:"center" }}>
                      <img src={i.img} alt="" width={50} height={50} style={{ borderRadius:10, objectFit:"cover" }}/>
                      <div style={{ flex:1 }}><strong style={{ color:i._t==="out"?C.red:"#D97706" }}>{i._t==="out"?"Out of Stock":"Low Stock"}</strong> — {i.name} <span style={{ color:C.gray3 }}>({i.qty} left)</span></div>
                      <div style={{ fontSize:11, color:C.orange }}>Auto-routing to local store</div>
                    </div>
                  ))
                }
              </div>
            )}

            {aTab==="staff"&&(
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
                {[{n:"Ravi Kumar",r:"Manager",s:"active",t:12,em:"👨‍💼"},{n:"Suresh M.",r:"Picker",s:"active",t:34,em:"🧺"},{n:"Amit Singh",r:"Picker",s:"active",t:28,em:"🧺"},{n:"Priya D.",r:"Packer",s:"active",t:31,em:"📦"},{n:"Rohit S.",r:"Delivery",s:"active",t:18,em:"🛵"},{n:"Neha B.",r:"QC",s:"break",t:15,em:"🔍"}].map(st=>(
                  <div key={st.n} style={{ ...sd.card, textAlign:"center", borderTop:`3px solid ${st.s==="active"?C.green:"#D97706"}` }}>
                    <div style={{ fontSize:32, marginBottom:8 }}>{st.em}</div>
                    <div style={{ fontWeight:700, fontSize:13 }}>{st.n}</div>
                    <div style={{ color:C.gray3, fontSize:11, marginBottom:8 }}>{st.r}</div>
                    <span style={{ ...sd.pill(st.s==="active"?C.green:"#F59E0B",st.s==="active"?C.white:C.black), fontSize:10 }}>{st.s.toUpperCase()}</span>
                    <div style={{ marginTop:8, fontSize:12, color:C.gray4, fontWeight:600 }}>{st.t} tasks today</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Order modal */}
      {selOrder&&(()=>{
        const o=selOrder;
        return(
          <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:300, padding:16 }} onClick={e=>{if(e.target===e.currentTarget)setSelOrder(null);}}>
            <div className="scale-in" style={{ background:C.white, borderRadius:18, padding:24, width:"100%", maxWidth:520, maxHeight:"90vh", overflowY:"auto", boxShadow:"0 24px 60px rgba(0,0,0,0.3)" }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:14 }}>
                <div><div style={{ fontWeight:800, fontSize:17 }}>{o.id}</div><div style={{ color:C.gray3, fontSize:12, marginTop:2 }}>{o.customer} · {o.area} · {o.time}</div></div>
                <button onClick={()=>setSelOrder(null)} style={{ cursor:"pointer", border:`1px solid ${C.gray2}`, background:C.gray1, color:C.gray4, borderRadius:8, padding:"4px 12px", fontSize:12 }}>✕</button>
              </div>
              <Tracker order={o}/>
              <div style={{ marginTop:16, marginBottom:14 }}>
                <PickerJourney order={o}/>
              </div>
              {(o.items||[]).map(i=>(
                <div key={i.sku} style={{ display:"flex", justifyContent:"space-between", background:C.gray1, borderRadius:8, padding:"9px 12px", marginBottom:6, fontSize:13 }}>
                  <span style={{ color:C.gray4 }}>{i.emoji} {i.name} ×{i.qty}</span>
                  <span style={{ fontWeight:700 }}>{fmtINR(i.qty*i.price)}</span>
                </div>
              ))}
              <div style={{ display:"flex", justifyContent:"space-between", fontWeight:800, fontSize:15, padding:"12px 0", borderTop:`1px solid ${C.gray2}` }}>
                <span style={{ color:C.gray3 }}>Total</span><span style={{ color:C.green }}>{fmtINR(o.total)}</span>
              </div>
              {o.localStoreId&&(
                <div style={{ background:"#FFF7ED", borderRadius:10, padding:"10px 14px", border:"1px solid #FED7AA", fontSize:12, color:"#92400E", marginTop:8 }}>
                  🏪 Fulfilled by: <strong>{LOCAL_STORES.find(s=>s.id===o.localStoreId)?.name}</strong>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Add/edit product modal */}
      {showForm&&(
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:300, padding:16 }} onClick={e=>{if(e.target===e.currentTarget)setShowForm(false);}}>
          <div className="scale-in" style={{ background:C.white, borderRadius:18, padding:24, width:"100%", maxWidth:480, maxHeight:"90vh", overflowY:"auto", boxShadow:"0 24px 60px rgba(0,0,0,0.3)" }}>
            <h3 style={{ marginBottom:16, fontWeight:800, fontSize:16 }}>{editId?"Edit Product":"Add New Product"}</h3>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {[{l:"Name *",k:"name",t:"text",f:true},{l:"SKU *",k:"sku",t:"text"},{l:"Emoji",k:"emoji",t:"text"},{l:"Image URL",k:"img",t:"text",f:true},{l:"MRP ₹ *",k:"price",t:"number"},{l:"Cost ₹",k:"cost",t:"number"},{l:"Stock *",k:"qty",t:"number"},{l:"Min Level",k:"msL",t:"number"},{l:"Expiry",k:"expiry",t:"date"},{l:"Vendor",k:"vendor",t:"text",f:true}].map(f=>(
                <div key={f.k} style={{ gridColumn:f.f?"span 2":"span 1" }}>
                  <label style={{ fontSize:11, color:C.gray3, display:"block", marginBottom:4, fontWeight:700, textTransform:"uppercase", letterSpacing:".4px" }}>{f.l}</label>
                  <input type={f.t} value={form[f.k]||""} onChange={e=>setForm(p=>({...p,[f.k]:e.target.value}))} style={{ ...sd.inp }}/>
                </div>
              ))}
              <div style={{ gridColumn:"span 2" }}>
                <label style={{ fontSize:11, color:C.gray3, display:"block", marginBottom:4, fontWeight:700, textTransform:"uppercase" }}>Category</label>
                <select value={form.cat||"Dairy"} onChange={e=>setForm(p=>({...p,cat:e.target.value}))} style={sd.inp}>{CATS.slice(1).map(c=><option key={c}>{c}</option>)}</select>
              </div>
            </div>
            {form.img&&<img src={form.img} alt="" style={{ width:"100%", height:100, objectFit:"cover", borderRadius:10, marginTop:10 }}/>}
            <div style={{ display:"flex", gap:8, marginTop:18 }}>
              <button onClick={saveInv} style={{ ...sd.btn(C.yellow,C.black,"11px 0"), flex:1, fontWeight:700 }}>{editId?"Save Changes":"Add Product"}</button>
              <button onClick={()=>setShowForm(false)} style={{ ...sd.btn(C.gray1,C.gray4,"11px 0"), border:`1px solid ${C.gray2}`, flex:1 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Stock adjust modal */}
      {stockMod&&(
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:300, padding:16 }} onClick={e=>{if(e.target===e.currentTarget)setStockMod(null);}}>
          <div className="scale-in" style={{ background:C.white, borderRadius:18, padding:24, width:"100%", maxWidth:360, boxShadow:"0 24px 60px rgba(0,0,0,0.3)" }}>
            <div style={{ display:"flex", gap:12, alignItems:"center", marginBottom:14 }}>
              {stockMod.img&&<img src={stockMod.img} alt="" width={56} height={56} style={{ borderRadius:10, objectFit:"cover" }}/>}
              <div><div style={{ fontWeight:800, fontSize:15 }}>{stockMod.name}</div><div style={{ color:C.gray3, fontSize:12 }}>Current: <strong>{stockMod.qty}</strong></div></div>
            </div>
            <div style={{ display:"flex", gap:6, marginBottom:12 }}>
              {[["IN",C.green,C.white],["OUT",C.red,C.white],["DAMAGE","#F59E0B",C.black]].map(([t,bg,fg])=>(
                <button key={t} onClick={()=>setSAdj(p=>({...p,type:t}))} style={{ ...sd.btn(sAdj.type===t?bg:C.gray1,sAdj.type===t?fg:C.gray4,"9px 0"), flex:1, border:`1px solid ${sAdj.type===t?bg:C.gray2}`, fontWeight:700 }}>{t}</button>
              ))}
            </div>
            <input type="number" min="1" value={sAdj.qty} onChange={e=>setSAdj(p=>({...p,qty:e.target.value}))} placeholder="Quantity" style={{ ...sd.inp, marginBottom:8 }}/>
            <input value={sAdj.note} onChange={e=>setSAdj(p=>({...p,note:e.target.value}))} placeholder="Reason (optional)" style={{ ...sd.inp, marginBottom:16 }}/>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={adjStock} style={{ ...sd.btn(sAdj.type==="IN"?C.green:sAdj.type==="OUT"?C.red:"#F59E0B",sAdj.type==="DAMAGE"?C.black:C.white,"11px 0"), flex:1, fontWeight:700 }}>Confirm</button>
              <button onClick={()=>setStockMod(null)} style={{ ...sd.btn(C.gray1,C.gray4,"11px 0"), border:`1px solid ${C.gray2}`, flex:1 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   CUSTOMER PANEL
═══════════════════════════════════════════════════════════════════════ */
function CustomerPanel({ user, onLogout }) {
  const geo = useGeo();
  const [products]          = useState(PRODUCTS);
  const [orders, setOrders] = useState([]);
  const [page, setPage]     = useState("home");
  const [cat, setCat]       = useState("All");
  const [search, setSearch] = useState("");
  const [cart, setCart]     = useState([]);
  const [selProd, setSelProd] = useState(null);
  const [myOrderIds, setMyOrderIds] = useState([]);
  const [trackId, setTrackId]   = useState(null);
  const [showPay, setShowPay]   = useState(false);
  const [pending, setPending]   = useState(null);
  const [notifs, setNotifs]     = useState([]);
  const [toast, setToast]       = useState(null);
  const [imgOk, setImgOk]       = useState({});
  const [loading, setLoading]   = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [profile, setProfile]   = useState({ name:user.displayName||"", phone:"", addresses:[] });
  const [showAddrForm, setShowAddrForm] = useState(false);
  const [newAddr, setNewAddr]   = useState({ label:"Home", address:"" });

  const pushN = useCallback((msg,type="info")=>{
    const n={id:Date.now()+Math.random(),msg,type,time:ts(),read:false};
    setNotifs(p=>[n,...p].slice(0,30));
    setToast(n);setTimeout(()=>setToast(null),3200);
    pushBrowser("Blinkit",msg);
  },[]);

  useEffect(()=>{
    reqNotif();
    const unsub=onSnapshot(query(collection(db,"orders"),orderBy("createdAt","desc")),snap=>{
      setOrders(snap.docs.map(d=>({fid:d.id,...d.data()})));
      setLoading(false);
    },()=>setLoading(false));
    // Load profile
    getDoc(doc(db,"users",user.uid)).then(snap=>{
      if(snap.exists()) setProfile(p=>({...p,...snap.data()}));
    });
    return unsub;
  },[user.uid]);

  const myOrders = useMemo(()=>orders.filter(o=>myOrderIds.includes(o.id)||o.userId===user.uid),[orders,myOrderIds,user.uid]);

  const addCart    = (item,qty=1) => setCart(p=>{const ex=p.find(x=>x.sku===item.sku);if(ex)return p.map(x=>x.sku===item.sku?{...x,qty:Math.min(x.qty+qty,item.qty)}:x);return[...p,{...item,qty}];});
  const removeCart = sku => setCart(p=>p.filter(x=>x.sku!==sku));
  const changeQty  = (sku,d) => setCart(p=>p.map(x=>x.sku===sku?{...x,qty:Math.max(1,x.qty+d)}:x));
  const cartTotal  = cart.reduce((a,i)=>a+i.qty*i.price,0);
  const cartCount  = cart.reduce((a,i)=>a+i.qty,0);

  const initiateCheckout = () => { if(!cart.length)return; setPending(cart.map(c=>({sku:c.sku,name:c.name,emoji:c.emoji,qty:c.qty,price:c.price,img:c.img||""}))); setShowPay(true); };

  const onPaySuccess = async method => {
    setShowPay(false);
    if(!pending)return;
    const oid=`ORD-${rand(300,999)}`;
    const rider=pick(RIDERS);
    const total=pending.reduce((a,i)=>a+i.qty*i.price,0);
    // Check if any item needs local store
    const needsLocal=pending.some(i=>products.find(p=>p.sku===i.sku)?.qty===0);
    const localStore=needsLocal?pick(LOCAL_STORES):null;
    const o={
      id:oid,customer:profile.name||user.displayName||user.email,userId:user.uid,
      area:geo.address.split(",")[0]||"Delhi",
      items:pending,total,status:"placed",statusIdx:0,
      rider,time:ts(),eta:rand(8,14),
      paymentMethod:method,isCustomer:true,
      localStoreId:localStore?.id||null,
      localStoreName:localStore?.name||null,
      log:[{status:"placed",time:ts(),msg:SM.placed.msg}],
      createdAt:serverTimestamp(),
    };
    try { await addDoc(collection(db,"orders"),o); } catch(e){console.error(e);}
    setMyOrderIds(p=>[oid,...p]);
    setCart([]); setPending(null);
    setTrackId(oid); setPage("tracking");
    pushN(`✅ Order ${oid} placed! ETA ~${o.eta} mins`,"success");
    if(localStore) pushN(`🏪 Sourcing from ${localStore.name} (some items)`,"warning");
    // Auto-advance simulation (reliable with direct state update)
    const delays=[rand(5000,8000),rand(8000,12000),rand(10000,15000),rand(12000,18000),rand(14000,20000)];
    delays.forEach((delay,si)=>{
      setTimeout(()=>{
        const ns=STATUS_FLOW[si+1];
        if(!ns)return;
        setOrders(prev=>{
          const idx=prev.findIndex(x=>x.id===oid);
          if(idx===-1)return prev;
          const cur=prev[idx];
          if(cur.statusIdx>=si+1)return prev;
          const newLog=[...(cur.log||[]),{status:ns,time:ts(),msg:SM[ns].msg}];
          pushN(`${SM[ns].icon} ${oid}: ${SM[ns].msg}`,"info");
          // also try Firestore
          if(cur.fid) updateDoc(doc(db,"orders",cur.fid),{status:ns,statusIdx:si+1,log:newLog}).catch(console.error);
          return prev.map((x,i2)=>i2===idx?{...x,status:ns,statusIdx:si+1,log:newLog}:x);
        });
      },delay);
    });
  };

  const saveAddr = async () => {
    const updated={...profile,addresses:[...(profile.addresses||[]),newAddr]};
    setProfile(updated);
    await setDoc(doc(db,"users",user.uid),updated,{merge:true});
    setShowAddrForm(false); setNewAddr({label:"Home",address:""});
    pushN("Address saved!","success");
  };

  const filtered = useMemo(()=>products.filter(i=>i.qty>0&&(cat==="All"||i.cat===cat)&&i.name.toLowerCase().includes(search.toLowerCase())),[products,cat,search]);

  const sc = {
    card: { background:C.white,borderRadius:14,padding:20,boxShadow:"0 1px 6px rgba(0,0,0,0.07)",border:`1px solid ${C.gray2}` },
    btn:  (bg,fg=C.white,p="9px 18px")=>({cursor:"pointer",border:"none",borderRadius:9,padding:p,fontWeight:600,fontSize:13,background:bg,color:fg,transition:"all .18s",fontFamily:"inherit"}),
    pill: (bg,fg=C.white)=>({display:"inline-block",background:bg,color:fg,borderRadius:20,padding:"3px 10px",fontSize:11,fontWeight:600}),
  };

  return (
    <div style={{ minHeight:"100vh", background:C.gray1, fontFamily:"'Segoe UI',system-ui,sans-serif", color:C.dark1 }}>
      <Toast t={toast}/>
      {showPay&&<PayModal total={cartTotal} onSuccess={onPaySuccess} onClose={()=>setShowPay(false)}/>}

      {/* Header */}
      <div style={{ background:C.white, borderBottom:`1px solid ${C.gray2}`, padding:"0 16px", display:"flex", alignItems:"center", justifyContent:"space-between", height:58, position:"sticky", top:0, zIndex:50, boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ background:C.yellow, borderRadius:9, padding:"5px 13px", fontWeight:900, fontSize:17, color:C.black, letterSpacing:1.5, cursor:"pointer" }} onClick={()=>setPage("home")}>blinkit</div>
          <div style={{ width:1, height:22, background:C.gray2 }}/>
          <div style={{ display:"flex", alignItems:"center", gap:5, cursor:"pointer" }} onClick={()=>setPage("addresses")}>
            <span style={{ fontSize:14 }}>📍</span>
            <div>
              <div style={{ fontSize:9, color:C.gray3, fontWeight:700, textTransform:"uppercase", letterSpacing:".5px" }}>Deliver to</div>
              <div style={{ fontSize:12, color:C.dark1, fontWeight:700, maxWidth:160, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{geo.loading?"Detecting...":geo.address}</div>
            </div>
            <span style={{ fontSize:10, color:C.yellow, fontWeight:700 }}>▾</span>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <Bell notifs={notifs} onClear={()=>setNotifs([])}/>
          <button onClick={()=>setPage("orders")} style={{ ...sc.btn(C.gray1,C.gray4,"7px 13px"), border:`1px solid ${C.gray2}`, fontSize:12 }}>
            Orders
            {myOrders.filter(o=>o.status!=="delivered").length>0&&<span style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", background:C.blue, color:C.white, borderRadius:10, minWidth:16, height:16, fontSize:9, fontWeight:800, marginLeft:5, padding:"0 4px" }}>{myOrders.filter(o=>o.status!=="delivered").length}</span>}
          </button>
          <button onClick={()=>setPage("cart")} style={{ ...sc.btn(C.yellow,C.black,"7px 14px"), fontWeight:700, fontSize:13 }}>
            🛒{cartCount>0?` (${cartCount}) · ${fmtINR(cartTotal)}`:" Cart"}
          </button>
          <div onClick={()=>setShowProfile(p=>!p)} style={{ display:"flex", alignItems:"center", gap:6, background:C.gray1, borderRadius:10, padding:"5px 10px", border:`1px solid ${C.gray2}`, cursor:"pointer" }}>
            {user.photoURL?<img src={user.photoURL} width={22} height={22} style={{ borderRadius:"50%" }} alt=""/>:<div style={{ width:22, height:22, borderRadius:"50%", background:`linear-gradient(135deg,${C.yellow},${C.orange})`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:10, color:C.black }}>{(user.displayName||user.email||"U")[0].toUpperCase()}</div>}
          </div>
        </div>
      </div>

      {/* Profile dropdown */}
      {showProfile&&(
        <div className="scale-in" style={{ position:"fixed", top:66, right:16, background:C.white, border:`1px solid ${C.gray2}`, borderRadius:16, width:240, boxShadow:"0 12px 40px rgba(0,0,0,0.15)", zIndex:200, overflow:"hidden" }}>
          <div style={{ padding:16, borderBottom:`1px solid ${C.gray2}` }}>
            <div style={{ display:"flex", gap:10, alignItems:"center" }}>
              {user.photoURL?<img src={user.photoURL} width={42} height={42} style={{ borderRadius:"50%" }} alt=""/>:<div style={{ width:42, height:42, borderRadius:"50%", background:`linear-gradient(135deg,${C.yellow},${C.orange})`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:18, color:C.black }}>{(user.displayName||"U")[0].toUpperCase()}</div>}
              <div><div style={{ fontWeight:700, fontSize:13, color:C.dark1 }}>{profile.name||user.displayName||"Customer"}</div><div style={{ fontSize:11, color:C.gray3 }}>{user.email||user.phoneNumber||""}</div></div>
            </div>
          </div>
          {[{icon:"📦",label:"My Orders",action:()=>{setPage("orders");setShowProfile(false);}},{icon:"📍",label:"My Addresses",action:()=>{setPage("addresses");setShowProfile(false);}},{icon:"👤",label:"Edit Profile",action:()=>{setPage("profile");setShowProfile(false);}}].map(item=>(
            <div key={item.label} onClick={item.action} style={{ padding:"11px 16px", fontSize:13, color:C.dark1, display:"flex", gap:10, alignItems:"center", cursor:"pointer", borderBottom:`1px solid ${C.gray1}`, transition:"background .15s" }}
              onMouseEnter={e=>e.currentTarget.style.background=C.gray1}
              onMouseLeave={e=>e.currentTarget.style.background=C.white}>
              <span>{item.icon}</span>{item.label}
            </div>
          ))}
          <div onClick={()=>{onLogout();setShowProfile(false);}} style={{ padding:"11px 16px", fontSize:13, color:C.red, display:"flex", gap:10, alignItems:"center", cursor:"pointer" }}
            onMouseEnter={e=>e.currentTarget.style.background="#FEF2F2"}
            onMouseLeave={e=>e.currentTarget.style.background=C.white}>
            <span>🚪</span>Sign Out
          </div>
        </div>
      )}

      {/* HOME */}
      {page==="home"&&(
        <div className="fade-in">
          {/* Hero banner — gradient like Zepto/Swiggy */}
          <div style={{ background:`linear-gradient(135deg,${C.dark1} 0%,${C.dark2} 50%,#1a1a2e 100%)`, padding:"24px 20px 28px", position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", top:-40, right:-20, width:180, height:180, background:"radial-gradient(circle,rgba(248,194,0,0.15),transparent)", borderRadius:"50%", pointerEvents:"none" }}/>
            <div style={{ position:"absolute", bottom:-30, left:80, width:120, height:120, background:"radial-gradient(circle,rgba(255,107,53,0.1),transparent)", borderRadius:"50%", pointerEvents:"none" }}/>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", position:"relative" }}>
              <div>
                <div style={{ fontSize:12, color:C.yellow, fontWeight:700, letterSpacing:1, marginBottom:8 }}>⚡ QUICK COMMERCE</div>
                <div style={{ fontSize:26, fontWeight:900, color:C.white, lineHeight:1.15, marginBottom:8 }}>
                  Groceries in{" "}
                  <span style={{ background:`linear-gradient(135deg,${C.yellow},${C.orange})`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>10 minutes</span>
                </div>
                <div style={{ fontSize:12, color:C.gray3, marginBottom:16 }}>Fresh from dark store to your door 📍 {geo.loading?"Detecting...":geo.address}</div>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  {["🚀 Free delivery","⭐ 4.8 rated","🔒 100% safe","↩️ Easy returns"].map(t=>(
                    <span key={t} style={{ background:"rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.8)", borderRadius:20, padding:"4px 10px", fontSize:10, fontWeight:600, backdropFilter:"blur(4px)" }}>{t}</span>
                  ))}
                </div>
              </div>
              <div style={{ fontSize:72, flexShrink:0 }} className="bounce">🛵</div>
            </div>
          </div>

          {/* Category banners */}
          <div style={{ padding:"16px 16px 0", overflowX:"auto", display:"flex", gap:10, paddingBottom:4 }}>
            {[{icon:"🥛",label:"Dairy",color:"#EFF6FF"},{icon:"🍎",label:"Fruits",color:"#F0FDF4"},{icon:"🍟",label:"Snacks",color:"#FFF7ED"},{icon:"🥤",label:"Beverages",color:"#FDF2F8"},{icon:"🧺",label:"Household",color:"#F5F3FF"},{icon:"🍞",label:"Bakery",color:"#FEFCE8"}].map(b=>(
              <div key={b.label} onClick={()=>{setCat(b.label);}} style={{ background:b.color, borderRadius:14, padding:"12px 16px", display:"flex", flexDirection:"column", alignItems:"center", gap:4, cursor:"pointer", border:`1px solid ${C.gray2}`, minWidth:72, transition:"transform .18s", flexShrink:0 }}
                onMouseEnter={e=>e.currentTarget.style.transform="scale(1.05)"}
                onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
                <span style={{ fontSize:26 }}>{b.icon}</span>
                <span style={{ fontSize:10, fontWeight:700, color:C.dark1, whiteSpace:"nowrap" }}>{b.label}</span>
              </div>
            ))}
          </div>

          <div style={{ padding:"16px 16px 0" }}>
            {/* Search */}
            <div style={{ position:"relative", marginBottom:14 }}>
              <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", fontSize:16, color:C.gray3 }}>🔍</span>
              <input placeholder="Search groceries, brands & more..." value={search} onChange={e=>setSearch(e.target.value)} style={{ width:"100%", padding:"11px 14px 11px 38px", borderRadius:12, border:`1.5px solid ${C.gray2}`, background:C.white, fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"inherit" }}/>
            </div>

            {/* Filter pills */}
            <div style={{ display:"flex", gap:7, marginBottom:18, overflowX:"auto", paddingBottom:4 }}>
              {CATS.map(c=>(
                <button key={c} onClick={()=>setCat(c)} className={cat===c?"cat-active":""} style={{ ...sc.btn(cat===c?C.yellow:C.white,cat===c?C.black:C.gray4,"7px 14px"), border:`1px solid ${cat===c?C.yellow:C.gray2}`, fontSize:12, fontWeight:cat===c?700:500, whiteSpace:"nowrap", flexShrink:0 }}>{c}</button>
              ))}
            </div>

            {/* Section header */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
              <div style={{ fontWeight:800, fontSize:16, color:C.dark1 }}>{cat==="All"?"All Products":cat}</div>
              <div style={{ fontSize:11, color:C.gray3 }}>{filtered.length} items</div>
            </div>

            {/* Product grid */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))", gap:12, paddingBottom:24 }}>
              {loading&&[1,2,3,4,5,6].map(i=><ProdSk key={i}/>)}
              {!loading&&filtered.map(item=>{
                const inCart=cart.find(x=>x.sku===item.sku);
                const isOutOfStock=item.qty===0;
                return(
                  <div key={item.id} className="prod-card" style={{ background:C.white, borderRadius:14, overflow:"hidden", border:`1px solid ${C.gray2}`, boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
                    <div onClick={()=>{if(!isOutOfStock){setSelProd(item);setPage("product");}}} style={{ background:C.gray1, height:140, display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", position:"relative", cursor:isOutOfStock?"default":"pointer" }}>
                      {!imgOk[item.id]&&<Sk h={140} r={0}/>}
                      <img src={item.img} alt={item.name} onLoad={()=>setImgOk(p=>({...p,[item.id]:true}))} onError={e=>{e.target.style.display="none";setImgOk(p=>({...p,[item.id]:true}));}} style={{ width:"100%", height:140, objectFit:"cover", display:imgOk[item.id]?"block":"none", opacity:isOutOfStock?.5:1 }}/>
                      {item.qty<10&&item.qty>0&&<div style={{ position:"absolute", top:8, left:8, background:C.orange, color:C.white, borderRadius:6, padding:"2px 7px", fontSize:9, fontWeight:700 }}>Only {item.qty} left</div>}
                      {isOutOfStock&&<div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.4)", display:"flex", alignItems:"center", justifyContent:"center" }}><span style={{ background:C.white, color:C.red, borderRadius:8, padding:"4px 10px", fontSize:11, fontWeight:700 }}>Out of Stock</span></div>}
                    </div>
                    <div style={{ padding:"10px 12px" }}>
                      <div style={{ fontSize:12, fontWeight:700, marginBottom:2, color:C.dark1, lineHeight:1.3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{item.name}</div>
                      <div style={{ fontSize:10, color:C.gray3, marginBottom:8 }}>{item.desc}</div>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                        <span style={{ fontWeight:900, fontSize:15, color:C.dark1 }}>{fmtINR(item.price)}</span>
                        <span style={{ fontSize:9, color:C.green, fontWeight:600 }}>{item.qty} in stock</span>
                      </div>
                      {isOutOfStock?(
                        <div style={{ background:"#FFF7ED", border:"1px solid #FED7AA", borderRadius:8, padding:"5px 8px", fontSize:10, color:"#92400E", textAlign:"center" }}>
                          Available from local store
                        </div>
                      ):inCart?(
                        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:C.yellow, borderRadius:9, padding:"5px 8px" }}>
                          <button onClick={()=>changeQty(item.sku,-1)} style={{ ...sc.btn("transparent",C.black,"0 8px"), fontSize:18, fontWeight:900 }}>−</button>
                          <span style={{ fontWeight:800, fontSize:13, color:C.black }}>{inCart.qty}</span>
                          <button onClick={()=>addCart(item)} style={{ ...sc.btn("transparent",C.black,"0 8px"), fontSize:18, fontWeight:900 }}>+</button>
                        </div>
                      ):(
                        <button onClick={()=>addCart(item)} style={{ ...sc.btn(C.black,C.yellow,"8px 0"), width:"100%", fontSize:12, fontWeight:700 }} className="ripple-btn">+ Add</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* PRODUCT DETAIL */}
      {page==="product"&&selProd&&(()=>{
        const item=products.find(i=>i.id===selProd.id)||selProd;
        const inCart=cart.find(x=>x.sku===item.sku);
        return(
          <div style={{ flex:1, padding:16, maxWidth:520, margin:"0 auto", width:"100%", boxSizing:"border-box" }} className="fade-in">
            <button onClick={()=>setPage("home")} style={{ ...sc.btn(C.white,C.gray4,"7px 14px"), border:`1px solid ${C.gray2}`, marginBottom:14, fontSize:12 }}>← Back</button>
            <div style={{ ...sc.card, overflow:"hidden", padding:0 }}>
              <div style={{ height:260, overflow:"hidden", background:C.gray1 }}>
                {!imgOk[`p${item.id}`]&&<Sk h={260} r={0}/>}
                <img src={item.img} alt={item.name} onLoad={()=>setImgOk(p=>({...p,[`p${item.id}`]:true}))} style={{ width:"100%", height:260, objectFit:"cover", display:imgOk[`p${item.id}`]?"block":"none" }}/>
              </div>
              <div style={{ padding:20 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                  <div><div style={{ fontWeight:800, fontSize:20, marginBottom:3 }}>{item.name}</div><div style={{ color:C.gray3, fontSize:13, marginBottom:4 }}>{item.desc}</div><div style={{ fontSize:11, color:C.gray3 }}>{item.cat} · {item.vendor}</div></div>
                  <div style={{ textAlign:"right" }}><div style={{ fontSize:24, fontWeight:900 }}>{fmtINR(item.price)}</div><div style={{ fontSize:10, color:C.green, fontWeight:600, marginTop:2 }}>{item.qty} in stock</div></div>
                </div>
                <div style={{ margin:"14px 0", padding:"10px 14px", background:"#F0FDF4", borderRadius:10, border:"1px solid #BBF7D0", fontSize:12, color:"#166534", display:"flex", gap:8, alignItems:"center" }}>
                  ⚡ <span>Delivery in ~{rand(8,14)} minutes</span>
                </div>
                {inCart?(
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:24, background:C.yellow, borderRadius:12, padding:"13px 20px" }}>
                    <button onClick={()=>changeQty(item.sku,-1)} style={{ ...sc.btn("rgba(0,0,0,0.1)",C.black,"0 14px"), fontSize:22, fontWeight:900 }}>−</button>
                    <span style={{ fontWeight:800, fontSize:18, color:C.black }}>{inCart.qty} in cart</span>
                    <button onClick={()=>addCart(item)} style={{ ...sc.btn("rgba(0,0,0,0.1)",C.black,"0 14px"), fontSize:22, fontWeight:900 }}>+</button>
                  </div>
                ):(
                  <button onClick={()=>addCart(item)} style={{ ...sc.btn(C.black,C.yellow,"13px 0"), width:"100%", fontSize:14, fontWeight:700 }} className="ripple-btn">🛒 Add to Cart — {fmtINR(item.price)}</button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* CART */}
      {page==="cart"&&(
        <div style={{ flex:1, padding:16, maxWidth:500, margin:"0 auto", width:"100%", boxSizing:"border-box" }} className="fade-in">
          <button onClick={()=>setPage("home")} style={{ ...sc.btn(C.white,C.gray4,"7px 14px"), border:`1px solid ${C.gray2}`, marginBottom:14, fontSize:12 }}>← Continue Shopping</button>
          <h2 style={{ fontWeight:800, fontSize:20, marginBottom:14 }}>Your Cart 🛒</h2>
          {cart.length===0&&(
            <div style={{ textAlign:"center", padding:60, color:C.gray3 }}>
              <div style={{ fontSize:52, marginBottom:10 }} className="bounce">🛒</div>
              <div style={{ fontWeight:600, fontSize:15, color:C.gray4 }}>Your cart is empty</div>
              <div style={{ color:C.gray3, fontSize:12, marginTop:4, marginBottom:16 }}>Add items from the store to get started</div>
              <button onClick={()=>setPage("home")} style={{ ...sc.btn(C.black,C.yellow,"12px 28px"), fontWeight:700 }}>Shop Now</button>
            </div>
          )}
          {cart.map(item=>(
            <div key={item.sku} style={{ ...sc.card, display:"flex", gap:12, alignItems:"center", marginBottom:8, padding:12 }} className="fade-up">
              <img src={item.img} alt="" width={58} height={58} style={{ borderRadius:10, objectFit:"cover", flexShrink:0 }}/>
              <div style={{ flex:1 }}><div style={{ fontWeight:700, fontSize:13 }}>{item.name}</div><div style={{ color:C.gray3, fontSize:11, marginTop:1 }}>{fmtINR(item.price)} each</div></div>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ display:"flex", alignItems:"center", gap:6, background:C.gray1, borderRadius:9, padding:"5px 10px" }}>
                  <button onClick={()=>changeQty(item.sku,-1)} style={{ ...sc.btn("transparent",C.gray4,"0 4px"), fontSize:16, fontWeight:800 }}>−</button>
                  <span style={{ fontWeight:700, minWidth:18, textAlign:"center" }}>{item.qty}</span>
                  <button onClick={()=>addCart(item)} style={{ ...sc.btn("transparent",C.gray4,"0 4px"), fontSize:16, fontWeight:800 }}>+</button>
                </div>
                <span style={{ fontWeight:800, fontSize:14, minWidth:48, textAlign:"right" }}>{fmtINR(item.qty*item.price)}</span>
                <button onClick={()=>removeCart(item.sku)} style={{ ...sc.btn(C.white,C.red,"3px 8px"), border:`1px solid #FECACA`, fontSize:14 }}>✕</button>
              </div>
            </div>
          ))}
          {cart.length>0&&(
            <div style={{ ...sc.card, marginTop:10 }}>
              <div style={{ fontWeight:800, fontSize:15, marginBottom:14 }}>Order Summary</div>
              {[{l:"Subtotal",v:fmtINR(cartTotal)},{l:"Delivery fee",v:"FREE 🎉"},{l:"Taxes & charges",v:fmtINR(Math.round(cartTotal*.02))}].map(r=>(
                <div key={r.l} style={{ display:"flex", justifyContent:"space-between", marginBottom:7, fontSize:13 }}><span style={{ color:C.gray3 }}>{r.l}</span><span style={{ color:r.v==="FREE 🎉"?C.green:C.dark1, fontWeight:r.v==="FREE 🎉"?700:400 }}>{r.v}</span></div>
              ))}
              <div style={{ display:"flex", justifyContent:"space-between", fontWeight:900, fontSize:18, padding:"12px 0", borderTop:`2px solid ${C.gray2}`, marginTop:6 }}>
                <span>Total</span><span>{fmtINR(cartTotal+Math.round(cartTotal*.02))}</span>
              </div>
              <div style={{ background:"#F0FDF4", borderRadius:10, padding:10, marginBottom:14, fontSize:12, color:"#166534", border:"1px solid #BBF7D0" }}>
                ⚡ Delivery in ~{rand(8,14)} minutes · 📍 {geo.address}
              </div>
              <button onClick={initiateCheckout} style={{ ...sc.btn(C.black,C.yellow,"14px 0"), width:"100%", fontSize:14, fontWeight:700, borderRadius:12 }} className="ripple-btn">
                ⚡ Proceed to Payment — {fmtINR(cartTotal)}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ORDERS */}
      {page==="orders"&&(
        <div style={{ flex:1, padding:16, maxWidth:520, margin:"0 auto", width:"100%", boxSizing:"border-box" }} className="fade-in">
          <button onClick={()=>setPage("home")} style={{ ...sc.btn(C.white,C.gray4,"7px 14px"), border:`1px solid ${C.gray2}`, marginBottom:14, fontSize:12 }}>← Back</button>
          <h2 style={{ fontWeight:800, fontSize:20, marginBottom:14 }}>My Orders 📦</h2>
          {myOrders.length===0&&(
            <div style={{ textAlign:"center", padding:60, color:C.gray3 }}>
              <div style={{ fontSize:52, marginBottom:10 }} className="bounce">📦</div>
              <div style={{ fontWeight:600, color:C.gray4 }}>No orders yet</div>
              <button onClick={()=>setPage("home")} style={{ ...sc.btn(C.black,C.yellow,"12px 28px"), marginTop:14, fontWeight:700 }}>Shop Now</button>
            </div>
          )}
          {myOrders.map(o=>(
            <div key={o.fid||o.id} onClick={()=>{setTrackId(o.id);setPage("tracking");}} style={{ ...sc.card, marginBottom:10, borderLeft:`4px solid ${SM[o.status]?.color||C.gray2}`, cursor:"pointer", transition:"box-shadow .18s" }} className="fade-up"
              onMouseEnter={e=>e.currentTarget.style.boxShadow="0 4px 18px rgba(0,0,0,0.1)"}
              onMouseLeave={e=>e.currentTarget.style.boxShadow=sc.card.boxShadow}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
                <div><div style={{ fontWeight:700, fontSize:14 }}>{o.id}</div><div style={{ color:C.gray3, fontSize:11, marginTop:2 }}>🕐 {o.time} · {o.paymentMethod}</div></div>
                <div style={{ textAlign:"right" }}>
                  <span style={{ ...sc.pill(SM[o.status]?.color||C.gray3), fontSize:11, padding:"4px 10px" }}>{SM[o.status]?.label}</span>
                  <div style={{ fontWeight:800, fontSize:15, marginTop:5 }}>{fmtINR(o.total)}</div>
                </div>
              </div>
              <Tracker order={o}/>
              {o.localStoreId&&<div style={{ marginTop:8, fontSize:10, color:C.orange, fontWeight:600 }}>🏪 Sourced from {o.localStoreName}</div>}
              <div style={{ marginTop:8, fontSize:11, color:C.blue, fontWeight:600 }}>Tap to track live →</div>
            </div>
          ))}
        </div>
      )}

      {/* TRACKING */}
      {page==="tracking"&&(()=>{
        const o=myOrders.find(x=>x.id===trackId)||myOrders[0];
        if(!o)return(<div style={{ flex:1, padding:40, textAlign:"center", color:C.gray3 }}>Order not found.<button onClick={()=>setPage("home")} style={{ ...sc.btn(C.black,C.yellow,"9px 20px"), marginLeft:10, fontWeight:700 }}>Home</button></div>);
        const destPos=geo.lat?[geo.lat,geo.lng]:DARK_STORE.pos;
        return(
          <div style={{ flex:1, padding:16, maxWidth:540, margin:"0 auto", width:"100%", boxSizing:"border-box" }} className="fade-in">
            <button onClick={()=>setPage("orders")} style={{ ...sc.btn(C.white,C.gray4,"7px 14px"), border:`1px solid ${C.gray2}`, marginBottom:14, fontSize:12 }}>← My Orders</button>

            {/* Status card */}
            <div style={{ background:`linear-gradient(135deg,${SM[o.status]?.color||C.gray3},${SM[o.status]?.color||C.gray3}CC)`, borderRadius:16, padding:24, marginBottom:14, textAlign:"center", color:C.white }}>
              <div style={{ fontSize:48, marginBottom:8 }} className={o.status==="out_for_delivery"?"bounce":""}>{SM[o.status]?.icon}</div>
              <div style={{ fontSize:20, fontWeight:800, marginBottom:4 }}>{SM[o.status]?.label}</div>
              <div style={{ fontSize:13, opacity:.85, marginBottom:o.status!=="delivered"?12:0 }}>{SM[o.status]?.msg}</div>
              {o.status!=="delivered"&&(
                <div style={{ display:"flex", justifyContent:"center", alignItems:"center", gap:12 }}>
                  <Countdown eta={o.eta} status={o.status}/>
                </div>
              )}
            </div>

            {/* Rider info */}
            {o.rider&&o.status!=="placed"&&(
              <div style={{ ...sc.card, display:"flex", gap:12, alignItems:"center", marginBottom:14 }} className="fade-up">
                <div style={{ width:46, height:46, borderRadius:"50%", background:`linear-gradient(135deg,${C.yellow},${C.orange})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>🛵</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:14 }}>{o.rider.name}</div>
                  <div style={{ fontSize:11, color:C.gray3, marginTop:1 }}>Your delivery partner · ⭐ {o.rider.rating}</div>
                </div>
                <a href={`tel:${o.rider.phone}`} style={{ ...sc.btn(C.green,C.white,"8px 14px"), fontSize:12, textDecoration:"none" }}>📞 Call</a>
              </div>
            )}

            {/* Live map */}
            {(o.status==="out_for_delivery"||o.status==="delivered")&&(
              <div style={{ marginBottom:14 }} className="fade-up">
                <div style={{ fontWeight:700, fontSize:13, marginBottom:8, color:C.dark1 }}>🗺️ Live Tracking</div>
                <LiveMap order={o} destPos={destPos}/>
              </div>
            )}

            {/* Progress tracker */}
            <div style={{ ...sc.card, marginBottom:14 }}>
              <div style={{ fontWeight:700, fontSize:14, marginBottom:16 }}>Order Journey</div>
              <PickerJourney order={o}/>
            </div>

            {/* Items */}
            <div style={{ ...sc.card, marginBottom:14 }}>
              <div style={{ fontWeight:700, fontSize:14, marginBottom:12 }}>Your Items</div>
              {(o.items||[]).map(i=>(
                <div key={i.sku} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:`1px solid ${C.gray1}`, fontSize:13 }}>
                  <span style={{ color:C.gray4 }}>{i.emoji} {i.name} ×{i.qty}</span>
                  <span style={{ fontWeight:700 }}>{fmtINR(i.qty*i.price)}</span>
                </div>
              ))}
              <div style={{ display:"flex", justifyContent:"space-between", fontWeight:800, fontSize:16, paddingTop:10 }}>
                <span>Total</span><span>{fmtINR(o.total)}</span>
              </div>
              {o.paymentMethod&&<div style={{ marginTop:4, fontSize:11, color:C.gray3 }}>Paid via {o.paymentMethod}</div>}
              {o.localStoreId&&<div style={{ marginTop:6, fontSize:11, color:C.orange, fontWeight:600 }}>🏪 Sourced from: {o.localStoreName}</div>}
            </div>

            {o.status==="delivered"&&(
              <div style={{ background:"#F0FDF4", borderRadius:14, padding:24, textAlign:"center", border:"2px solid #86EFAC" }} className="scale-in">
                <div style={{ fontSize:48, marginBottom:8 }} className="bounce">🎉</div>
                <div style={{ fontWeight:800, color:"#166534", fontSize:18, marginBottom:4 }}>Order Delivered!</div>
                <div style={{ color:"#166534", fontSize:13, marginBottom:16 }}>We hope you enjoyed your groceries</div>
                <button onClick={()=>setPage("home")} style={{ ...sc.btn(C.black,C.yellow,"11px 28px"), fontWeight:700 }} className="ripple-btn">Order Again 🛒</button>
              </div>
            )}
          </div>
        );
      })()}

      {/* ADDRESSES */}
      {page==="addresses"&&(
        <div style={{ flex:1, padding:16, maxWidth:500, margin:"0 auto", width:"100%", boxSizing:"border-box" }} className="fade-in">
          <button onClick={()=>setPage("home")} style={{ ...sc.btn(C.white,C.gray4,"7px 14px"), border:`1px solid ${C.gray2}`, marginBottom:14, fontSize:12 }}>← Back</button>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <h2 style={{ fontWeight:800, fontSize:20 }}>My Addresses 📍</h2>
            <button onClick={()=>setShowAddrForm(true)} style={sc.btn(C.yellow,C.black,"8px 16px")}>+ Add</button>
          </div>
          {/* Current GPS */}
          <div style={{ ...sc.card, borderLeft:`4px solid ${C.green}`, marginBottom:10 }}>
            <div style={{ display:"flex", gap:10, alignItems:"center" }}>
              <span style={{ fontSize:24 }}>📍</span>
              <div><div style={{ fontWeight:700, fontSize:13 }}>Current Location (GPS)</div><div style={{ fontSize:12, color:C.gray3, marginTop:2 }}>{geo.address}</div></div>
              <span style={{ ...sc.pill(C.green), marginLeft:"auto", fontSize:10 }}>Live</span>
            </div>
          </div>
          {(profile.addresses||[]).map((a,i)=>(
            <div key={i} style={{ ...sc.card, marginBottom:10 }}>
              <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                <span style={{ fontSize:22 }}>{a.label==="Home"?"🏠":a.label==="Work"?"🏢":"📍"}</span>
                <div style={{ flex:1 }}><div style={{ fontWeight:700, fontSize:13 }}>{a.label}</div><div style={{ fontSize:12, color:C.gray3, marginTop:2 }}>{a.address}</div></div>
              </div>
            </div>
          ))}
          {showAddrForm&&(
            <div style={{ ...sc.card, border:`1.5px solid ${C.yellow}` }}>
              <div style={{ fontWeight:700, marginBottom:12 }}>New Address</div>
              <div style={{ display:"flex", gap:8, marginBottom:10 }}>
                {["Home","Work","Other"].map(l=>(
                  <button key={l} onClick={()=>setNewAddr(p=>({...p,label:l}))} style={{ ...sc.btn(newAddr.label===l?C.yellow:C.gray1,newAddr.label===l?C.black:C.gray4,"7px 14px"), border:`1px solid ${newAddr.label===l?C.yellow:C.gray2}`, fontSize:11, fontWeight:600 }}>{l}</button>
                ))}
              </div>
              <input value={newAddr.address} onChange={e=>setNewAddr(p=>({...p,address:e.target.value}))} placeholder="Full address..." style={{ width:"100%", padding:"10px 12px", borderRadius:9, border:`1px solid ${C.gray2}`, fontSize:13, outline:"none", boxSizing:"border-box", marginBottom:10, fontFamily:"inherit" }}/>
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={saveAddr} style={{ ...sc.btn(C.black,C.yellow,"10px 0"), flex:1, fontWeight:700 }}>Save Address</button>
                <button onClick={()=>setShowAddrForm(false)} style={{ ...sc.btn(C.gray1,C.gray4,"10px 0"), border:`1px solid ${C.gray2}`, flex:1 }}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PROFILE */}
      {page==="profile"&&(
        <div style={{ flex:1, padding:16, maxWidth:500, margin:"0 auto", width:"100%", boxSizing:"border-box" }} className="fade-in">
          <button onClick={()=>setPage("home")} style={{ ...sc.btn(C.white,C.gray4,"7px 14px"), border:`1px solid ${C.gray2}`, marginBottom:14, fontSize:12 }}>← Back</button>
          <h2 style={{ fontWeight:800, fontSize:20, marginBottom:16 }}>My Profile 👤</h2>
          <div style={{ ...sc.card, marginBottom:14 }}>
            <div style={{ display:"flex", gap:14, alignItems:"center", marginBottom:20 }}>
              {user.photoURL?<img src={user.photoURL} width={60} height={60} style={{ borderRadius:"50%" }} alt=""/>:<div style={{ width:60, height:60, borderRadius:"50%", background:`linear-gradient(135deg,${C.yellow},${C.orange})`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:24, color:C.black }}>{(profile.name||"U")[0].toUpperCase()}</div>}
              <div><div style={{ fontWeight:800, fontSize:16 }}>{profile.name||"Customer"}</div><div style={{ fontSize:12, color:C.gray3, marginTop:2 }}>{user.email||""}</div><div style={{ fontSize:11, color:C.gray3 }}>{user.phoneNumber||profile.phone||""}</div></div>
            </div>
            {[{l:"Full Name",k:"name",t:"text",ph:"Your name"},{l:"Phone",k:"phone",t:"tel",ph:"+91 9876543210"}].map(f=>(
              <div key={f.k} style={{ marginBottom:12 }}>
                <label style={{ fontSize:11, color:C.gray3, display:"block", marginBottom:4, fontWeight:700, textTransform:"uppercase", letterSpacing:".4px" }}>{f.l}</label>
                <input type={f.t} value={profile[f.k]||""} onChange={e=>setProfile(p=>({...p,[f.k]:e.target.value}))} placeholder={f.ph} style={{ width:"100%", padding:"10px 12px", borderRadius:9, border:`1px solid ${C.gray2}`, fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"inherit" }}/>
              </div>
            ))}
            <button onClick={async()=>{await setDoc(doc(db,"users",user.uid),{...profile,updatedAt:serverTimestamp()},{merge:true});pushN("Profile updated!","success");}} style={{ ...sc.btn(C.black,C.yellow,"11px 0"), width:"100%", fontWeight:700, marginTop:6 }}>Save Profile</button>
          </div>
          {/* Stats */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            {[{l:"Total Orders",v:myOrders.length},{l:"Total Spent",v:fmtINR(myOrders.reduce((a,o)=>a+(o.total||0),0))}].map(s=>(
              <div key={s.l} style={{ ...sc.card, textAlign:"center" }}>
                <div style={{ fontSize:22, fontWeight:900, color:C.dark1, marginBottom:4 }}>{s.v}</div>
                <div style={{ fontSize:12, color:C.gray3 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   ROOT
═══════════════════════════════════════════════════════════════════════ */
export default function App() {
  const [authUser, setAuthUser]   = useState(null);
  const [userRole, setUserRole]   = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(()=>{
    const unsub=onAuthStateChanged(auth,async u=>{
      if(u){
        try{
          const snap=await getDoc(doc(db,"users",u.uid));
          setAuthUser(u);
          setUserRole(snap.exists()?snap.data().role:"customer");
        }catch{ setAuthUser(u); setUserRole("customer"); }
      }else{ setAuthUser(null); setUserRole(null); }
      setAuthLoading(false);
    });
    return unsub;
  },[]);

  const handleLogin  = (u,r) => { setAuthUser(u); setUserRole(r); };
  const handleLogout = async () => { await signOut(auth); setAuthUser(null); setUserRole(null); };

  if(authLoading){
    return(
      <div style={{ minHeight:"100vh", background:C.dark1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", fontFamily:"'Segoe UI',system-ui,sans-serif" }}>
        <div style={{ background:C.yellow, borderRadius:14, padding:"10px 28px", fontWeight:900, fontSize:30, color:C.black, letterSpacing:2, marginBottom:16 }} className="pulse-anim">blinkit</div>
        <div style={{ color:C.gray3, fontSize:13 }} className="pulse-anim">Loading your experience...</div>
      </div>
    );
  }

  if(!authUser) return <LoginPage onLogin={handleLogin}/>;

  return userRole==="admin"
    ? <AdminPanel  user={authUser} onLogout={handleLogout}/>
    : <CustomerPanel user={authUser} onLogout={handleLogout}/>;
}