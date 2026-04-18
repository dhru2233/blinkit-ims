import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { auth, db, googleProvider } from "./firebase";
import {
  signInWithPopup, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signOut, onAuthStateChanged,
  updateProfile
} from "firebase/auth";
import {
  collection, addDoc, onSnapshot, doc, updateDoc,
  query, orderBy, serverTimestamp, setDoc, getDoc
} from "firebase/firestore";

/* ─── Leaflet (map) ─────────────────────────────────────────────────────── */
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/* ─── Brand tokens ─────────────────────────────────────────────────────── */
const Y="#F8C200", BK="#1C1C1C", GN="#0EA472", RD="#E53935",
      BL="#1A73E8", G1="#F5F5F5", G2="#E8E8E8", G3="#9E9E9E",
      G4="#424242", WH="#FFFFFF";

/* ─── Product data ──────────────────────────────────────────────────────── */
const PRODUCTS = [
  {id:1,sku:"AMU-001",name:"Amul Milk 500ml",      cat:"Dairy",        emoji:"🥛",img:"https://images.unsplash.com/photo-1563636619-e9143da7973b?w=200&q=80",price:28, cost:22, qty:120,msL:30,expiry:"2026-08-20",vendor:"Amul",       desc:"Fresh full-cream milk"},
  {id:2,sku:"LAY-002",name:"Lay's Classic Salted", cat:"Snacks",       emoji:"🍟",img:"https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=200&q=80",price:20, cost:14, qty:45, msL:20,expiry:"2026-08-10",vendor:"PepsiCo",    desc:"Crispy potato chips"},
  {id:3,sku:"BAN-003",name:"Bananas (Dozen)",       cat:"Fruits",       emoji:"🍌",img:"https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=200&q=80",price:45, cost:30, qty:60, msL:15,expiry:"2026-03-15",vendor:"FreshFarm",  desc:"Fresh ripe bananas"},
  {id:4,sku:"COC-004",name:"Coca-Cola 750ml",       cat:"Beverages",    emoji:"🥤",img:"https://images.unsplash.com/photo-1554866585-cd94860890b7?w=200&q=80",price:45, cost:32, qty:30, msL:25,expiry:"2026-12-01",vendor:"Coca-Cola",   desc:"Ice-cold refreshing cola"},
  {id:5,sku:"SUR-005",name:"Surf Excel 1kg",        cat:"Household",    emoji:"🧺",img:"https://images.unsplash.com/photo-1585421514738-01798e348b17?w=200&q=80",price:220,cost:170,qty:35, msL:10,expiry:"2027-06-01",vendor:"HUL",        desc:"Premium detergent powder"},
  {id:6,sku:"BRI-006",name:"Britannia Bread",       cat:"Bakery",       emoji:"🍞",img:"https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&q=80",price:42, cost:30, qty:18, msL:12,expiry:"2026-06-14",vendor:"Britannia",  desc:"Soft sandwich bread"},
  {id:7,sku:"MAG-007",name:"Maggi 2-Min Noodles",   cat:"Snacks",       emoji:"🍜",img:"https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=200&q=80",price:14, cost:9,  qty:200,msL:50,expiry:"2026-11-01",vendor:"Nestle",     desc:"Quick 2-minute noodles"},
  {id:8,sku:"DOV-008",name:"Dove Soap 75g",         cat:"Personal Care",emoji:"🧼",img:"https://images.unsplash.com/photo-1607006344380-b6775a0824a7?w=200&q=80",price:55, cost:40, qty:18, msL:20,expiry:"2028-01-01",vendor:"HUL",        desc:"Moisturising beauty bar"},
  {id:9,sku:"EGG-009",name:"Eggs (12 pcs)",         cat:"Dairy",        emoji:"🥚",img:"https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=200&q=80",price:84, cost:65, qty:40, msL:20,expiry:"2026-06-18",vendor:"Country Eggs",desc:"Farm-fresh white eggs"},
  {id:10,sku:"ONI-010",name:"Onions 1kg",           cat:"Fruits",       emoji:"🧅",img:"https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=200&q=80",price:30, cost:20, qty:55, msL:15,expiry:"2026-06-22",vendor:"FreshFarm",  desc:"Fresh red onions"},
  {id:11,sku:"TOM-011",name:"Tomatoes 500g",        cat:"Fruits",       emoji:"🍅",img:"https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=200&q=80",price:25, cost:15, qty:12, msL:15,expiry:"2026-03-13",vendor:"FreshFarm",  desc:"Vine-ripened tomatoes"},
  {id:12,sku:"YOG-012",name:"Amul Curd 400g",       cat:"Dairy",        emoji:"🍶",img:"https://images.unsplash.com/photo-1488477181946-6428a0291777?w=200&q=80",price:40, cost:30, qty:22, msL:20,expiry:"2026-06-16",vendor:"Amul",       desc:"Thick & creamy curd"},
  {id:13,sku:"RIC-013",name:"Basmati Rice 1kg",     cat:"Household",    emoji:"🍚",img:"https://images.unsplash.com/photo-1536304993881-ff86d42a1430?w=200&q=80",price:99, cost:72, qty:80, msL:15,expiry:"2027-01-01",vendor:"India Gate", desc:"Long-grain premium rice"},
  {id:14,sku:"CHA-014",name:"Haldiram's Bhujia",    cat:"Snacks",       emoji:"🫘",img:"https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=200&q=80",price:60, cost:42, qty:50, msL:20,expiry:"2026-09-01",vendor:"Haldiram's", desc:"Crunchy sev bhujia"},
  {id:15,sku:"COF-015",name:"Nescafé Classic 50g",  cat:"Beverages",    emoji:"☕",img:"https://images.unsplash.com/photo-1610889556528-9a770e32642f?w=200&q=80",price:135,cost:95, qty:25, msL:10,expiry:"2027-06-01",vendor:"Nestle",     desc:"Rich instant coffee"},
];

const CATS=["All","Dairy","Snacks","Fruits","Beverages","Household","Bakery","Personal Care"];
const STATUS_FLOW=["placed","confirmed","picking","packed","out_for_delivery","delivered"];
const SM={
  placed:           {label:"Order Placed",  color:"#7C3AED",icon:"📱",msg:"Your order has been placed!"},
  confirmed:        {label:"Confirmed",     color:"#D97706",icon:"✅",msg:"Store confirmed your order"},
  picking:          {label:"Picking Items", color:"#0284C7",icon:"🧺",msg:"Picker collecting your items"},
  packed:           {label:"Packed",        color:"#7C3AED",icon:"📦",msg:"Order packed & ready"},
  out_for_delivery: {label:"On the Way",    color:"#EA580C",icon:"🛵",msg:"Delivery partner on the way!"},
  delivered:        {label:"Delivered",     color:"#16A34A",icon:"🎉",msg:"Order delivered. Enjoy!"},
};

/* Dark store coords (Delhi) */
const STORE_POS = [28.5355, 77.3910];
const rand=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const ts=()=>new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",second:"2-digit"});

/* ─── Helpers ───────────────────────────────────────────────────────────── */
const mkIcon = (cls) => L.divIcon({ className:"", html:`<div class="${cls}">🛵</div>`, iconSize:[36,36], iconAnchor:[18,18] });
const storeIcon = L.divIcon({ className:"", html:`<div class="store-marker">🏪</div>`, iconSize:[36,36], iconAnchor:[18,18] });
const homeIcon  = L.divIcon({ className:"", html:`<div class="home-marker">🏠</div>`, iconSize:[36,36], iconAnchor:[18,18] });
const riderIcon = L.divIcon({ className:"", html:`<div class="rider-marker">🛵</div>`, iconSize:[36,36], iconAnchor:[18,18] });

/* ─── Geolocation ───────────────────────────────────────────────────────── */
function useGeo() {
  const [geo, setGeo] = useState({ address:"Detecting location...", lat:null, lng:null, loading:true });
  useEffect(() => {
    if (!navigator.geolocation) { setGeo(p=>({...p,address:"Location unavailable",loading:false})); return; }
    const ok = async (pos) => {
      const {latitude:lat,longitude:lng} = pos.coords;
      try {
        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
        const d = await r.json();
        const a = d.address||{};
        const parts=[a.road||a.neighbourhood,a.suburb||a.city_district,a.city||a.town].filter(Boolean);
        setGeo({address:parts.join(", ")||"Your location",lat,lng,loading:false});
      } catch { setGeo({address:`${lat.toFixed(4)},${lng.toFixed(4)}`,lat,lng,loading:false}); }
    };
    const err = () => setGeo({address:"Enable location for delivery",lat:28.6139,lng:77.2090,loading:false});
    navigator.geolocation.getCurrentPosition(ok,err,{timeout:10000});
    const w = navigator.geolocation.watchPosition(ok,err,{timeout:15000,maximumAge:60000});
    return ()=>navigator.geolocation.clearWatch(w);
  },[]);
  return geo;
}

/* ─── Push notifications ────────────────────────────────────────────────── */
async function requestNotifPermission() {
  if (!("Notification" in window)) return false;
  const p = await Notification.requestPermission();
  return p === "granted";
}
function sendBrowserNotif(title, body, icon="🛵") {
  if (Notification.permission === "granted") {
    new Notification(title, { body, icon:"https://em-content.zobj.net/source/google/387/delivery-truck_1f69a.png" });
  }
}

/* ─── Skeleton loader ───────────────────────────────────────────────────── */
const Skeleton = ({w="100%",h=16,r=8,mb=0})=>(
  <div className="skeleton" style={{width:w,height:h,borderRadius:r,marginBottom:mb}}/>
);
const ProductSkeleton = () => (
  <div style={{background:WH,borderRadius:12,overflow:"hidden",border:`1px solid ${G2}`}}>
    <Skeleton h={140} r={0}/>
    <div style={{padding:12}}>
      <Skeleton h={13} mb={8}/>
      <Skeleton w="60%" h={11} mb={12}/>
      <Skeleton h={32} r={8}/>
    </div>
  </div>
);

/* ─── Toast ─────────────────────────────────────────────────────────────── */
const Toast = ({t,side="right"})=>{
  if(!t)return null;
  const bg=t.type==="danger"?RD:t.type==="success"?GN:t.type==="order"?BL:G4;
  return(
    <div className="fade-in" style={{position:"fixed",top:72,[side]:16,zIndex:9999,background:bg,color:WH,padding:"12px 18px",borderRadius:12,fontWeight:600,fontSize:13,maxWidth:300,boxShadow:"0 4px 20px rgba(0,0,0,0.2)",display:"flex",gap:10,alignItems:"center"}}>
      <span>{t.msg}</span>
    </div>
  );
};

/* ─── In-app notification bell ──────────────────────────────────────────── */
const NotifBell = ({notifs,onClear})=>{
  const [open,setOpen]=useState(false);
  const unread=notifs.filter(n=>!n.read).length;
  return(
    <div style={{position:"relative"}}>
      <button onClick={()=>setOpen(p=>!p)} style={{background:"transparent",border:`1px solid ${G2}`,borderRadius:8,padding:"6px 10px",cursor:"pointer",position:"relative",fontSize:18}}>
        🔔
        {unread>0&&<span style={{position:"absolute",top:-4,right:-4,background:RD,color:WH,borderRadius:10,minWidth:16,height:16,fontSize:10,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 4px"}}>{unread}</span>}
      </button>
      {open&&(
        <div className="fade-in" style={{position:"absolute",top:44,right:0,background:WH,border:`1px solid ${G2}`,borderRadius:14,width:300,maxHeight:360,overflowY:"auto",boxShadow:"0 8px 32px rgba(0,0,0,0.15)",zIndex:200}}>
          <div style={{padding:"12px 16px",borderBottom:`1px solid ${G2}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontWeight:700,fontSize:14}}>Notifications</span>
            <button onClick={onClear} style={{background:"transparent",border:"none",color:G3,fontSize:11,cursor:"pointer"}}>Clear all</button>
          </div>
          {notifs.length===0&&<div style={{padding:24,textAlign:"center",color:G3,fontSize:13}}>No notifications</div>}
          {notifs.map(n=>(
            <div key={n.id} style={{padding:"10px 16px",borderBottom:`1px solid ${G1}`,background:n.read?WH:"#FFFBEB"}}>
              <div style={{fontSize:12,color:G4,marginBottom:2}}>{n.msg}</div>
              <div style={{fontSize:10,color:G3}}>{n.time}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ─── Order tracker bar ─────────────────────────────────────────────────── */
const OrderTracker=({order})=>(
  <div>
    <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
      {STATUS_FLOW.map((s,i)=>{
        const done=i<=order.statusIdx,curr=i===order.statusIdx;
        return(
          <div key={s} style={{display:"flex",flexDirection:"column",alignItems:"center",flex:1}}>
            <div style={{width:26,height:26,borderRadius:"50%",background:done?SM[s].color:G2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,border:curr?`2px solid ${SM[s].color}`:"2px solid transparent",color:done?WH:G3,fontWeight:700,transition:"all 0.3s"}}>
              {curr?SM[s].icon:done?"✓":"·"}
            </div>
            <div style={{fontSize:8,color:done?G4:G3,marginTop:3,textAlign:"center",maxWidth:42,lineHeight:1.2,fontWeight:done?600:400}}>{SM[s].label}</div>
          </div>
        );
      })}
    </div>
    <div style={{height:4,background:G2,borderRadius:10,overflow:"hidden"}}>
      <div style={{height:"100%",background:`linear-gradient(90deg,${Y},#F59E0B)`,width:`${(order.statusIdx/(STATUS_FLOW.length-1))*100}%`,transition:"width 0.8s ease",borderRadius:10}}/>
    </div>
  </div>
);

/* ─── Map with animated rider ───────────────────────────────────────────── */
function RiderMap({storePOS,destPOS,statusIdx}){
  const steps=20;
  const [riderPos,setRiderPos]=useState(storePOS);
  const stepRef=useRef(0);

  useEffect(()=>{
    if(statusIdx<4){setRiderPos(storePOS);stepRef.current=0;return;}
    if(statusIdx===5){setRiderPos(destPOS);return;}
    const iv=setInterval(()=>{
      stepRef.current=Math.min(stepRef.current+1,steps);
      const t=stepRef.current/steps;
      setRiderPos([
        storePOS[0]+(destPOS[0]-storePOS[0])*t,
        storePOS[1]+(destPOS[1]-storePOS[1])*t,
      ]);
      if(stepRef.current>=steps)clearInterval(iv);
    },800);
    return()=>clearInterval(iv);
  },[statusIdx,storePOS,destPOS]);

  function FlyTo({pos}){const map=useMap();useEffect(()=>{map.flyTo(pos,14,{duration:1.2});},[pos]);return null;}

  return(
    <MapContainer center={storePOS} zoom={13} style={{height:260,width:"100%",borderRadius:12,zIndex:1}} zoomControl={false}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
      <Marker position={storePOS} icon={storeIcon}/>
      <Marker position={destPOS}  icon={homeIcon}/>
      <Marker position={riderPos} icon={riderIcon}/>
      <Polyline positions={[storePOS,destPOS]} pathOptions={{color:Y,weight:3,dashArray:"6 6"}}/>
      <FlyTo pos={riderPos}/>
    </MapContainer>
  );
}

/* ─── Mock UPI payment ──────────────────────────────────────────────────── */
function PaymentModal({total,onSuccess,onClose}){
  const [step,setStep]=useState("choose"); // choose | upi | card | processing | done
  const [upiId,setUpiId]=useState("");
  const [card,setCard]=useState({num:"",exp:"",cvv:"",name:""});

  const process=(method)=>{
    setStep("processing");
    setTimeout(()=>{setStep("done");setTimeout(()=>{onSuccess(method);},1500);},2200);
  };

  const s={
    overlay:{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:500,padding:16},
    box:{background:WH,borderRadius:20,width:"100%",maxWidth:380,overflow:"hidden",boxShadow:"0 24px 60px rgba(0,0,0,0.25)",animation:"fadeIn 0.3s ease"},
    inp:{width:"100%",padding:"10px 12px",borderRadius:8,border:`1px solid ${G2}`,fontSize:13,outline:"none",boxSizing:"border-box",marginBottom:10},
    btn:(bg,fg=WH,p="12px 0")=>({cursor:"pointer",border:"none",borderRadius:10,padding:p,fontWeight:700,fontSize:14,background:bg,color:fg,width:"100%",transition:"all 0.18s"}),
  };

  return(
    <div style={s.overlay} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={s.box} className="fade-in">
        {/* Header */}
        <div style={{background:BK,padding:"16px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{color:G3,fontSize:11,fontWeight:600}}>SECURE PAYMENT</div>
            <div style={{color:WH,fontWeight:800,fontSize:18}}>₹{total}</div>
          </div>
          <div style={{background:Y,borderRadius:8,padding:"4px 12px",fontWeight:900,fontSize:15,color:BK}}>blinkit</div>
        </div>

        {step==="choose"&&(
          <div style={{padding:20}}>
            <div style={{fontWeight:700,fontSize:14,marginBottom:14,color:G4}}>Choose payment method</div>
            {[
              {id:"upi",label:"UPI / GPay / PhonePe",icon:"📱",sub:"Instant payment"},
              {id:"card",label:"Credit / Debit Card",icon:"💳",sub:"Visa, Mastercard, Rupay"},
              {id:"cod",label:"Cash on Delivery",icon:"💵",sub:"Pay when delivered"},
            ].map(m=>(
              <div key={m.id} onClick={()=>m.id==="cod"?process("COD"):setStep(m.id)} style={{display:"flex",gap:12,alignItems:"center",padding:"12px 14px",borderRadius:10,border:`1px solid ${G2}`,marginBottom:8,cursor:"pointer",transition:"all 0.18s",background:WH}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=Y;e.currentTarget.style.background=G1;}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=G2;e.currentTarget.style.background=WH;}}>
                <span style={{fontSize:24}}>{m.icon}</span>
                <div><div style={{fontWeight:600,fontSize:13}}>{m.label}</div><div style={{fontSize:11,color:G3}}>{m.sub}</div></div>
              </div>
            ))}
          </div>
        )}

        {step==="upi"&&(
          <div style={{padding:20}}>
            <button onClick={()=>setStep("choose")} style={{background:"transparent",border:"none",color:G3,fontSize:12,cursor:"pointer",marginBottom:14}}>← Back</button>
            <div style={{fontWeight:700,fontSize:14,marginBottom:14}}>Enter UPI ID</div>
            <input value={upiId} onChange={e=>setUpiId(e.target.value)} placeholder="name@upi / 9876543210@ybl" style={s.inp}/>
            <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
              {["GPay","PhonePe","Paytm","BHIM"].map(a=>(
                <button key={a} onClick={()=>setUpiId(`demo@${a.toLowerCase()}`)} style={{padding:"5px 12px",borderRadius:20,border:`1px solid ${G2}`,background:G1,fontSize:11,fontWeight:600,cursor:"pointer"}}>{a}</button>
              ))}
            </div>
            <button onClick={()=>upiId&&process("UPI")} style={{...s.btn(upiId?BK:G2,upiId?Y:G3)}}>Pay ₹{total}</button>
          </div>
        )}

        {step==="card"&&(
          <div style={{padding:20}}>
            <button onClick={()=>setStep("choose")} style={{background:"transparent",border:"none",color:G3,fontSize:12,cursor:"pointer",marginBottom:14}}>← Back</button>
            <div style={{fontWeight:700,fontSize:14,marginBottom:14}}>Card Details</div>
            <input value={card.num} onChange={e=>setCard(p=>({...p,num:e.target.value.replace(/\D/g,"").slice(0,16)}))} placeholder="Card number" style={s.inp}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              <input value={card.exp} onChange={e=>setCard(p=>({...p,exp:e.target.value}))} placeholder="MM/YY" style={{...s.inp,marginBottom:0}}/>
              <input value={card.cvv} onChange={e=>setCard(p=>({...p,cvv:e.target.value.slice(0,4)}))} placeholder="CVV" style={{...s.inp,marginBottom:0}}/>
            </div>
            <input value={card.name} onChange={e=>setCard(p=>({...p,name:e.target.value}))} placeholder="Name on card" style={{...s.inp,marginTop:8}}/>
            <button onClick={()=>card.num.length>=16&&process("Card")} style={{...s.btn(card.num.length>=16?BK:G2,card.num.length>=16?Y:G3)}}>Pay ₹{total}</button>
          </div>
        )}

        {step==="processing"&&(
          <div style={{padding:48,textAlign:"center"}}>
            <div style={{fontSize:48,marginBottom:16,animation:"spin 1s linear infinite",display:"inline-block"}}>⚙️</div>
            <div style={{fontWeight:700,fontSize:16,color:G4}}>Processing payment...</div>
            <div style={{color:G3,fontSize:12,marginTop:6}}>Please don't close this window</div>
            <div style={{marginTop:20,height:4,background:G2,borderRadius:10,overflow:"hidden"}}>
              <div style={{height:"100%",background:Y,borderRadius:10,animation:"shimmer 1.5s ease infinite",backgroundSize:"400px 100%",backgroundImage:`linear-gradient(90deg,${Y} 25%,#FDE68A 50%,${Y} 75%)`}}/>
            </div>
          </div>
        )}

        {step==="done"&&(
          <div style={{padding:48,textAlign:"center"}}>
            <div style={{fontSize:56,marginBottom:12}} className="bounce">✅</div>
            <div style={{fontWeight:800,fontSize:18,color:GN}}>Payment Successful!</div>
            <div style={{color:G3,fontSize:13,marginTop:6}}>₹{total} paid successfully</div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   LOGIN PAGE
═══════════════════════════════════════════════════════════════════════════ */
function LoginPage({onLogin}){
  const [mode,setMode]=useState("login"); // login | signup
  const [email,setEmail]=useState("");
  const [pw,setPw]=useState("");
  const [name,setName]=useState("");
  const [loading,setLoading]=useState(false);
  const [err,setErr]=useState("");
  const [role,setRole]=useState("customer"); // customer | admin

  const ADMIN_EMAIL="admin@blinkit.com";

  const handleGoogle=async()=>{
    setLoading(true);setErr("");
    try{
      const r=await signInWithPopup(auth,googleProvider);
      const isAdmin=r.user.email===ADMIN_EMAIL;
      await setDoc(doc(db,"users",r.user.uid),{name:r.user.displayName,email:r.user.email,role:isAdmin?"admin":"customer",photo:r.user.photoURL||"",updatedAt:serverTimestamp()},{merge:true});
      onLogin(r.user,isAdmin?"admin":"customer");
    }catch(e){setErr(e.message);}finally{setLoading(false);}
  };

  const handleEmail=async()=>{
    if(!email||!pw){setErr("Please fill all fields");return;}
    setLoading(true);setErr("");
    try{
      let r;
      if(mode==="signup"){
        r=await createUserWithEmailAndPassword(auth,email,pw);
        await updateProfile(r.user,{displayName:name||email.split("@")[0]});
      }else{
        r=await signInWithEmailAndPassword(auth,email,pw);
      }
      const isAdmin=email===ADMIN_EMAIL||role==="admin";
      await setDoc(doc(db,"users",r.user.uid),{name:r.user.displayName||name,email,role:isAdmin?"admin":"customer",updatedAt:serverTimestamp()},{merge:true});
      onLogin(r.user,isAdmin?"admin":"customer");
    }catch(e){
      const msgs={"auth/user-not-found":"No account found","auth/wrong-password":"Wrong password","auth/email-already-in-use":"Email already registered","auth/weak-password":"Password too weak (min 6 chars)"};
      setErr(msgs[e.code]||e.message);
    }finally{setLoading(false);}
  };

  const s={
    inp:{width:"100%",padding:"11px 14px",borderRadius:10,border:`1px solid ${G2}`,fontSize:13,outline:"none",boxSizing:"border-box",transition:"border 0.2s"},
    btn:(bg,fg=WH)=>({cursor:"pointer",border:"none",borderRadius:10,padding:"12px 0",fontWeight:700,fontSize:14,background:bg,color:fg,width:"100%",transition:"all 0.18s",opacity:loading?0.7:1}),
  };

  return(
    <div style={{minHeight:"100vh",background:`linear-gradient(135deg,${BK} 0%,#2d2d2d 100%)`,display:"flex",alignItems:"center",justifyContent:"center",padding:16,fontFamily:"'Segoe UI',system-ui,sans-serif"}}>
      <div style={{width:"100%",maxWidth:420}}>
        {/* Logo */}
        <div className="fade-in" style={{textAlign:"center",marginBottom:32}}>
          <div style={{background:Y,borderRadius:12,padding:"10px 24px",fontWeight:900,fontSize:28,color:BK,letterSpacing:2,display:"inline-block",marginBottom:10}}>blinkit</div>
          <div style={{color:G3,fontSize:13}}>India's fastest grocery delivery</div>
        </div>

        {/* Card */}
        <div className="fade-in" style={{background:WH,borderRadius:20,padding:28,boxShadow:"0 24px 60px rgba(0,0,0,0.4)"}}>
          {/* Role toggle */}
          <div style={{display:"flex",gap:6,marginBottom:22,background:G1,borderRadius:10,padding:4}}>
            {["customer","admin"].map(r=>(
              <button key={r} onClick={()=>setRole(r)} style={{flex:1,padding:"8px 0",borderRadius:8,border:"none",background:role===r?WH:"transparent",fontWeight:700,fontSize:12,color:role===r?BK:G3,textTransform:"capitalize",cursor:"pointer",transition:"all 0.18s",boxShadow:role===r?"0 1px 4px rgba(0,0,0,0.1)":"none"}}>
                {r==="admin"?"🛡️ Admin":"🛍️ Customer"}
              </button>
            ))}
          </div>

          <h2 style={{fontWeight:800,fontSize:20,marginBottom:4,color:BK}}>{mode==="login"?"Welcome back!":"Create account"}</h2>
          <p style={{color:G3,fontSize:12,marginBottom:20}}>{mode==="login"?"Sign in to continue":"Join blinkit today"}</p>

          {err&&<div className="fade-in" style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:8,padding:"9px 12px",fontSize:12,color:RD,marginBottom:14,fontWeight:600}}>{err}</div>}

          {mode==="signup"&&(
            <div style={{marginBottom:10}}>
              <label style={{fontSize:11,color:G3,fontWeight:600,display:"block",marginBottom:4,textTransform:"uppercase",letterSpacing:"0.4px"}}>Full Name</label>
              <input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" style={s.inp}/>
            </div>
          )}

          <div style={{marginBottom:10}}>
            <label style={{fontSize:11,color:G3,fontWeight:600,display:"block",marginBottom:4,textTransform:"uppercase",letterSpacing:"0.4px"}}>Email</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder={role==="admin"?"admin@blinkit.com":"you@example.com"} style={s.inp}/>
          </div>
          <div style={{marginBottom:18}}>
            <label style={{fontSize:11,color:G3,fontWeight:600,display:"block",marginBottom:4,textTransform:"uppercase",letterSpacing:"0.4px"}}>Password</label>
            <input type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="••••••••" style={s.inp} onKeyDown={e=>e.key==="Enter"&&handleEmail()}/>
          </div>

          <button onClick={handleEmail} disabled={loading} style={s.btn(BK,Y)}>
            {loading?<span className="spin" style={{display:"inline-block"}}>⚙️</span>:mode==="login"?"Sign In →":"Create Account →"}
          </button>

          <div style={{display:"flex",alignItems:"center",gap:10,margin:"16px 0"}}>
            <div style={{flex:1,height:1,background:G2}}/><span style={{fontSize:11,color:G3}}>or</span><div style={{flex:1,height:1,background:G2}}/>
          </div>

          <button onClick={handleGoogle} disabled={loading} style={{...s.btn(G1,G4),border:`1px solid ${G2}`,display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
            <img src="https://www.google.com/favicon.ico" width={16} height={16} alt="G"/>
            Continue with Google
          </button>

          <div style={{textAlign:"center",marginTop:16,fontSize:12,color:G3}}>
            {mode==="login"?"Don't have an account?":"Already have an account?"}
            <span onClick={()=>{setMode(p=>p==="login"?"signup":"login");setErr("");}} style={{color:BK,fontWeight:700,cursor:"pointer",marginLeft:4}}>
              {mode==="login"?"Sign up":"Sign in"}
            </span>
          </div>

          {role==="admin"&&<div style={{marginTop:14,background:"#FFFBEB",border:"1px solid #FDE68A",borderRadius:8,padding:"8px 12px",fontSize:11,color:"#92400E",textAlign:"center"}}>Admin email: admin@blinkit.com</div>}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ADMIN PANEL
═══════════════════════════════════════════════════════════════════════════ */
function AdminPanel({user,onLogout}){
  const [inv,setInv]=useState(PRODUCTS);
  const [orders,setOrders]=useState([]);
  const [tab,setTab]=useState("live");
  const [aTab,setATab]=useState("overview");
  const [liveOn,setLiveOn]=useState(true);
  const [selOrder,setSelOrder]=useState(null);
  const [invSearch,setInvSearch]=useState("");
  const [showForm,setShowForm]=useState(false);
  const [editId,setEditId]=useState(null);
  const [form,setForm]=useState({});
  const [stockMod,setStockMod]=useState(null);
  const [sAdj,setSAdj]=useState({type:"IN",qty:"",note:""});
  const [notifs,setNotifs]=useState([]);
  const [toast,setToast]=useState(null);
  const [imgLoaded,setImgLoaded]=useState({});
  const [loading,setLoading]=useState(true);
  const liveRef=useRef();

  const pushN=useCallback((msg,type="info")=>{
    const n={id:Date.now()+Math.random(),msg,type,time:ts(),read:false};
    setNotifs(p=>[n,...p].slice(0,50));
    setToast(n); setTimeout(()=>setToast(null),3200);
    sendBrowserNotif("Blinkit Admin",msg);
  },[]);

  useEffect(()=>{
    requestNotifPermission();
    // Load orders from Firestore
    const q=query(collection(db,"orders"),orderBy("createdAt","desc"));
    const unsub=onSnapshot(q,snap=>{
      setOrders(snap.docs.map(d=>({firestoreId:d.id,...d.data()})));
      setLoading(false);
    },()=>setLoading(false));
    return unsub;
  },[]);

  const CUSTOMERS=["Rahul Sharma","Priya Mehta","Ankit Rao","Sneha Gupta","Vikram Singh"];
  const AREAS=["Saket","Green Park","Hauz Khas","Vasant Kunj","South Ex"];
  const pick=arr=>arr[rand(0,arr.length-1)];

  useEffect(()=>{
    if(!liveOn)return;
    liveRef.current=setInterval(()=>{
      const avail=inv.filter(i=>i.qty>0);
      if(!avail.length)return;
      const n=rand(1,Math.min(3,avail.length));
      const items=[...avail].sort(()=>Math.random()-0.5).slice(0,n).map(p=>({sku:p.sku,name:p.name,emoji:p.emoji,qty:rand(1,2),price:p.price}));
      const customer=pick(CUSTOMERS), area=pick(AREAS);
      const total=items.reduce((a,i)=>a+i.qty*i.price,0);
      const oid=`ORD-${rand(200,999)}`;
      const o={id:oid,customer,area,items,total,status:"placed",statusIdx:0,time:ts(),eta:rand(8,15),isAdmin:true,log:[{status:"placed",time:ts(),msg:SM.placed.msg}],createdAt:serverTimestamp()};
      addDoc(collection(db,"orders"),o).catch(()=>{});
      pushN(`📱 New order ${oid} from ${customer} — ₹${total}`,"order");
      // auto-advance
      let d=rand(3000,5000);
      STATUS_FLOW.slice(1).forEach((_,si)=>{
        d+=rand(2000,5000);
        setTimeout(async()=>{
          // find and advance
        },d);
      });
    },rand(6000,10000));
    return()=>clearInterval(liveRef.current);
  },[liveOn,inv,pushN]);

  const active=orders.filter(o=>o.status!=="delivered");
  const delivered=orders.filter(o=>o.status==="delivered");
  const revenue=delivered.reduce((a,o)=>a+o.total,0);
  const outOfStock=inv.filter(i=>i.qty===0);
  const lowStock=inv.filter(i=>i.qty>0&&i.qty<=i.msL);

  const adjStock=()=>{
    if(!sAdj.qty||+sAdj.qty<=0){pushN("Enter valid qty","danger");return;}
    const q=+sAdj.qty;
    setInv(p=>p.map(i=>i.id!==stockMod.id?i:{...i,qty:sAdj.type==="IN"?i.qty+q:Math.max(0,i.qty-q)}));
    pushN(`Stock ${sAdj.type}: ${stockMod.name} — ${sAdj.type==="IN"?"+":"-"}${q}`,"success");
    setStockMod(null);
  };

  const saveInv=()=>{
    if(!form.name||!form.sku||!form.price||!form.qty){pushN("Fill required fields","danger");return;}
    const e={...form,price:+form.price,cost:+form.cost,qty:+form.qty,msL:+form.msL};
    if(editId) setInv(p=>p.map(i=>i.id===editId?{...i,...e}:i));
    else setInv(p=>[...p,{...e,id:Date.now()}]);
    pushN(editId?"Product updated":"Product added","success");
    setShowForm(false);setEditId(null);
  };

  const s={
    card:{background:WH,borderRadius:12,padding:20,border:`1px solid ${G2}`,boxShadow:"0 1px 4px rgba(0,0,0,0.06)"},
    inp:{width:"100%",padding:"9px 12px",borderRadius:8,border:`1px solid ${G2}`,background:WH,color:BK,fontSize:13,outline:"none",boxSizing:"border-box"},
    th:{background:G1,color:G4,padding:"10px 12px",fontSize:11,fontWeight:700,textAlign:"left",borderBottom:`1px solid ${G2}`,textTransform:"uppercase",letterSpacing:"0.5px"},
    td:{padding:"10px 12px",fontSize:13,color:G4,borderBottom:`1px solid ${G1}`},
    btn:(bg,fg=WH,p="8px 16px")=>({cursor:"pointer",border:"none",borderRadius:8,padding:p,fontWeight:600,fontSize:12,background:bg,color:fg,transition:"all 0.18s"}),
    pill:(bg,fg=WH)=>({display:"inline-block",background:bg,color:fg,borderRadius:20,padding:"3px 10px",fontSize:11,fontWeight:600}),
  };

  const navs=[{id:"live",label:"Live Orders",badge:active.length},{id:"inventory",label:"Inventory",badge:outOfStock.length+lowStock.length},{id:"admin",label:"Admin",badge:0},{id:"log",label:"Activity",badge:notifs.filter(n=>!n.read).length}];

  return(
    <div style={{minHeight:"100vh",background:G1,fontFamily:"'Segoe UI',system-ui,sans-serif",color:BK}}>
      <Toast t={toast}/>

      {/* Header */}
      <div style={{background:WH,borderBottom:`1px solid ${G2}`,padding:"0 20px",display:"flex",alignItems:"center",justifyContent:"space-between",height:58,position:"sticky",top:0,zIndex:50,boxShadow:"0 1px 3px rgba(0,0,0,0.06)"}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{background:Y,borderRadius:8,padding:"5px 13px",fontWeight:900,fontSize:17,color:BK,letterSpacing:1.5}}>blinkit</div>
          <div style={{width:1,height:22,background:G2}}/>
          <span style={{fontSize:12,color:G3,fontWeight:600}}>Admin · Dark Store Delhi-01</span>
          <div style={{display:"flex",alignItems:"center",gap:5,background:liveOn?"#F0FDF4":"#FEF2F2",borderRadius:20,padding:"3px 10px",border:`1px solid ${liveOn?"#BBF7D0":"#FECACA"}`}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:liveOn?GN:RD}}/>
            <span style={{fontSize:11,color:liveOn?GN:RD,fontWeight:700}}>{liveOn?"LIVE":"PAUSED"}</span>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <NotifBell notifs={notifs} onClear={()=>setNotifs([])}/>
          {/* User avatar */}
          <div style={{display:"flex",alignItems:"center",gap:8,background:G1,borderRadius:10,padding:"5px 10px",border:`1px solid ${G2}`}}>
            {user.photoURL?<img src={user.photoURL} width={24} height={24} style={{borderRadius:"50%"}} alt=""/>:<div style={{width:24,height:24,borderRadius:"50%",background:Y,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:11,color:BK}}>{(user.displayName||user.email||"A")[0].toUpperCase()}</div>}
            <span style={{fontSize:12,fontWeight:600,color:G4}}>{user.displayName||"Admin"}</span>
          </div>
          <button onClick={()=>setLiveOn(p=>!p)} style={s.btn(liveOn?RD:GN,WH,"7px 14px")}>{liveOn?"⏸ Pause":"▶ Resume"}</button>
          <button onClick={onLogout} style={s.btn(G1,G4,"7px 14px")}>Sign out</button>
        </div>
      </div>

      {/* Nav */}
      <div style={{background:WH,borderBottom:`1px solid ${G2}`,padding:"0 20px",display:"flex",gap:2}}>
        {navs.map(n=>(
          <button key={n.id} onClick={()=>setTab(n.id)} style={{...s.btn("transparent",tab===n.id?BK:G3,"12px 16px"),borderBottom:tab===n.id?`2px solid ${Y}`:"2px solid transparent",borderRadius:0,fontWeight:tab===n.id?700:500,fontSize:13}}>
            {n.label}
            {n.badge>0&&<span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",background:RD,color:WH,borderRadius:10,minWidth:16,height:16,fontSize:10,fontWeight:700,marginLeft:5,padding:"0 4px"}}>{n.badge}</span>}
          </button>
        ))}
      </div>

      <div style={{padding:20,overflowY:"auto"}}>

        {/* LIVE */}
        {tab==="live"&&(
          <div className="fade-in">
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
              {[{l:"Active Orders",v:active.length,c:Y,sub:"In progress"},{l:"Delivered",v:delivered.length,c:GN,sub:"Completed"},{l:"Revenue",v:`₹${revenue.toLocaleString()}`,c:BL,sub:"Today"},{l:"Alerts",v:outOfStock.length+lowStock.length,c:RD,sub:"Stock issues"}].map(k=>(
                <div key={k.l} style={{...s.card,borderTop:`3px solid ${k.c}`}} className="fade-in">
                  <div style={{fontSize:11,color:G3,fontWeight:600,marginBottom:4,textTransform:"uppercase",letterSpacing:"0.5px"}}>{k.l}</div>
                  <div style={{fontSize:26,fontWeight:800,color:BK}}>{k.v}</div>
                  <div style={{fontSize:11,color:G3,marginTop:2}}>{k.sub}</div>
                </div>
              ))}
            </div>

            {loading&&[1,2,3].map(i=>(
              <div key={i} style={{...s.card,marginBottom:12}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}><Skeleton w="40%" h={16}/><Skeleton w="20%" h={24} r={12}/></div>
                <Skeleton h={12} mb={8}/><Skeleton h={8}/>
              </div>
            ))}

            {!loading&&orders.length===0&&(
              <div style={{...s.card,textAlign:"center",padding:80,color:G3}}>
                <div style={{fontSize:48,marginBottom:12}} className="bounce">⏳</div>
                <div style={{fontSize:16,fontWeight:600,color:G4}}>Waiting for live orders...</div>
              </div>
            )}

            <div style={{display:"grid",gap:12}}>
              {orders.map(o=>(
                <div key={o.firestoreId||o.id} onClick={()=>setSelOrder(o)} className="fade-in" style={{...s.card,borderLeft:`4px solid ${SM[o.status]?.color||G2}`,cursor:"pointer",transition:"box-shadow 0.18s"}}
                  onMouseEnter={e=>e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,0.12)"}
                  onMouseLeave={e=>e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,0.06)"}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                    <div>
                      <span style={{fontWeight:800,fontSize:14,color:BK}}>{o.id}</span>
                      <span style={{color:G3,fontSize:12,marginLeft:8}}>{o.customer} · {o.area}</span>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <span style={{...s.pill(SM[o.status]?.color||G3),padding:"5px 12px"}}>{SM[o.status]?.label}</span>
                      <span style={{fontWeight:800,color:GN,fontSize:15}}>₹{o.total}</span>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
                    {(o.items||[]).map(i=><span key={i.sku} style={{background:G1,border:`1px solid ${G2}`,borderRadius:6,padding:"3px 8px",fontSize:11,color:G4}}>{i.emoji} {i.name} ×{i.qty}</span>)}
                  </div>
                  <OrderTracker order={o}/>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* INVENTORY */}
        {tab==="inventory"&&(
          <div className="fade-in">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div>
                <h2 style={{fontSize:18,fontWeight:800,color:BK}}>Inventory</h2>
                <p style={{color:G3,fontSize:12,marginTop:2}}>{inv.length} products · <span style={{color:RD}}>{outOfStock.length} out of stock</span> · <span style={{color:"#D97706"}}>{lowStock.length} low</span></p>
              </div>
              <button onClick={()=>{setForm({name:"",sku:"",cat:"Dairy",emoji:"📦",img:"",price:"",cost:"",qty:"",msL:"",expiry:"",vendor:"",desc:""});setEditId(null);setShowForm(true);}} style={s.btn(Y,BK,"10px 20px")}>+ Add Product</button>
            </div>
            <input placeholder="Search..." value={invSearch} onChange={e=>setInvSearch(e.target.value)} style={{...s.inp,maxWidth:260,marginBottom:14}}/>

            {/* Product grid with images */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:14}}>
              {inv.filter(i=>i.name.toLowerCase().includes(invSearch.toLowerCase())||i.sku.toLowerCase().includes(invSearch.toLowerCase())).map((item,idx)=>{
                const st=item.qty===0?"out":item.qty<=item.msL?"low":"ok";
                return(
                  <div key={item.id} className="fade-in" style={{background:WH,borderRadius:12,overflow:"hidden",border:`1px solid ${G2}`,boxShadow:"0 1px 4px rgba(0,0,0,0.06)",transition:"box-shadow 0.18s"}}
                    onMouseEnter={e=>e.currentTarget.style.boxShadow="0 6px 20px rgba(0,0,0,0.1)"}
                    onMouseLeave={e=>e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,0.06)"}>
                    {/* Product image */}
                    <div style={{position:"relative",background:G1,height:120,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
                      {!imgLoaded[item.id]&&<Skeleton w="100%" h={120} r={0}/>}
                      {item.img&&<img src={item.img} alt={item.name} onLoad={()=>setImgLoaded(p=>({...p,[item.id]:true}))} onError={()=>setImgLoaded(p=>({...p,[item.id]:true}))} style={{width:"100%",height:120,objectFit:"cover",display:imgLoaded[item.id]?"block":"none"}}/>}
                      {(!item.img||!imgLoaded[item.id])&&imgLoaded[item.id]&&<span style={{fontSize:48}}>{item.emoji}</span>}
                      {st!=="ok"&&<div style={{position:"absolute",top:8,right:8,...s.pill(st==="out"?RD:"#F59E0B",st==="out"?WH:BK),fontSize:9}}>{st==="out"?"OUT":"LOW"}</div>}
                    </div>
                    <div style={{padding:12}}>
                      <div style={{fontWeight:700,fontSize:12,color:BK,marginBottom:2}}>{item.name}</div>
                      <div style={{fontSize:10,color:G3,marginBottom:8}}>{item.cat} · {item.vendor}</div>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                        <span style={{fontWeight:800,fontSize:15}}>₹{item.price}</span>
                        <span style={{fontSize:10,color:st==="out"?RD:st==="low"?"#D97706":GN,fontWeight:600}}>Qty: {item.qty}</span>
                      </div>
                      <div style={{display:"flex",gap:4}}>
                        <button onClick={()=>{setStockMod(item);setSAdj({type:"IN",qty:"",note:""}); }} style={{...s.btn(GN,WH,"5px 0"),flex:1,fontSize:11}}>Stock</button>
                        <button onClick={()=>{setForm({...item,price:String(item.price),cost:String(item.cost),qty:String(item.qty),msL:String(item.msL)});setEditId(item.id);setShowForm(true);}} style={{...s.btn(BL,WH,"5px 0"),flex:1,fontSize:11}}>Edit</button>
                        <button onClick={()=>{if(window.confirm("Delete?"))setInv(p=>p.filter(i=>i.id!==item.id));}} style={{...s.btn("#FEF2F2",RD,"5px 0"),border:`1px solid #FECACA`,flex:1,fontSize:11}}>Del</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ADMIN */}
        {tab==="admin"&&(
          <div className="fade-in">
            <h2 style={{fontSize:18,fontWeight:800,marginBottom:16}}>Store Management</h2>
            <div style={{display:"flex",gap:8,marginBottom:18,flexWrap:"wrap"}}>
              {["overview","alerts","replenishment","staff"].map(t=>(
                <button key={t} onClick={()=>setATab(t)} style={{...s.btn(aTab===t?Y:WH,aTab===t?BK:G4,"8px 18px"),border:`1px solid ${aTab===t?Y:G2}`,textTransform:"capitalize",fontWeight:600,fontSize:12}}>{t}</button>
              ))}
            </div>

            {aTab==="overview"&&(
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                <div style={s.card}>
                  <div style={{fontWeight:700,marginBottom:14,fontSize:14}}>Inventory Health</div>
                  {[{l:"Healthy",v:inv.filter(i=>i.qty>i.msL).length,c:GN},{l:"Low Stock",v:lowStock.length,c:"#D97706"},{l:"Out of Stock",v:outOfStock.length,c:RD}].map(r=>(
                    <div key={r.l} style={{marginBottom:12}}>
                      <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}><span style={{color:G3}}>{r.l}</span><span style={{color:r.c,fontWeight:700}}>{r.v}</span></div>
                      <div style={{background:G2,borderRadius:8,height:6}}><div style={{background:r.c,width:`${(r.v/inv.length)*100}%`,height:6,borderRadius:8,transition:"width 0.5s"}}/></div>
                    </div>
                  ))}
                </div>
                <div style={s.card}>
                  <div style={{fontWeight:700,marginBottom:14,fontSize:14}}>Financials</div>
                  {[{l:"Inventory Cost",v:`₹${inv.reduce((a,i)=>a+i.qty*i.cost,0).toLocaleString()}`,c:"#7C3AED"},{l:"Revenue Potential",v:`₹${inv.reduce((a,i)=>a+i.qty*i.price,0).toLocaleString()}`,c:GN},{l:"Today's Revenue",v:`₹${revenue.toLocaleString()}`,c:BL}].map(r=>(
                    <div key={r.l} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:`1px solid ${G1}`,fontSize:13}}>
                      <span style={{color:G3}}>{r.l}</span><span style={{fontWeight:700,color:r.c}}>{r.v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {aTab==="alerts"&&(
              <div>
                {[...outOfStock,...lowStock].length===0
                  ?<div style={{...s.card,textAlign:"center",padding:48,color:G3}}><div style={{fontSize:36,marginBottom:8}}>✅</div>All stock healthy</div>
                  :[...outOfStock.map(i=>({...i,_t:"out"})),...lowStock.map(i=>({...i,_t:"low"}))].map(i=>(
                    <div key={i.id} style={{...s.card,borderLeft:`4px solid ${i._t==="out"?RD:"#D97706"}`,marginBottom:10,display:"flex",gap:14,alignItems:"center"}}>
                      <img src={i.img} alt="" width={48} height={48} style={{borderRadius:8,objectFit:"cover"}}/>
                      <div><strong style={{color:i._t==="out"?RD:"#D97706"}}>{i._t==="out"?"Out of Stock":"Low Stock"}</strong> — {i.name} <span style={{color:G3}}>({i.qty} left)</span></div>
                    </div>
                  ))
                }
              </div>
            )}

            {aTab==="replenishment"&&(
              <div>
                {[...outOfStock,...lowStock].map(item=>(
                  <div key={item.id} style={{...s.card,display:"flex",gap:14,alignItems:"center",marginBottom:10}}>
                    <img src={item.img} alt="" width={48} height={48} style={{borderRadius:8,objectFit:"cover"}}/>
                    <div style={{flex:1,fontSize:13}}><strong>{item.name}</strong> — needs <span style={{color:Y,fontWeight:800}}>{Math.max(0,item.msL*3-item.qty)}</span> units from {item.vendor}</div>
                    <span style={{...s.pill(GN),fontSize:10}}>PO Sent</span>
                  </div>
                ))}
                {[...outOfStock,...lowStock].length===0&&<div style={{...s.card,textAlign:"center",color:G3,padding:40}}>No replenishment needed</div>}
              </div>
            )}

            {aTab==="staff"&&(
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
                {[{n:"Ravi Kumar",r:"Store Manager",s:"active",t:12,em:"👨‍💼"},{n:"Suresh M.",r:"Picker",s:"active",t:34,em:"🧺"},{n:"Amit Singh",r:"Picker",s:"active",t:28,em:"🧺"},{n:"Priya D.",r:"Packer",s:"active",t:31,em:"📦"},{n:"Rohit S.",r:"Delivery",s:"active",t:18,em:"🛵"},{n:"Neha B.",r:"Quality Check",s:"break",t:15,em:"🔍"}].map(st=>(
                  <div key={st.n} style={{...s.card,textAlign:"center",borderTop:`3px solid ${st.s==="active"?GN:"#D97706"}`}}>
                    <div style={{fontSize:32,marginBottom:8}}>{st.em}</div>
                    <div style={{fontWeight:700,fontSize:13}}>{st.n}</div>
                    <div style={{color:G3,fontSize:11,marginBottom:8}}>{st.r}</div>
                    <span style={{...s.pill(st.s==="active"?GN:"#F59E0B",st.s==="active"?WH:BK),fontSize:10}}>{st.s.toUpperCase()}</span>
                    <div style={{marginTop:8,fontSize:12,color:G4,fontWeight:600}}>{st.t} tasks today</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* LOG */}
        {tab==="log"&&(
          <div className="fade-in">
            <h2 style={{fontSize:18,fontWeight:800,marginBottom:16}}>Activity Log</h2>
            <div style={{display:"grid",gap:6}}>
              {notifs.length===0&&<div style={{...s.card,textAlign:"center",color:G3,padding:40}}>No activity yet</div>}
              {notifs.map(n=>(
                <div key={n.id} style={{background:WH,borderRadius:8,padding:"10px 14px",borderLeft:`3px solid ${n.type==="danger"?RD:n.type==="success"?GN:n.type==="order"?BL:"#D97706"}`,display:"flex",justifyContent:"space-between",gap:8,border:`1px solid ${G2}`}}>
                  <span style={{fontSize:12,color:G4}}>{n.msg}</span>
                  <span style={{fontSize:10,color:G3,whiteSpace:"nowrap"}}>{n.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Order detail modal */}
      {selOrder&&(()=>{
        const o=selOrder;
        return(
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:300,padding:16}} onClick={e=>{if(e.target===e.currentTarget)setSelOrder(null);}}>
            <div className="fade-in" style={{background:WH,borderRadius:16,padding:24,width:"100%",maxWidth:500,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,0.25)"}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
                <div><div style={{fontWeight:800,fontSize:17}}>{o.id}</div><div style={{color:G3,fontSize:12,marginTop:2}}>{o.customer} · {o.area} · {o.time}</div></div>
                <button onClick={()=>setSelOrder(null)} style={{cursor:"pointer",border:`1px solid ${G2}`,background:G1,color:G4,borderRadius:8,padding:"4px 12px",fontSize:12,fontWeight:600}}>Close</button>
              </div>
              <OrderTracker order={o}/>
              <div style={{marginTop:14}}>
                {(o.items||[]).map(i=>(
                  <div key={i.sku} style={{display:"flex",justifyContent:"space-between",background:G1,borderRadius:8,padding:"9px 12px",marginBottom:6,fontSize:13}}>
                    <span style={{color:G4}}>{i.emoji} {i.name} ×{i.qty}</span>
                    <span style={{fontWeight:700}}>₹{i.qty*i.price}</span>
                  </div>
                ))}
                <div style={{display:"flex",justifyContent:"space-between",fontWeight:800,fontSize:15,padding:"12px 0",borderTop:`1px solid ${G2}`}}><span style={{color:G3}}>Total</span><span style={{color:GN}}>₹{o.total}</span></div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Add/Edit modal */}
      {showForm&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:300,padding:16}} onClick={e=>{if(e.target===e.currentTarget)setShowForm(false);}}>
          <div className="fade-in" style={{background:WH,borderRadius:16,padding:24,width:"100%",maxWidth:480,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,0.25)"}}>
            <h3 style={{marginBottom:16,fontWeight:800,fontSize:16}}>{editId?"Edit Product":"Add New Product"}</h3>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {[{l:"Name *",k:"name",t:"text",f:true},{l:"SKU *",k:"sku",t:"text"},{l:"Emoji",k:"emoji",t:"text"},{l:"Image URL",k:"img",t:"text",f:true},{l:"MRP ₹ *",k:"price",t:"number"},{l:"Cost ₹",k:"cost",t:"number"},{l:"Stock *",k:"qty",t:"number"},{l:"Min Level",k:"msL",t:"number"},{l:"Expiry",k:"expiry",t:"date"},{l:"Vendor",k:"vendor",t:"text",f:true}].map(f=>(
                <div key={f.k} style={{gridColumn:f.f?"span 2":"span 1"}}>
                  <label style={{fontSize:11,color:G3,display:"block",marginBottom:4,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.4px"}}>{f.l}</label>
                  <input type={f.t} value={form[f.k]||""} onChange={e=>setForm(p=>({...p,[f.k]:e.target.value}))} style={{...s.inp,marginBottom:0}}/>
                </div>
              ))}
              <div style={{gridColumn:"span 2"}}>
                <label style={{fontSize:11,color:G3,display:"block",marginBottom:4,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.4px"}}>Category</label>
                <select value={form.cat||"Dairy"} onChange={e=>setForm(p=>({...p,cat:e.target.value}))} style={s.inp}>{CATS.slice(1).map(c=><option key={c}>{c}</option>)}</select>
              </div>
            </div>
            {form.img&&<img src={form.img} alt="" style={{width:"100%",height:120,objectFit:"cover",borderRadius:8,marginTop:10}}/>}
            <div style={{display:"flex",gap:8,marginTop:18}}>
              <button onClick={saveInv} style={{...s.btn(Y,BK,"11px 0"),flex:1,fontWeight:700}}>{editId?"Save Changes":"Add Product"}</button>
              <button onClick={()=>setShowForm(false)} style={{...s.btn(G1,G4,"11px 0"),border:`1px solid ${G2}`,flex:1}}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Stock modal */}
      {stockMod&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:300,padding:16}} onClick={e=>{if(e.target===e.currentTarget)setStockMod(null);}}>
          <div className="fade-in" style={{background:WH,borderRadius:16,padding:24,width:"100%",maxWidth:360,boxShadow:"0 20px 60px rgba(0,0,0,0.25)"}}>
            <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:14}}>
              {stockMod.img&&<img src={stockMod.img} alt="" width={56} height={56} style={{borderRadius:10,objectFit:"cover"}}/>}
              <div><div style={{fontWeight:800,fontSize:15}}>{stockMod.name}</div><div style={{color:G3,fontSize:12}}>Current stock: <strong>{stockMod.qty}</strong></div></div>
            </div>
            <div style={{display:"flex",gap:6,marginBottom:12}}>
              {[["IN",GN,WH],["OUT",RD,WH],["DAMAGE","#F59E0B",BK]].map(([t,bg,fg])=>(
                <button key={t} onClick={()=>setSAdj(p=>({...p,type:t}))} style={{...s.btn(sAdj.type===t?bg:G1,sAdj.type===t?fg:G4,"9px 0"),flex:1,border:`1px solid ${sAdj.type===t?bg:G2}`,fontWeight:700}}>{t}</button>
              ))}
            </div>
            <input type="number" min="1" value={sAdj.qty} onChange={e=>setSAdj(p=>({...p,qty:e.target.value}))} placeholder="Quantity" style={{...s.inp,marginBottom:8}}/>
            <input value={sAdj.note} onChange={e=>setSAdj(p=>({...p,note:e.target.value}))} placeholder="Reason (optional)" style={{...s.inp,marginBottom:16}}/>
            <div style={{display:"flex",gap:8}}>
              <button onClick={adjStock} style={{...s.btn(sAdj.type==="IN"?GN:sAdj.type==="OUT"?RD:"#F59E0B",sAdj.type==="DAMAGE"?BK:WH,"11px 0"),flex:1,fontWeight:700}}>Confirm</button>
              <button onClick={()=>setStockMod(null)} style={{...s.btn(G1,G4,"11px 0"),border:`1px solid ${G2}`,flex:1}}>Cancel</button>
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
function CustomerPanel({user,onLogout}){
  const geo=useGeo();
  const [inv]=useState(PRODUCTS);
  const [orders,setOrders]=useState([]);
  const [page,setPage]=useState("home");
  const [cat,setCat]=useState("All");
  const [search,setSearch]=useState("");
  const [cart,setCart]=useState([]);
  const [selProd,setSelProd]=useState(null);
  const [myOrderIds,setMyOrderIds]=useState([]);
  const [trackId,setTrackId]=useState(null);
  const [showPayment,setShowPayment]=useState(false);
  const [pendingOrder,setPendingOrder]=useState(null);
  const [notifs,setNotifs]=useState([]);
  const [toast,setCustToast]=useState(null);
  const [imgLoaded,setImgLoaded]=useState({});
  const [loading,setLoading]=useState(true);
  const [showProfile,setShowProfile]=useState(false);

  const pushN=useCallback((msg,type="info")=>{
    const n={id:Date.now()+Math.random(),msg,type,time:ts(),read:false};
    setNotifs(p=>[n,...p].slice(0,30));
    setCustToast(n);setTimeout(()=>setCustToast(null),3200);
    sendBrowserNotif("Blinkit",msg);
  },[]);

  useEffect(()=>{
    requestNotifPermission();
    const q=query(collection(db,"orders"),orderBy("createdAt","desc"));
    const unsub=onSnapshot(q,snap=>{
      setOrders(snap.docs.map(d=>({firestoreId:d.id,...d.data()})));
      setLoading(false);
    },()=>setLoading(false));
    return unsub;
  },[]);

  const myOrders=useMemo(()=>orders.filter(o=>myOrderIds.includes(o.id)||o.userId===user.uid),[orders,myOrderIds,user.uid]);

  const addCart=(item,qty=1)=>setCart(p=>{const ex=p.find(x=>x.sku===item.sku);if(ex)return p.map(x=>x.sku===item.sku?{...x,qty:Math.min(x.qty+qty,item.qty)}:x);return[...p,{...item,qty}];});
  const removeCart=(sku)=>setCart(p=>p.filter(x=>x.sku!==sku));
  const changeQty=(sku,d)=>setCart(p=>p.map(x=>x.sku===sku?{...x,qty:Math.max(1,x.qty+d)}:x));
  const cartTotal=cart.reduce((a,i)=>a+i.qty*i.price,0);
  const cartCount=cart.reduce((a,i)=>a+i.qty,0);

  const initiateCheckout=()=>{
    if(!cart.length)return;
    const items=cart.map(c=>({sku:c.sku,name:c.name,emoji:c.emoji,qty:c.qty,price:c.price}));
    setPendingOrder(items);
    setShowPayment(true);
  };

  const onPaymentSuccess=async(method)=>{
    setShowPayment(false);
    if(!pendingOrder)return;
    const oid=`ORD-${rand(200,999)}`;
    const o={id:oid,customer:user.displayName||user.email,userId:user.uid,area:geo.address.split(",")[0]||"Your Location",items:pendingOrder,total:pendingOrder.reduce((a,i)=>a+i.qty*i.price,0),status:"placed",statusIdx:0,time:ts(),eta:rand(8,15),paymentMethod:method,isCustomer:true,log:[{status:"placed",time:ts(),msg:SM.placed.msg}],createdAt:serverTimestamp()};
    try{ await addDoc(collection(db,"orders"),o); }catch(e){ console.error(e); }
    setMyOrderIds(p=>[oid,...p]);
    setCart([]);
    setPendingOrder(null);
    setTrackId(oid);
    setPage("tracking");
    pushN(`✅ Order ${oid} placed! ETA ~${o.eta} mins`,"success");
    // auto-advance simulation
    let d=rand(3000,5000);
    STATUS_FLOW.slice(1).forEach((s)=>{
      d+=rand(3000,6000);
      setTimeout(()=>{
        setOrders(prev=>{
          const idx=prev.findIndex(x=>x.id===oid);
          if(idx===-1)return prev;
          const cur=prev[idx];
          if(cur.statusIdx>=STATUS_FLOW.length-1)return prev;
          const nextIdx=cur.statusIdx+1;
          const ns=STATUS_FLOW[nextIdx];
          const newLog=[...(cur.log||[]),{status:ns,time:ts(),msg:SM[ns].msg}];
          pushN(`${SM[ns].icon} Your order ${oid}: ${SM[ns].msg}`,"info");
          return prev.map((x,i)=>i===idx?{...x,status:ns,statusIdx:nextIdx,log:newLog}:x);
        });
      },d);
    });
  };

  const filtered=useMemo(()=>inv.filter(i=>i.qty>0&&(cat==="All"||i.cat===cat)&&i.name.toLowerCase().includes(search.toLowerCase())),[inv,cat,search]);

  const s={
    card:{background:WH,borderRadius:12,padding:20,boxShadow:"0 1px 4px rgba(0,0,0,0.07)",border:`1px solid ${G2}`},
    btn:(bg,fg=WH,p="9px 18px")=>({cursor:"pointer",border:"none",borderRadius:8,padding:p,fontWeight:600,fontSize:13,background:bg,color:fg,transition:"all 0.18s"}),
    pill:(bg,fg=WH)=>({display:"inline-block",background:bg,color:fg,borderRadius:20,padding:"3px 10px",fontSize:11,fontWeight:600}),
  };

  return(
    <div style={{minHeight:"100vh",background:G1,fontFamily:"'Segoe UI',system-ui,sans-serif",color:BK}}>
      <Toast t={toast}/>
      {showPayment&&<PaymentModal total={cartTotal} onSuccess={onPaymentSuccess} onClose={()=>setShowPayment(false)}/>}

      {/* Header */}
      <div style={{background:WH,borderBottom:`1px solid ${G2}`,padding:"0 16px",display:"flex",alignItems:"center",justifyContent:"space-between",height:58,position:"sticky",top:0,zIndex:50,boxShadow:"0 1px 3px rgba(0,0,0,0.06)"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{background:Y,borderRadius:8,padding:"5px 13px",fontWeight:900,fontSize:17,color:BK,letterSpacing:1.5,cursor:"pointer"}} onClick={()=>setPage("home")}>blinkit</div>
          <div style={{width:1,height:22,background:G2}}/>
          <div style={{display:"flex",alignItems:"center",gap:5}}>
            <span style={{fontSize:14}}>📍</span>
            <div>
              <div style={{fontSize:10,color:G3,fontWeight:600}}>Deliver to</div>
              <div style={{fontSize:12,color:BK,fontWeight:700,maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{geo.loading?"Locating...":geo.address}</div>
            </div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <NotifBell notifs={notifs} onClear={()=>setNotifs([])}/>
          <button onClick={()=>setPage("orders")} style={{...s.btn(G1,G4,"7px 13px"),border:`1px solid ${G2}`,fontSize:12}}>
            Orders{myOrders.length>0&&<span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",background:BL,color:WH,borderRadius:10,minWidth:16,height:16,fontSize:10,fontWeight:700,marginLeft:5,padding:"0 4px"}}>{myOrders.length}</span>}
          </button>
          <button onClick={()=>setPage("cart")} style={{...s.btn(Y,BK,"7px 14px"),fontWeight:700,fontSize:13}}>
            🛒{cartCount>0?` (${cartCount}) · ₹${cartTotal}`:" Cart"}
          </button>
          {/* User avatar */}
          <div onClick={()=>setShowProfile(p=>!p)} style={{display:"flex",alignItems:"center",gap:6,background:G1,borderRadius:10,padding:"5px 10px",border:`1px solid ${G2}`,cursor:"pointer"}}>
            {user.photoURL?<img src={user.photoURL} width={22} height={22} style={{borderRadius:"50%"}} alt=""/>:<div style={{width:22,height:22,borderRadius:"50%",background:Y,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:10,color:BK}}>{(user.displayName||user.email||"U")[0].toUpperCase()}</div>}
          </div>
        </div>
      </div>

      {/* Profile dropdown */}
      {showProfile&&(
        <div className="fade-in" style={{position:"fixed",top:66,right:16,background:WH,border:`1px solid ${G2}`,borderRadius:14,width:220,boxShadow:"0 8px 32px rgba(0,0,0,0.15)",zIndex:200,padding:16}}>
          <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:14,paddingBottom:14,borderBottom:`1px solid ${G2}`}}>
            {user.photoURL?<img src={user.photoURL} width={40} height={40} style={{borderRadius:"50%"}} alt=""/>:<div style={{width:40,height:40,borderRadius:"50%",background:Y,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:16,color:BK}}>{(user.displayName||user.email||"U")[0].toUpperCase()}</div>}
            <div><div style={{fontWeight:700,fontSize:13,color:BK}}>{user.displayName||"Customer"}</div><div style={{fontSize:11,color:G3}}>{user.email}</div></div>
          </div>
          <button onClick={()=>{setPage("orders");setShowProfile(false);}} style={{...s.btn(G1,G4,"8px 0"),width:"100%",textAlign:"left",marginBottom:6,fontSize:12}}>📦 My Orders</button>
          <button onClick={()=>{onLogout();setShowProfile(false);}} style={{...s.btn("#FEF2F2",RD,"8px 0"),width:"100%",textAlign:"left",fontSize:12,border:`1px solid #FECACA`}}>Sign Out</button>
        </div>
      )}

      {page==="home"&&(
        <div style={{flex:1,padding:16}} className="fade-in">
          {/* Hero */}
          <div style={{background:BK,borderRadius:16,padding:"28px 32px",marginBottom:20,display:"flex",justifyContent:"space-between",alignItems:"center",overflow:"hidden"}}>
            <div>
              <div style={{fontSize:12,color:Y,fontWeight:700,letterSpacing:1,marginBottom:6}}>⚡ Quick Commerce</div>
              <div style={{fontSize:26,fontWeight:900,color:WH,lineHeight:1.2,marginBottom:6}}>Groceries in <span style={{color:Y}}>10 minutes</span></div>
              <div style={{fontSize:12,color:G3,marginBottom:8}}>Fresh products from our dark store to your door</div>
              {geo.lat&&<div style={{fontSize:11,color:G3}}>📍 Live GPS active</div>}
            </div>
            <div style={{fontSize:72}} className="bounce">🛵</div>
          </div>

          {/* Search */}
          <input placeholder="Search groceries, brands & more..." value={search} onChange={e=>setSearch(e.target.value)} style={{width:"100%",maxWidth:340,padding:"10px 14px",borderRadius:10,border:`1px solid ${G2}`,background:WH,fontSize:13,outline:"none",boxSizing:"border-box",marginBottom:14}}/>

          {/* Categories */}
          <div style={{display:"flex",gap:8,marginBottom:18,flexWrap:"wrap"}}>
            {CATS.map(c=>(
              <button key={c} onClick={()=>setCat(c)} style={{...s.btn(cat===c?Y:WH,cat===c?BK:G4,"6px 14px"),border:`1px solid ${cat===c?Y:G2}`,fontSize:12,fontWeight:cat===c?700:500}}>{c}</button>
            ))}
          </div>

          {/* Products */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(158px,1fr))",gap:12}}>
            {loading&&[1,2,3,4,5,6].map(i=><ProductSkeleton key={i}/>)}
            {!loading&&filtered.map(item=>{
              const inCart=cart.find(x=>x.sku===item.sku);
              return(
                <div key={item.id} className="fade-in" style={{background:WH,borderRadius:12,overflow:"hidden",border:`1px solid ${G2}`,transition:"box-shadow 0.18s",cursor:"pointer"}}
                  onMouseEnter={e=>e.currentTarget.style.boxShadow="0 6px 20px rgba(0,0,0,0.1)"}
                  onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>
                  <div onClick={()=>{setSelProd(item);setPage("product");}} style={{background:G1,height:140,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",position:"relative"}}>
                    {!imgLoaded[item.id]&&<Skeleton w="100%" h={140} r={0}/>}
                    <img src={item.img} alt={item.name} onLoad={()=>setImgLoaded(p=>({...p,[item.id]:true}))} onError={e=>{e.target.style.display="none";setImgLoaded(p=>({...p,[item.id]:true}));}} style={{width:"100%",height:140,objectFit:"cover",display:imgLoaded[item.id]?"block":"none"}}/>
                    {imgLoaded[item.id]&&!item.img&&<span style={{fontSize:48}}>{item.emoji}</span>}
                  </div>
                  <div style={{padding:"10px 12px"}}>
                    <div style={{fontSize:12,fontWeight:700,marginBottom:2,color:BK,lineHeight:1.3}}>{item.name}</div>
                    <div style={{fontSize:10,color:G3,marginBottom:8}}>{item.desc}</div>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                      <span style={{fontWeight:800,fontSize:15,color:BK}}>₹{item.price}</span>
                      <span style={{fontSize:9,color:item.qty<10?RD:item.qty<20?"#D97706":GN,fontWeight:600}}>{item.qty<10?`Only ${item.qty} left`:`${item.qty} in stock`}</span>
                    </div>
                    {inCart?(
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:Y,borderRadius:8,padding:"5px 8px"}}>
                        <button onClick={()=>changeQty(item.sku,-1)} style={{...s.btn("transparent",BK,"0 8px"),fontSize:17,fontWeight:800}}>−</button>
                        <span style={{fontWeight:800,fontSize:13,color:BK}}>{inCart.qty}</span>
                        <button onClick={()=>addCart(item)} style={{...s.btn("transparent",BK,"0 8px"),fontSize:17,fontWeight:800}}>+</button>
                      </div>
                    ):(
                      <button onClick={()=>addCart(item)} style={{...s.btn(BK,Y,"8px 0"),width:"100%",fontSize:12,fontWeight:700}}>+ Add to Cart</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {page==="product"&&selProd&&(()=>{
        const live=inv.find(i=>i.id===selProd.id)||selProd;
        const inCart=cart.find(x=>x.sku===live.sku);
        return(
          <div style={{flex:1,padding:16,maxWidth:520,margin:"0 auto",width:"100%",boxSizing:"border-box"}} className="fade-in">
            <button onClick={()=>setPage("home")} style={{...s.btn(WH,G4,"7px 14px"),border:`1px solid ${G2}`,marginBottom:14,fontSize:12}}>← Back</button>
            <div style={{...s.card,overflow:"hidden",padding:0}}>
              <div style={{height:240,overflow:"hidden",position:"relative"}}>
                {!imgLoaded[`p${live.id}`]&&<Skeleton w="100%" h={240} r={0}/>}
                <img src={live.img} alt={live.name} onLoad={()=>setImgLoaded(p=>({...p,[`p${live.id}`]:true}))} style={{width:"100%",height:240,objectFit:"cover",display:imgLoaded[`p${live.id}`]?"block":"none"}}/>
              </div>
              <div style={{padding:20}}>
                <div style={{fontWeight:800,fontSize:20,marginBottom:3}}>{live.name}</div>
                <div style={{color:G3,fontSize:13,marginBottom:12}}>{live.desc}</div>
                <div style={{fontSize:26,fontWeight:800,marginBottom:18}}>₹{live.price}</div>
                {inCart?(
                  <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:22,background:Y,borderRadius:10,padding:"12px 18px"}}>
                    <button onClick={()=>changeQty(live.sku,-1)} style={{...s.btn("rgba(0,0,0,0.08)",BK,"0 14px"),fontSize:20,fontWeight:800}}>−</button>
                    <span style={{fontWeight:800,fontSize:18,color:BK}}>{inCart.qty} in cart</span>
                    <button onClick={()=>addCart(live)} style={{...s.btn("rgba(0,0,0,0.08)",BK,"0 14px"),fontSize:20,fontWeight:800}}>+</button>
                  </div>
                ):(
                  <button onClick={()=>addCart(live)} style={{...s.btn(BK,Y,"13px 0"),width:"100%",fontSize:14,fontWeight:700}}>🛒 Add to Cart — ₹{live.price}</button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {page==="cart"&&(
        <div style={{flex:1,padding:16,maxWidth:500,margin:"0 auto",width:"100%",boxSizing:"border-box"}} className="fade-in">
          <button onClick={()=>setPage("home")} style={{...s.btn(WH,G4,"7px 14px"),border:`1px solid ${G2}`,marginBottom:14,fontSize:12}}>← Continue Shopping</button>
          <h2 style={{fontWeight:800,fontSize:20,marginBottom:14}}>Your Cart</h2>
          {cart.length===0&&(
            <div style={{textAlign:"center",padding:60,color:G3}}>
              <div style={{fontSize:44,marginBottom:10}} className="bounce">🛒</div>
              <div style={{fontWeight:600,fontSize:15,color:G4}}>Your cart is empty</div>
              <button onClick={()=>setPage("home")} style={{...s.btn(BK,Y,"11px 24px"),marginTop:14,fontSize:13,fontWeight:700}}>Shop Now</button>
            </div>
          )}
          {cart.map(item=>(
            <div key={item.sku} style={{...s.card,display:"flex",gap:12,alignItems:"center",marginBottom:8,padding:12}} className="fade-in">
              <img src={item.img} alt="" width={56} height={56} style={{borderRadius:8,objectFit:"cover",flexShrink:0}}/>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:13}}>{item.name}</div>
                <div style={{color:G3,fontSize:11,marginTop:1}}>₹{item.price} each</div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{display:"flex",alignItems:"center",gap:6,background:G1,borderRadius:8,padding:"5px 10px"}}>
                  <button onClick={()=>changeQty(item.sku,-1)} style={{...s.btn("transparent",G4,"0 4px"),fontSize:16,fontWeight:800}}>−</button>
                  <span style={{fontWeight:700,minWidth:18,textAlign:"center"}}>{item.qty}</span>
                  <button onClick={()=>addCart(item)} style={{...s.btn("transparent",G4,"0 4px"),fontSize:16,fontWeight:800}}>+</button>
                </div>
                <span style={{fontWeight:800,fontSize:14}}>₹{item.qty*item.price}</span>
                <button onClick={()=>removeCart(item.sku)} style={{...s.btn(WH,RD,"3px 8px"),border:`1px solid #FECACA`,fontSize:14}}>✕</button>
              </div>
            </div>
          ))}
          {cart.length>0&&(
            <div style={{...s.card,marginTop:10}}>
              <div style={{fontWeight:800,fontSize:15,marginBottom:12}}>Order Summary</div>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6,fontSize:13}}><span style={{color:G3}}>Subtotal</span><span>₹{cartTotal}</span></div>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6,fontSize:13}}><span style={{color:G3}}>Delivery fee</span><span style={{color:GN,fontWeight:600}}>FREE</span></div>
              <div style={{display:"flex",justifyContent:"space-between",fontWeight:800,fontSize:17,padding:"12px 0",borderTop:`1px solid ${G2}`}}><span>Total</span><span>₹{cartTotal}</span></div>
              <div style={{background:"#F0FDF4",borderRadius:8,padding:10,marginBottom:12,fontSize:12,color:"#166534",border:"1px solid #BBF7D0"}}>
                ⚡ Delivery in ~{rand(8,14)} minutes · 📍 {geo.address}
              </div>
              <button onClick={initiateCheckout} style={{...s.btn(BK,Y,"13px 0"),width:"100%",fontSize:14,fontWeight:700}}>⚡ Proceed to Payment — ₹{cartTotal}</button>
            </div>
          )}
        </div>
      )}

      {page==="orders"&&(
        <div style={{flex:1,padding:16,maxWidth:520,margin:"0 auto",width:"100%",boxSizing:"border-box"}} className="fade-in">
          <button onClick={()=>setPage("home")} style={{...s.btn(WH,G4,"7px 14px"),border:`1px solid ${G2}`,marginBottom:14,fontSize:12}}>← Back</button>
          <h2 style={{fontWeight:800,fontSize:20,marginBottom:14}}>My Orders</h2>
          {myOrders.length===0&&(
            <div style={{textAlign:"center",padding:60,color:G3}}>
              <div style={{fontSize:44,marginBottom:10}} className="bounce">📦</div>
              <div style={{fontWeight:600,color:G4}}>No orders yet</div>
              <button onClick={()=>setPage("home")} style={{...s.btn(BK,Y,"11px 24px"),marginTop:14,fontWeight:700}}>Shop Now</button>
            </div>
          )}
          {myOrders.map(o=>(
            <div key={o.firestoreId||o.id} onClick={()=>{setTrackId(o.id);setPage("tracking");}} style={{...s.card,marginBottom:10,borderLeft:`4px solid ${SM[o.status]?.color||G2}`,cursor:"pointer",transition:"box-shadow 0.18s"}} className="fade-in"
              onMouseEnter={e=>e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,0.1)"}
              onMouseLeave={e=>e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,0.07)"}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
                <div><div style={{fontWeight:700,fontSize:14}}>{o.id}</div><div style={{color:G3,fontSize:11,marginTop:2}}>🕐 {o.time}</div></div>
                <div style={{textAlign:"right"}}>
                  <span style={{...s.pill(SM[o.status]?.color||G3),fontSize:11,padding:"4px 10px"}}>{SM[o.status]?.label}</span>
                  <div style={{fontWeight:800,fontSize:15,marginTop:5}}>₹{o.total}</div>
                </div>
              </div>
              <OrderTracker order={o}/>
              <div style={{marginTop:8,fontSize:11,color:BL,fontWeight:600}}>Tap to track →</div>
            </div>
          ))}
        </div>
      )}

      {page==="tracking"&&(()=>{
        const o=myOrders.find(x=>x.id===trackId)||myOrders[0];
        if(!o)return(<div style={{flex:1,padding:40,textAlign:"center",color:G3}}>Order not found.<button onClick={()=>setPage("home")} style={{...s.btn(BK,Y,"9px 20px"),marginLeft:10}}>Home</button></div>);
        const destPos=geo.lat?[geo.lat,geo.lng]:STORE_POS;
        return(
          <div style={{flex:1,padding:16,maxWidth:520,margin:"0 auto",width:"100%",boxSizing:"border-box"}} className="fade-in">
            <button onClick={()=>setPage("orders")} style={{...s.btn(WH,G4,"7px 14px"),border:`1px solid ${G2}`,marginBottom:14,fontSize:12}}>← My Orders</button>
            <div style={{...s.card,overflow:"hidden",padding:0}}>
              {/* Status header */}
              <div style={{background:`${SM[o.status]?.color||G2}12`,padding:28,textAlign:"center",borderBottom:`1px solid ${G2}`}}>
                <div style={{fontSize:46,marginBottom:8}} className={o.status==="out_for_delivery"?"bounce":""}>{SM[o.status]?.icon}</div>
                <div style={{fontSize:20,fontWeight:800}}>{SM[o.status]?.label}</div>
                <div style={{fontSize:13,color:G3,marginTop:4}}>{SM[o.status]?.msg}</div>
                {o.status!=="delivered"&&<div style={{marginTop:8,display:"inline-block",background:SM[o.status]?.color,color:WH,borderRadius:20,padding:"5px 14px",fontSize:12,fontWeight:600}}>ETA ~{o.eta} minutes</div>}
              </div>

              {/* LIVE MAP */}
              {(o.status==="out_for_delivery"||o.status==="delivered")&&(
                <div style={{padding:"16px 16px 0"}}>
                  <div style={{fontWeight:700,fontSize:13,marginBottom:8,color:G4}}>🗺️ Live Delivery Tracking</div>
                  <RiderMap storePOS={STORE_POS} destPOS={destPos} statusIdx={o.statusIdx}/>
                  <div style={{display:"flex",gap:12,marginTop:8,marginBottom:4,fontSize:11,color:G3}}>
                    <span>🏪 Dark Store</span>
                    <span>🛵 Rider (live)</span>
                    <span>🏠 Your location</span>
                  </div>
                </div>
              )}

              <div style={{padding:20}}>
                <OrderTracker order={o}/>
                <div style={{marginTop:14}}>
                  {(o.items||[]).map(i=>(
                    <div key={i.sku} style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:`1px solid ${G1}`,fontSize:13}}>
                      <span style={{color:G4}}>{i.emoji} {i.name} ×{i.qty}</span>
                      <span style={{fontWeight:700}}>₹{i.qty*i.price}</span>
                    </div>
                  ))}
                  <div style={{display:"flex",justifyContent:"space-between",fontWeight:800,fontSize:16,paddingTop:12}}><span>Total</span><span>₹{o.total}</span></div>
                  {o.paymentMethod&&<div style={{marginTop:6,fontSize:11,color:G3}}>Paid via {o.paymentMethod}</div>}
                </div>

                {/* Live updates */}
                <div style={{marginTop:14,background:G1,borderRadius:10,padding:12,border:`1px solid ${G2}`}}>
                  <div style={{fontWeight:700,fontSize:11,marginBottom:8,color:G4,textTransform:"uppercase",letterSpacing:"0.5px"}}>Live Updates</div>
                  {[...(o.log||[])].reverse().map((l,i)=>(
                    <div key={i} style={{display:"flex",gap:10,marginBottom:4,fontSize:12}}>
                      <span style={{color:SM[l.status]?.color,fontWeight:600,minWidth:72}}>{l.time}</span>
                      <span style={{color:G4}}>{SM[l.status]?.icon} {l.msg}</span>
                    </div>
                  ))}
                </div>

                {o.status==="delivered"&&(
                  <div style={{marginTop:14,background:"#F0FDF4",borderRadius:12,padding:18,textAlign:"center",border:"1px solid #BBF7D0"}}>
                    <div style={{fontSize:40,marginBottom:6}} className="bounce">🎉</div>
                    <div style={{fontWeight:800,color:"#166534",fontSize:16}}>Order Delivered!</div>
                    <button onClick={()=>setPage("home")} style={{...s.btn(BK,Y,"10px 26px"),marginTop:10,fontSize:13,fontWeight:700}}>Order Again</button>
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
export default function App(){
  const [authUser,setAuthUser]=useState(null);
  const [userRole,setUserRole]=useState(null);
  const [authLoading,setAuthLoading]=useState(true);

  useEffect(()=>{
    const unsub=onAuthStateChanged(auth,async(u)=>{
      if(u){
        try{
          const snap=await getDoc(doc(db,"users",u.uid));
          const role=snap.exists()?snap.data().role:"customer";
          setAuthUser(u); setUserRole(role);
        }catch{ setAuthUser(u); setUserRole("customer"); }
      }else{ setAuthUser(null); setUserRole(null); }
      setAuthLoading(false);
    });
    return unsub;
  },[]);

  const handleLogin=(user,role)=>{ setAuthUser(user); setUserRole(role); };
  const handleLogout=async()=>{ await signOut(auth); setAuthUser(null); setUserRole(null); };

  if(authLoading){
    return(
      <div style={{minHeight:"100vh",background:BK,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'Segoe UI',system-ui,sans-serif"}}>
        <div style={{background:Y,borderRadius:12,padding:"10px 28px",fontWeight:900,fontSize:28,color:BK,letterSpacing:2,marginBottom:20}} className="pulse-anim">blinkit</div>
        <div style={{color:G3,fontSize:13}} className="pulse-anim">Loading...</div>
      </div>
    );
  }

  if(!authUser) return <LoginPage onLogin={handleLogin}/>;

  return userRole==="admin"
    ? <AdminPanel user={authUser} onLogout={handleLogout}/>
    : <CustomerPanel user={authUser} onLogout={handleLogout}/>;
}