import { useState, useEffect, useRef, useCallback, useMemo } from "react";

const Y="#FFD700", D="#0a0a0a", GRAD="linear-gradient(135deg,#FFD700 0%,#FFA500 100%)";

const INIT_INV=[
  {id:1,sku:"AMU-001",name:"Amul Milk 500ml",cat:"Dairy",emoji:"🥛",price:28,cost:22,qty:120,msL:30,expiry:"2026-03-20",vendor:"Amul",desc:"Fresh full-cream milk"},
  {id:2,sku:"LAY-002",name:"Lay's Classic Salted",cat:"Snacks",emoji:"🍟",price:20,cost:14,qty:45,msL:20,expiry:"2026-08-10",vendor:"PepsiCo",desc:"Crispy potato chips"},
  {id:3,sku:"BAN-003",name:"Bananas (Dozen)",cat:"Fruits",emoji:"🍌",price:45,cost:30,qty:60,msL:15,expiry:"2026-03-15",vendor:"FreshFarm",desc:"Fresh ripe bananas"},
  {id:4,sku:"COC-004",name:"Coca-Cola 750ml",cat:"Beverages",emoji:"🥤",price:45,cost:32,qty:30,msL:25,expiry:"2026-12-01",vendor:"Coca-Cola",desc:"Ice-cold refreshing cola"},
  {id:5,sku:"SUR-005",name:"Surf Excel 1kg",cat:"Household",emoji:"🧺",price:220,cost:170,qty:35,msL:10,expiry:"2027-06-01",vendor:"HUL",desc:"Premium detergent powder"},
  {id:6,sku:"BRI-006",name:"Britannia Bread",cat:"Bakery",emoji:"🍞",price:42,cost:30,qty:18,msL:12,expiry:"2026-03-14",vendor:"Britannia",desc:"Soft sandwich bread"},
  {id:7,sku:"MAG-007",name:"Maggi 2-Min Noodles",cat:"Snacks",emoji:"🍜",price:14,cost:9,qty:200,msL:50,expiry:"2026-11-01",vendor:"Nestle",desc:"Quick 2-minute noodles"},
  {id:8,sku:"DOV-008",name:"Dove Soap 75g",cat:"Personal Care",emoji:"🧼",price:55,cost:40,qty:18,msL:20,expiry:"2028-01-01",vendor:"HUL",desc:"Moisturising beauty bar"},
  {id:9,sku:"EGG-009",name:"Eggs (12 pcs)",cat:"Dairy",emoji:"🥚",price:84,cost:65,qty:40,msL:20,expiry:"2026-03-18",vendor:"Country Eggs",desc:"Farm-fresh white eggs"},
  {id:10,sku:"ONI-010",name:"Onions 1kg",cat:"Fruits",emoji:"🧅",price:30,cost:20,qty:55,msL:15,expiry:"2026-03-22",vendor:"FreshFarm",desc:"Fresh red onions"},
  {id:11,sku:"TOM-011",name:"Tomatoes 500g",cat:"Fruits",emoji:"🍅",price:25,cost:15,qty:12,msL:15,expiry:"2026-03-13",vendor:"FreshFarm",desc:"Vine-ripened tomatoes"},
  {id:12,sku:"YOG-012",name:"Amul Curd 400g",cat:"Dairy",emoji:"🍶",price:40,cost:30,qty:22,msL:20,expiry:"2026-03-16",vendor:"Amul",desc:"Thick & creamy curd"},
  {id:13,sku:"RIC-013",name:"Basmati Rice 1kg",cat:"Household",emoji:"🍚",price:99,cost:72,qty:80,msL:15,expiry:"2027-01-01",vendor:"India Gate",desc:"Long-grain premium rice"},
  {id:14,sku:"CHA-014",name:"Haldiram's Bhujia",cat:"Snacks",emoji:"🫘",price:60,cost:42,qty:50,msL:20,expiry:"2026-09-01",vendor:"Haldiram's",desc:"Crunchy sev bhujia"},
  {id:15,sku:"COF-015",name:"Nescafé Classic 50g",cat:"Beverages",emoji:"☕",price:135,cost:95,qty:25,msL:10,expiry:"2027-06-01",vendor:"Nestle",desc:"Rich instant coffee"},
];

const CUSTOMERS=["Rahul Sharma","Priya Mehta","Ankit Rao","Sneha Gupta","Vikram Singh","Neha Joshi","Arjun Nair","Kavya Reddy","Rohan Das","Pooja Iyer"];
const AREAS=["Saket","Lajpat Nagar","Green Park","Hauz Khas","Malviya Nagar","Vasant Kunj","Defence Colony","South Ex"];
const STATUS_FLOW=["placed","confirmed","picking","packed","out_for_delivery","delivered"];
const SM={
  placed:      {label:"Order Placed",  color:"#818cf8",icon:"📱",msg:"Your order has been placed!"},
  confirmed:   {label:"Confirmed",     color:"#fbbf24",icon:"✅",msg:"Store confirmed your order"},
  picking:     {label:"Picking Items", color:"#38bdf8",icon:"🧺",msg:"Picker collecting your items"},
  packed:      {label:"Packed",        color:"#c084fc",icon:"📦",msg:"Order packed & ready"},
  out_for_delivery:{label:"On the Way",color:"#fb923c",icon:"🛵",msg:"Delivery partner on the way!"},
  delivered:   {label:"Delivered",     color:"#4ade80",icon:"🎉",msg:"Order delivered. Enjoy!"},
};
const CATS=["All","Dairy","Snacks","Fruits","Beverages","Household","Bakery","Personal Care"];

const rand=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const pick=arr=>arr[rand(0,arr.length-1)];
const ts=()=>new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",second:"2-digit"});
let oidSeq=200;

function useSharedStore(){
  const [inv,setInv]=useState(INIT_INV);
  const [orders,setOrders]=useState([]);
  const [movements,setMovements]=useState([]);
  const [notifications,setNotifications]=useState([]);
  const [adminToast,setAdminToast]=useState(null);
  const [custToast,setCustToast]=useState(null);

  const pushNotif=useCallback((msg,type="info",target="both")=>{
    const n={id:Date.now()+Math.random(),msg,type,time:ts()};
    setNotifications(p=>[n,...p].slice(0,100));
    if(target==="admin"||target==="both"){setAdminToast(n);setTimeout(()=>setAdminToast(null),3200);}
    if(target==="cust"||target==="both"){setCustToast(n);setTimeout(()=>setCustToast(null),3200);}
  },[]);

  const logMove=useCallback((sku,name,type,qty,note)=>{
    setMovements(p=>[{id:Date.now()+Math.random(),sku,name,type,qty,note,time:ts()},...p].slice(0,200));
  },[]);

  const deductStock=useCallback((items,orderId)=>{
    setInv(p=>p.map(inv=>{const it=items.find(i=>i.sku===inv.sku);if(!it)return inv;return{...inv,qty:Math.max(0,inv.qty-it.qty)};}));
    items.forEach(i=>logMove(i.sku,i.name,"OUT",i.qty,"Order "+orderId));
  },[logMove]);

  const advanceOrder=useCallback((orderId,isCustomer=false)=>{
    setOrders(prev=>{
      const o=prev.find(x=>x.id===orderId);
      if(!o||o.statusIdx>=STATUS_FLOW.length-1)return prev;
      const next=o.statusIdx+1,ns=STATUS_FLOW[next];
      const newLog=[...o.log,{status:ns,time:ts(),msg:SM[ns].msg}];
      if(ns==="delivered"){deductStock(o.items,orderId);pushNotif(`🎉 Order ${orderId} delivered to ${o.customer}!`,"success",isCustomer?"both":"admin");}
      else if(isCustomer||o.isCustomer)pushNotif(`${SM[ns].icon} Your order ${orderId}: ${SM[ns].msg}`,"info","cust");
      else pushNotif(`${SM[ns].icon} ${orderId} → ${SM[ns].label}`,"info","admin");
      return prev.map(x=>x.id===orderId?{...x,status:ns,statusIdx:next,log:newLog}:x);
    });
  },[deductStock,pushNotif]);

  const placeOrder=useCallback((items,customer,area,isCustomer=false)=>{
    const o={id:`ORD-${++oidSeq}`,customer,area,items,total:items.reduce((a,i)=>a+i.qty*i.price,0),status:"placed",statusIdx:0,isCustomer,time:ts(),eta:rand(8,15),log:[{status:"placed",time:ts(),msg:SM.placed.msg}]};
    setOrders(p=>[o,...p].slice(0,80));
    pushNotif(`📱 New order ${o.id} from ${o.customer} (${o.area}) — ₹${o.total}`,"order","admin");
    if(isCustomer)pushNotif(`✅ Order ${o.id} placed! ETA ~${o.eta} mins`,"success","cust");
    let d=rand(2500,4000);
    STATUS_FLOW.slice(1).forEach(()=>{const sd=d+rand(2000,5000);d=sd;setTimeout(()=>advanceOrder(o.id,isCustomer),sd);});
    return o;
  },[advanceOrder,pushNotif]);

  return{inv,setInv,orders,setOrders,movements,notifications,adminToast,custToast,pushNotif,logMove,placeOrder,advanceOrder,deductStock};
}

const glow=(color)=>({boxShadow:`0 0 20px ${color}40,0 4px 24px rgba(0,0,0,0.4)`});

const Toast=({t,right=20})=>t?(
  <div style={{position:"fixed",top:20,right,zIndex:9999,background:t.type==="danger"?"linear-gradient(135deg,#ef4444,#dc2626)":t.type==="success"?"linear-gradient(135deg,#22c55e,#16a34a)":t.type==="order"?"linear-gradient(135deg,#6366f1,#4f46e5)":t.type==="warn"?"linear-gradient(135deg,#f59e0b,#d97706)":"linear-gradient(135deg,#334155,#1e293b)",color:"#fff",padding:"14px 20px",borderRadius:14,fontWeight:600,fontSize:13,maxWidth:310,boxShadow:"0 12px 40px rgba(0,0,0,0.5)",borderLeft:"4px solid rgba(255,255,255,0.3)"}}>
    {t.msg}
  </div>
):null;

const OrderTracker=({order,dark})=>(
  <div>
    <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
      {STATUS_FLOW.map((s,i)=>{
        const done=i<=order.statusIdx,curr=i===order.statusIdx;
        return(
          <div key={s} style={{display:"flex",flexDirection:"column",alignItems:"center",flex:1}}>
            <div style={{width:30,height:30,borderRadius:"50%",background:done?SM[s].color:dark?"#1e293b":"#f1f5f9",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,border:curr?`2.5px solid ${Y}`:"2.5px solid transparent",...(curr?glow(SM[s].color):{transition:"all 0.4s"}),color:done?"#fff":dark?"#334155":"#cbd5e1",fontWeight:800}}>
              {curr?SM[s].icon:done?"✓":"·"}
            </div>
            <div style={{fontSize:8,color:done?(dark?"#94a3b8":"#64748b"):(dark?"#334155":"#cbd5e1"),marginTop:4,textAlign:"center",maxWidth:44,lineHeight:1.3,fontWeight:done?700:400}}>{SM[s].label}</div>
          </div>
        );
      })}
    </div>
    <div style={{height:5,background:dark?"#1e293b":"#e2e8f0",borderRadius:10,overflow:"hidden"}}>
      <div style={{height:"100%",background:GRAD,width:`${(order.statusIdx/(STATUS_FLOW.length-1))*100}%`,transition:"width 0.8s cubic-bezier(0.4,0,0.2,1)",borderRadius:10,boxShadow:"0 0 10px #FFD70060"}}/>
    </div>
  </div>
);

function AdminPanel({store}){
  const{inv,setInv,orders,movements,notifications,adminToast,pushNotif,logMove,placeOrder}=store;
  const[tab,setTab]=useState("live");
  const[aTab,setATab]=useState("overview");
  const[liveOn,setLiveOn]=useState(true);
  const[selOrder,setSelOrder]=useState(null);
  const[invSearch,setInvSearch]=useState("");
  const[showForm,setShowForm]=useState(false);
  const[editId,setEditId]=useState(null);
  const[form,setForm]=useState({});
  const[stockMod,setStockMod]=useState(null);
  const[sAdj,setSAdj]=useState({type:"IN",qty:"",note:""});
  const liveRef=useRef();

  const active=orders.filter(o=>o.status!=="delivered");
  const delivered=orders.filter(o=>o.status==="delivered");
  const revenue=delivered.reduce((a,o)=>a+o.total,0);
  const outOfStock=inv.filter(i=>i.qty===0);
  const lowStock=inv.filter(i=>i.qty>0&&i.qty<=i.msL);

  useEffect(()=>{
    if(!liveOn)return;
    liveRef.current=setInterval(()=>{
      setInv(cur=>{
        const avail=cur.filter(i=>i.qty>0);
        if(!avail.length)return cur;
        const n=rand(1,Math.min(4,avail.length));
        const items=[...avail].sort(()=>Math.random()-0.5).slice(0,n).map(p=>({sku:p.sku,name:p.name,emoji:p.emoji,qty:rand(1,Math.min(3,p.qty)),price:p.price}));
        placeOrder(items,pick(CUSTOMERS),pick(AREAS),false);
        return cur;
      });
    },rand(5000,9000));
    return()=>clearInterval(liveRef.current);
  },[liveOn,placeOrder,setInv]);

  const saveInv=()=>{
    if(!form.name||!form.sku||!form.price||!form.qty){pushNotif("Fill required fields","danger","admin");return;}
    const e={...form,price:+form.price,cost:+form.cost,qty:+form.qty,msL:+form.msL};
    if(editId)setInv(p=>p.map(i=>i.id===editId?{...i,...e}:i));
    else setInv(p=>[...p,{...e,id:Date.now()}]);
    pushNotif(editId?"Product updated!":"Product added!","success","admin");
    setShowForm(false);setEditId(null);
  };

  const adjStock=()=>{
    if(!sAdj.qty||+sAdj.qty<=0){pushNotif("Enter valid qty","danger","admin");return;}
    const q=+sAdj.qty;
    setInv(p=>p.map(i=>i.id!==stockMod.id?i:{...i,qty:sAdj.type==="IN"?i.qty+q:Math.max(0,i.qty-q)}));
    logMove(stockMod.sku,stockMod.name,sAdj.type,q,sAdj.note||"-");
    pushNotif(`Stock ${sAdj.type} for ${stockMod.name}`,"success","admin");
    setStockMod(null);
  };

  const navs=[{id:"live",icon:"🔴",label:"Live Orders",badge:active.length},{id:"inventory",icon:"📦",label:"Inventory",badge:outOfStock.length+lowStock.length},{id:"admin",icon:"🛡️",label:"Admin",badge:0},{id:"log",icon:"📋",label:"Log",badge:0}];

  const inp={width:"100%",padding:"10px 14px",borderRadius:10,border:"1px solid #1e293b",background:"#0f172a",color:"#e2e8f0",fontSize:13,outline:"none",boxSizing:"border-box"};
  const card={background:"linear-gradient(145deg,#0f172a,#1e293b)",borderRadius:16,padding:20,border:"1px solid #1e293b",boxShadow:"0 4px 24px rgba(0,0,0,0.3)"};
  const th={background:"#0f172a",color:Y,padding:"11px 14px",fontSize:12,fontWeight:700,textAlign:"left",borderBottom:"1px solid #1e293b"};
  const td={padding:"11px 14px",fontSize:13,color:"#94a3b8",borderBottom:"1px solid #0f172a"};
  const pill=(bg,fg="#fff")=>({display:"inline-block",background:bg,color:fg,borderRadius:20,padding:"3px 10px",fontSize:11,fontWeight:700});
  const btn=(bg,fg="#fff",p="8px 16px")=>({cursor:"pointer",border:"none",borderRadius:10,padding:p,fontWeight:700,fontSize:13,background:bg,color:fg,transition:"all 0.2s"});

  return(
  <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#020817 0%,#0a0f1e 50%,#020817 100%)",fontFamily:"'Segoe UI',sans-serif",color:"#e2e8f0",display:"flex",flexDirection:"column"}}>
    <Toast t={adminToast} right={20}/>
    <div style={{background:"rgba(15,23,42,0.95)",backdropFilter:"blur(20px)",borderBottom:"1px solid #1e293b",padding:"0 24px",display:"flex",alignItems:"center",justifyContent:"space-between",height:60,flexShrink:0,position:"sticky",top:0,zIndex:50}}>
      <div style={{display:"flex",alignItems:"center",gap:16}}>
        <div style={{background:GRAD,borderRadius:10,padding:"6px 14px",fontWeight:900,fontSize:18,color:D,letterSpacing:2,...glow(Y)}}>BLINKIT</div>
        <div style={{color:"#334155",fontSize:11,fontWeight:700,letterSpacing:2}}>ADMIN · DARK STORE DELHI-01</div>
        <div style={{display:"flex",alignItems:"center",gap:6,background:"rgba(34,197,94,0.1)",borderRadius:20,padding:"4px 10px",border:"1px solid rgba(34,197,94,0.2)"}}>
          <div style={{width:7,height:7,borderRadius:"50%",background:liveOn?"#22c55e":"#ef4444",boxShadow:liveOn?"0 0 8px #22c55e":"0 0 8px #ef4444"}}/>
          <span style={{fontSize:11,color:liveOn?"#22c55e":"#ef4444",fontWeight:700}}>{liveOn?"LIVE":"PAUSED"}</span>
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <div style={{fontSize:12,color:"#475569"}}>{orders.length} orders · <span style={{color:Y,fontWeight:700}}>₹{revenue.toLocaleString()}</span></div>
        <button onClick={()=>setLiveOn(p=>!p)} style={{...btn(liveOn?"linear-gradient(135deg,#ef4444,#dc2626)":"linear-gradient(135deg,#22c55e,#16a34a)","#fff","7px 16px"),fontSize:12}}>{liveOn?"⏸ Pause":"▶ Resume"}</button>
      </div>
    </div>
    <div style={{background:"rgba(10,18,32,0.8)",borderBottom:"1px solid #1e293b",padding:"0 24px",display:"flex",gap:4}}>
      {navs.map(n=>(
        <button key={n.id} onClick={()=>setTab(n.id)} style={{...btn(tab===n.id?"rgba(255,215,0,0.08)":"transparent",tab===n.id?Y:"#475569","12px 18px"),borderBottom:tab===n.id?`2px solid ${Y}`:"2px solid transparent",borderRadius:0,fontSize:13}}>
          {n.icon} {n.label}
          {n.badge>0&&<span style={{...pill("#ef4444"),fontSize:9,padding:"1px 6px",marginLeft:5}}>{n.badge}</span>}
        </button>
      ))}
    </div>

    <div style={{flex:1,padding:24,overflowY:"auto"}}>
      {tab==="live"&&(
        <div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:24}}>
            {[{l:"Active",v:active.length,c:"#fbbf24",i:"🔴"},{l:"Delivered",v:delivered.length,c:"#4ade80",i:"✅"},{l:"Revenue",v:`₹${revenue.toLocaleString()}`,c:Y,i:"💰"},{l:"Alerts",v:outOfStock.length+lowStock.length,c:"#f87171",i:"🚨"}].map(k=>(
              <div key={k.l} style={{...card,borderTop:`3px solid ${k.c}`}}>
                <div style={{fontSize:22,marginBottom:6}}>{k.i}</div>
                <div style={{fontSize:28,fontWeight:900,color:k.c}}>{k.v}</div>
                <div style={{fontSize:11,color:"#475569",marginTop:2,textTransform:"uppercase",letterSpacing:1}}>{k.l}</div>
              </div>
            ))}
          </div>
          {orders.length===0&&<div style={{...card,textAlign:"center",padding:80,color:"#334155"}}><div style={{fontSize:56,marginBottom:16}}>⏳</div><div style={{fontSize:18,fontWeight:700}}>Waiting for live orders...</div></div>}
          <div style={{display:"grid",gap:14}}>
            {orders.map(o=>(
              <div key={o.id} onClick={()=>setSelOrder(o)} style={{...card,borderLeft:`4px solid ${SM[o.status].color}`,cursor:"pointer",transition:"all 0.2s"}}
                onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";}}
                onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                  <div>
                    <span style={{fontWeight:900,fontSize:14,color:"#f1f5f9"}}>{o.id}</span>
                    <span style={{color:"#475569",fontSize:12,marginLeft:8}}>{o.customer} · {o.area}</span>
                    {o.isCustomer&&<span style={{...pill("linear-gradient(135deg,#6366f1,#4f46e5)"),marginLeft:8,fontSize:9}}>CUSTOMER</span>}
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:12}}>
                    <span style={{...pill(SM[o.status].color),padding:"5px 14px"}}>{SM[o.status].icon} {SM[o.status].label}</span>
                    <span style={{fontWeight:900,color:"#4ade80",fontSize:16}}>₹{o.total}</span>
                  </div>
                </div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
                  {o.items.map(i=><span key={i.sku} style={{background:"rgba(255,255,255,0.04)",border:"1px solid #1e293b",borderRadius:8,padding:"4px 10px",fontSize:11,color:"#94a3b8"}}>{i.emoji} {i.name} ×{i.qty}</span>)}
                </div>
                <OrderTracker order={o} dark/>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab==="inventory"&&(
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
            <div>
              <h2 style={{fontSize:20,fontWeight:900,background:GRAD,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>📦 Inventory</h2>
              <p style={{color:"#475569",fontSize:12,marginTop:2}}>{inv.length} SKUs · <span style={{color:"#f87171"}}>{outOfStock.length} out</span> · <span style={{color:"#fbbf24"}}>{lowStock.length} low</span></p>
            </div>
            <button onClick={()=>{setForm({name:"",sku:"",cat:"Dairy",emoji:"📦",price:"",cost:"",qty:"",msL:"",expiry:"",vendor:"",desc:""});setEditId(null);setShowForm(true);}} style={{...btn(GRAD,D,"10px 20px"),...glow(Y)}}>+ Add Product</button>
          </div>
          <input placeholder="🔍 Search..." value={invSearch} onChange={e=>setInvSearch(e.target.value)} style={{...inp,maxWidth:300,marginBottom:16}}/>
          <div style={{background:"linear-gradient(145deg,#0f172a,#1e293b)",borderRadius:16,overflow:"hidden",border:"1px solid #1e293b"}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr>{["","SKU","Name","Cat","Stock","MSL","MRP","Expiry","Actions"].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
              <tbody>
                {inv.filter(i=>i.name.toLowerCase().includes(invSearch.toLowerCase())||i.sku.toLowerCase().includes(invSearch.toLowerCase())).map((item,idx)=>{
                  const st=item.qty===0?"out":item.qty<=item.msL?"low":"ok";
                  const ew=item.expiry&&item.expiry<=new Date(Date.now()+3*864e5).toISOString().slice(0,10);
                  return(
                    <tr key={item.id} style={{background:idx%2===0?"transparent":"rgba(255,255,255,0.01)"}}>
                      <td style={{...td,fontSize:22,textAlign:"center"}}>{item.emoji}</td>
                      <td style={td}><code style={{background:"#0f172a",padding:"2px 8px",borderRadius:6,fontSize:10,color:Y,border:"1px solid #1e293b"}}>{item.sku}</code></td>
                      <td style={{...td,fontWeight:600,color:"#e2e8f0"}}>{item.name}</td>
                      <td style={td}><span style={{...pill("rgba(255,255,255,0.05)","#64748b"),fontSize:10,border:"1px solid #1e293b"}}>{item.cat}</span></td>
                      <td style={td}>
                        <span style={{fontWeight:900,fontSize:16,color:st==="out"?"#f87171":st==="low"?"#fbbf24":"#4ade80"}}>{item.qty}</span>
                        {st==="out"&&<span style={{...pill("linear-gradient(135deg,#ef4444,#dc2626)"),marginLeft:6,fontSize:9}}>OUT</span>}
                        {st==="low"&&<span style={{...pill("linear-gradient(135deg,#f59e0b,#d97706)","#000"),marginLeft:6,fontSize:9}}>LOW</span>}
                      </td>
                      <td style={{...td,color:"#334155"}}>{item.msL}</td>
                      <td style={{...td,color:Y,fontWeight:700}}>₹{item.price}</td>
                      <td style={{...td,color:ew?"#f87171":"#475569",fontWeight:ew?700:400,fontSize:11}}>{item.expiry||"—"}{ew&&" ⚠️"}</td>
                      <td style={td}>
                        <div style={{display:"flex",gap:5}}>
                          <button onClick={()=>{setStockMod(item);setSAdj({type:"IN",qty:"",note:""});}} style={{...btn("linear-gradient(135deg,#22c55e,#16a34a)","#fff","5px 10px"),fontSize:11}}>Stock</button>
                          <button onClick={()=>{setForm({...item,price:String(item.price),cost:String(item.cost),qty:String(item.qty),msL:String(item.msL)});setEditId(item.id);setShowForm(true);}} style={{...btn("linear-gradient(135deg,#3b82f6,#2563eb)","#fff","5px 10px"),fontSize:11}}>Edit</button>
                          <button onClick={()=>{if(window.confirm("Delete?"))setInv(p=>p.filter(i=>i.id!==item.id));}} style={{...btn("linear-gradient(135deg,#ef4444,#dc2626)","#fff","5px 10px"),fontSize:11}}>Del</button>
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

      {tab==="admin"&&(
        <div>
          <h2 style={{fontSize:20,fontWeight:900,background:GRAD,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:18}}>🛡️ Admin Panel</h2>
          <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
            {["overview","alerts","replenishment","staff"].map(t=>(
              <button key={t} onClick={()=>setATab(t)} style={{...btn(aTab===t?GRAD:"rgba(255,255,255,0.04)",aTab===t?D:"#475569","9px 20px"),textTransform:"capitalize",border:aTab===t?"none":"1px solid #1e293b",...(aTab===t?glow(Y):{})}}>{t}</button>
            ))}
          </div>
          {aTab==="overview"&&(
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
              <div style={card}>
                <div style={{fontWeight:800,marginBottom:14,color:Y,fontSize:15}}>📊 Inventory Health</div>
                {[{l:"Healthy",v:inv.filter(i=>i.qty>i.msL).length,c:"#4ade80"},{l:"Low Stock",v:lowStock.length,c:"#fbbf24"},{l:"Out of Stock",v:outOfStock.length,c:"#f87171"}].map(r=>(
                  <div key={r.l} style={{marginBottom:14}}>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:5}}><span style={{color:"#64748b"}}>{r.l}</span><span style={{color:r.c,fontWeight:800}}>{r.v}</span></div>
                    <div style={{background:"#0f172a",borderRadius:10,height:8}}><div style={{background:r.c,width:`${(r.v/inv.length)*100}%`,height:8,borderRadius:10,transition:"width 0.5s"}}/></div>
                  </div>
                ))}
              </div>
              <div style={card}>
                <div style={{fontWeight:800,marginBottom:14,color:Y,fontSize:15}}>💰 Financials</div>
                {[{l:"Inventory Cost",v:`₹${inv.reduce((a,i)=>a+i.qty*i.cost,0).toLocaleString()}`,c:"#818cf8"},{l:"Revenue Potential",v:`₹${inv.reduce((a,i)=>a+i.qty*i.price,0).toLocaleString()}`,c:"#4ade80"},{l:"Today's Revenue",v:`₹${revenue.toLocaleString()}`,c:Y}].map(r=>(
                  <div key={r.l} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid #0f172a",fontSize:13}}>
                    <span style={{color:"#475569"}}>{r.l}</span><span style={{fontWeight:900,color:r.c}}>{r.v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {aTab==="alerts"&&(
            <div>
              {outOfStock.length===0&&lowStock.length===0&&<div style={{...card,textAlign:"center",color:"#475569",padding:50}}><div style={{fontSize:40,marginBottom:10}}>✅</div>All stock levels healthy!</div>}
              {[...outOfStock.map(i=>({...i,_t:"out"})),...lowStock.map(i=>({...i,_t:"low"}))].map(i=>(
                <div key={i.id} style={{...card,borderLeft:`4px solid ${i._t==="out"?"#f87171":"#fbbf24"}`,marginBottom:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={{fontSize:13}}><span style={{fontSize:22,marginRight:10}}>{i.emoji}</span>
                    <strong style={{color:i._t==="out"?"#f87171":"#fbbf24"}}>{i._t==="out"?"OUT OF STOCK":"LOW STOCK"}</strong> — {i.name}
                    <span style={{color:"#475569",marginLeft:8}}>({i.qty} units)</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          {aTab==="replenishment"&&(
            <div>
              <div style={{...card,marginBottom:14,borderLeft:"4px solid #4ade80",display:"flex",gap:12,alignItems:"center"}}>
                <span style={{fontSize:24}}>🤖</span><span style={{fontSize:13,color:"#64748b"}}>Auto-replenishment <strong style={{color:"#4ade80"}}>ACTIVE</strong></span>
              </div>
              {[...outOfStock,...lowStock].map(item=>(
                <div key={item.id} style={{...card,display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <div style={{fontSize:13,color:"#94a3b8"}}>{item.emoji} <strong style={{color:"#e2e8f0"}}>{item.name}</strong> — needs <span style={{color:Y,fontWeight:800}}>{Math.max(0,item.msL*3-item.qty)}</span> units from {item.vendor}</div>
                  <span style={{...pill("linear-gradient(135deg,#22c55e,#16a34a)"),fontSize:10}}>✅ PO Sent</span>
                </div>
              ))}
              {[...outOfStock,...lowStock].length===0&&<div style={{...card,textAlign:"center",color:"#475569",padding:40}}>No replenishment needed</div>}
            </div>
          )}
          {aTab==="staff"&&(
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>
              {[{n:"Ravi Kumar",r:"Manager",s:"active",t:12,em:"👨‍💼"},{n:"Suresh M.",r:"Picker",s:"active",t:34,em:"🧺"},{n:"Amit Singh",r:"Picker",s:"active",t:28,em:"🧺"},{n:"Priya D.",r:"Packer",s:"active",t:31,em:"📦"},{n:"Rohit S.",r:"Delivery",s:"active",t:18,em:"🛵"},{n:"Neha B.",r:"QC",s:"break",t:15,em:"🔍"}].map(s=>(
                <div key={s.n} style={{...card,textAlign:"center",borderTop:`3px solid ${s.s==="active"?"#4ade80":"#fbbf24"}`}}>
                  <div style={{fontSize:36,marginBottom:8}}>{s.em}</div>
                  <div style={{fontWeight:800,fontSize:14,color:"#f1f5f9"}}>{s.n}</div>
                  <div style={{color:"#475569",fontSize:11,marginBottom:8}}>{s.r}</div>
                  <span style={{...pill(s.s==="active"?"linear-gradient(135deg,#22c55e,#16a34a)":"linear-gradient(135deg,#f59e0b,#d97706)",s.s==="active"?"#fff":"#000"),fontSize:10}}>{s.s.toUpperCase()}</span>
                  <div style={{marginTop:10,fontSize:12,color:Y,fontWeight:800}}>{s.t} tasks</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab==="log"&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          <div>
            <div style={{fontWeight:800,marginBottom:12,color:Y}}>📡 Notifications</div>
            <div style={{maxHeight:500,overflowY:"auto",display:"grid",gap:6}}>
              {notifications.length===0&&<div style={{...card,textAlign:"center",color:"#475569",padding:30}}>No notifications yet</div>}
              {notifications.map(n=>(
                <div key={n.id} style={{...card,padding:"8px 12px",borderLeft:`3px solid ${n.type==="danger"?"#f87171":n.type==="success"?"#4ade80":n.type==="order"?"#818cf8":"#fbbf24"}`,display:"flex",justifyContent:"space-between",gap:8}}>
                  <span style={{fontSize:12,color:"#94a3b8"}}>{n.msg}</span>
                  <span style={{fontSize:10,color:"#334155",whiteSpace:"nowrap"}}>{n.time}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div style={{fontWeight:800,marginBottom:12,color:Y}}>🔄 Stock Movements</div>
            <div style={{background:"linear-gradient(145deg,#0f172a,#1e293b)",borderRadius:14,overflow:"hidden",maxHeight:530,overflowY:"auto",border:"1px solid #1e293b"}}>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead><tr>{["Time","SKU","Type","Qty","Note"].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
                <tbody>
                  {movements.length===0&&<tr><td colSpan={5} style={{...td,textAlign:"center",color:"#334155",padding:30}}>No movements yet</td></tr>}
                  {movements.map((m,i)=>(
                    <tr key={m.id} style={{background:i%2===0?"transparent":"rgba(255,255,255,0.01)"}}>
                      <td style={{...td,color:"#334155",fontSize:11}}>{m.time}</td>
                      <td style={td}><code style={{background:"#0f172a",padding:"1px 5px",borderRadius:4,fontSize:10,color:Y}}>{m.sku}</code></td>
                      <td style={td}><span style={{...pill(m.type==="IN"?"linear-gradient(135deg,#22c55e,#16a34a)":m.type==="OUT"?"linear-gradient(135deg,#ef4444,#dc2626)":"linear-gradient(135deg,#f59e0b,#d97706)",m.type==="IN"?"#fff":m.type==="OUT"?"#fff":"#000"),fontSize:9}}>{m.type}</span></td>
                      <td style={{...td,fontWeight:800,color:m.type==="IN"?"#4ade80":"#f87171"}}>{m.type==="IN"?"+":"-"}{m.qty}</td>
                      <td style={{...td,color:"#475569",fontSize:11}}>{m.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>

    {selOrder&&(()=>{
      const live=orders.find(o=>o.id===selOrder.id)||selOrder;
      return(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:300,padding:16,backdropFilter:"blur(8px)"}} onClick={e=>{if(e.target===e.currentTarget)setSelOrder(null)}}>
          <div style={{background:"linear-gradient(145deg,#0f172a,#1e293b)",borderRadius:20,padding:28,width:"100%",maxWidth:520,maxHeight:"90vh",overflowY:"auto",border:"1px solid #334155"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
              <div><div style={{fontWeight:900,fontSize:18,color:"#f1f5f9"}}>{live.id}</div>
              <div style={{color:"#475569",fontSize:12,marginTop:3}}>{live.customer} · {live.area} · {live.time}</div></div>
              <button onClick={()=>setSelOrder(null)} style={{cursor:"pointer",border:"1px solid #1e293b",background:"rgba(255,255,255,0.04)",color:"#94a3b8",borderRadius:8,padding:"4px 12px",fontSize:13}}>✕</button>
            </div>
            <OrderTracker order={live} dark/>
            <div style={{marginTop:16}}>
              {live.items.map(i=>(
                <div key={i.sku} style={{display:"flex",justifyContent:"space-between",background:"rgba(255,255,255,0.03)",borderRadius:10,padding:"10px 14px",marginBottom:8,fontSize:13,border:"1px solid #1e293b"}}>
                  <span style={{color:"#94a3b8"}}>{i.emoji} {i.name} ×{i.qty}</span><span style={{color:Y,fontWeight:800}}>₹{i.qty*i.price}</span>
                </div>
              ))}
              <div style={{display:"flex",justifyContent:"space-between",fontWeight:900,fontSize:16,padding:"12px 0",borderTop:"1px solid #1e293b"}}>
                <span style={{color:"#64748b"}}>Total</span><span style={{color:"#4ade80"}}>₹{live.total}</span>
              </div>
            </div>
          </div>
        </div>
      );
    })()}

    {showForm&&(
      <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:300,padding:16,backdropFilter:"blur(8px)"}} onClick={e=>{if(e.target===e.currentTarget)setShowForm(false)}}>
        <div style={{background:"linear-gradient(145deg,#0f172a,#1e293b)",borderRadius:20,padding:28,width:"100%",maxWidth:480,maxHeight:"90vh",overflowY:"auto",border:"1px solid #334155"}}>
          <h3 style={{marginBottom:20,fontWeight:900,background:GRAD,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",fontSize:18}}>{editId?"✏️ Edit":"➕ Add"} Product</h3>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            {[{l:"Name *",k:"name",t:"text",f:true},{l:"SKU *",k:"sku",t:"text"},{l:"Emoji",k:"emoji",t:"text"},{l:"MRP ₹ *",k:"price",t:"number"},{l:"Cost ₹",k:"cost",t:"number"},{l:"Stock *",k:"qty",t:"number"},{l:"Min Level",k:"msL",t:"number"},{l:"Expiry",k:"expiry",t:"date"},{l:"Vendor",k:"vendor",t:"text",f:true}].map(f=>(
              <div key={f.k} style={{gridColumn:f.f?"span 2":"span 1"}}>
                <label style={{fontSize:11,color:"#475569",display:"block",marginBottom:5,fontWeight:700,textTransform:"uppercase"}}>{f.l}</label>
                <input type={f.t} value={form[f.k]||""} onChange={e=>setForm(p=>({...p,[f.k]:e.target.value}))} style={inp}/>
              </div>
            ))}
            <div style={{gridColumn:"span 2"}}>
              <label style={{fontSize:11,color:"#475569",display:"block",marginBottom:5,fontWeight:700,textTransform:"uppercase"}}>Category</label>
              <select value={form.cat||"Dairy"} onChange={e=>setForm(p=>({...p,cat:e.target.value}))} style={{...inp,background:"#0f172a"}}>
                {CATS.slice(1).map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div style={{display:"flex",gap:10,marginTop:20}}>
            <button onClick={saveInv} style={{...btn(GRAD,D,"12px 0"),...glow(Y),flex:1,fontSize:14}}>{editId?"Save":"Add"}</button>
            <button onClick={()=>setShowForm(false)} style={{...btn("rgba(255,255,255,0.05)","#64748b","12px 0"),border:"1px solid #1e293b",flex:1,fontSize:14}}>Cancel</button>
          </div>
        </div>
      </div>
    )}

    {stockMod&&(
      <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:300,padding:16,backdropFilter:"blur(8px)"}} onClick={e=>{if(e.target===e.currentTarget)setStockMod(null)}}>
        <div style={{background:"linear-gradient(145deg,#0f172a,#1e293b)",borderRadius:20,padding:28,width:"100%",maxWidth:380,border:"1px solid #334155"}}>
          <h3 style={{marginBottom:6,fontWeight:900,color:"#f1f5f9",fontSize:17}}>📦 Adjust Stock</h3>
          <p style={{color:"#475569",fontSize:12,marginBottom:18}}>{stockMod.emoji} {stockMod.name} · Current: <strong style={{color:Y}}>{stockMod.qty}</strong></p>
          <div style={{display:"flex",gap:8,marginBottom:14}}>
            {[["IN","linear-gradient(135deg,#22c55e,#16a34a)","#fff"],["OUT","linear-gradient(135deg,#ef4444,#dc2626)","#fff"],["DAMAGE","linear-gradient(135deg,#f59e0b,#d97706)","#000"]].map(([t,bg,fg])=>(
              <button key={t} onClick={()=>setSAdj(p=>({...p,type:t}))} style={{...btn(sAdj.type===t?bg:"rgba(255,255,255,0.04)",sAdj.type===t?fg:"#475569","10px 0"),flex:1,border:sAdj.type===t?"none":"1px solid #1e293b"}}>{t}</button>
            ))}
          </div>
          <input type="number" min="1" value={sAdj.qty} onChange={e=>setSAdj(p=>({...p,qty:e.target.value}))} placeholder="Quantity" style={{...inp,marginBottom:10}}/>
          <input value={sAdj.note} onChange={e=>setSAdj(p=>({...p,note:e.target.value}))} placeholder="Reason..." style={{...inp,marginBottom:18}}/>
          <div style={{display:"flex",gap:8}}>
            <button onClick={adjStock} style={{...btn(sAdj.type==="IN"?"linear-gradient(135deg,#22c55e,#16a34a)":sAdj.type==="OUT"?"linear-gradient(135deg,#ef4444,#dc2626)":"linear-gradient(135deg,#f59e0b,#d97706)",sAdj.type==="IN"?"#fff":sAdj.type==="OUT"?"#fff":"#000","12px 0"),flex:1,fontSize:14}}>Confirm</button>
            <button onClick={()=>setStockMod(null)} style={{...btn("rgba(255,255,255,0.04)","#64748b","12px 0"),border:"1px solid #1e293b",flex:1,fontSize:14}}>Cancel</button>
          </div>
        </div>
      </div>
    )}
  </div>
  );
}

function CustomerPanel({store}){
  const{inv,orders,custToast,placeOrder}=store;
  const[page,setPage]=useState("home");
  const[cat,setCat]=useState("All");
  const[search,setSearch]=useState("");
  const[cart,setCart]=useState([]);
  const[selProd,setSelProd]=useState(null);
  const[myOrders,setMyOrders]=useState([]);
  const[trackId,setTrackId]=useState(null);
  const custName="You (Customer)";
  const addr="42, Green Park Extension, New Delhi – 110016";

  const liveMyOrders=useMemo(()=>orders.filter(o=>myOrders.includes(o.id)),[orders,myOrders]);
  const addCart=(item,qty=1)=>setCart(p=>{const ex=p.find(x=>x.sku===item.sku);if(ex)return p.map(x=>x.sku===item.sku?{...x,qty:Math.min(x.qty+qty,item.qty)}:x);return[...p,{...item,qty}];});
  const removeCart=(sku)=>setCart(p=>p.filter(x=>x.sku!==sku));
  const changeQty=(sku,d)=>setCart(p=>p.map(x=>x.sku===sku?{...x,qty:Math.max(1,x.qty+d)}:x));
  const cartTotal=cart.reduce((a,i)=>a+i.qty*i.price,0);
  const cartCount=cart.reduce((a,i)=>a+i.qty,0);

  const checkout=()=>{
    if(!cart.length)return;
    const items=cart.map(c=>({sku:c.sku,name:c.name,emoji:c.emoji,qty:c.qty,price:c.price}));
    const o=placeOrder(items,custName,"Green Park",true);
    setMyOrders(p=>[o.id,...p]);
    setCart([]);
    setTrackId(o.id);
    setPage("tracking");
  };

  const filtered=useMemo(()=>inv.filter(i=>i.qty>0&&(cat==="All"||i.cat===cat)&&i.name.toLowerCase().includes(search.toLowerCase())),[inv,cat,search]);

  const W="#ffffff",BG2="#f8fafc",ACC="#FFD700";
  const card2={background:W,borderRadius:16,padding:20,boxShadow:"0 4px 20px rgba(0,0,0,0.06)",border:"1px solid #e2e8f0"};
  const btn2=(bg,fg="#fff",p="9px 18px")=>({cursor:"pointer",border:"none",borderRadius:10,padding:p,fontWeight:700,fontSize:13,background:bg,color:fg,transition:"all 0.2s"});
  const pill2=(bg,fg="#fff")=>({display:"inline-block",background:bg,color:fg,borderRadius:20,padding:"3px 10px",fontSize:11,fontWeight:700});

  return(
  <div style={{minHeight:"100vh",background:BG2,fontFamily:"'Segoe UI',sans-serif",color:"#0f172a",display:"flex",flexDirection:"column"}}>
    <Toast t={custToast} right={20}/>
    <div style={{background:"#fff",borderBottom:"1px solid #e2e8f0",padding:"0 20px",display:"flex",alignItems:"center",justifyContent:"space-between",height:60,position:"sticky",top:0,zIndex:50,boxShadow:"0 4px 20px rgba(0,0,0,0.06)"}}>
      <div style={{display:"flex",alignItems:"center",gap:14}}>
        <div style={{background:GRAD,borderRadius:10,padding:"6px 14px",fontWeight:900,fontSize:18,color:D,cursor:"pointer",letterSpacing:2,...glow(Y)}} onClick={()=>setPage("home")}>BLINKIT</div>
        <div style={{fontSize:12,color:"#94a3b8"}}>📍 {addr.substring(0,28)}…</div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <button onClick={()=>setPage("orders")} style={{...btn2("#f8fafc","#475569","8px 14px"),border:"1px solid #e2e8f0",fontSize:12}}>
          📦 Orders {liveMyOrders.length>0&&<span style={{...pill2("#6366f1"),fontSize:9,marginLeft:4}}>{liveMyOrders.length}</span>}
        </button>
        <button onClick={()=>setPage("cart")} style={{...btn2(GRAD,D,"8px 16px"),...glow(Y)}}>
          🛒 {cartCount>0?<span>Cart <span style={{...pill2("#ef4444"),fontSize:9,marginLeft:2}}>{cartCount}</span> · <strong>₹{cartTotal}</strong></span>:"Cart"}
        </button>
      </div>
    </div>

    {page==="home"&&(
      <div style={{flex:1,padding:20}}>
        <div style={{background:"linear-gradient(135deg,#0f172a 0%,#1e293b 100%)",borderRadius:20,padding:"32px 36px",marginBottom:24,display:"flex",justifyContent:"space-between",alignItems:"center",overflow:"hidden",position:"relative"}}>
          <div style={{position:"absolute",top:-40,right:100,width:200,height:200,background:"radial-gradient(circle,#FFD70015,transparent)",borderRadius:"50%"}}/>
          <div style={{position:"relative"}}>
            <div style={{fontSize:13,color:"#fbbf24",fontWeight:700,letterSpacing:2,marginBottom:8,textTransform:"uppercase"}}>⚡ Quick Commerce</div>
            <div style={{fontSize:28,fontWeight:900,color:"#fff",lineHeight:1.2,marginBottom:8}}>Groceries in <span style={{background:GRAD,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>10 minutes</span></div>
            <div style={{fontSize:13,color:"#64748b",marginBottom:20}}>Fresh products from our dark store to your door</div>
          </div>
          <div style={{fontSize:90}}>🛵</div>
        </div>
        <div style={{display:"flex",gap:10,marginBottom:16}}>
          <input placeholder="🔍 Search groceries..." value={search} onChange={e=>setSearch(e.target.value)} style={{flex:1,padding:"11px 16px",borderRadius:12,border:"1px solid #e2e8f0",background:"#fff",fontSize:13,outline:"none",maxWidth:300}}/>
        </div>
        <div style={{display:"flex",gap:8,marginBottom:22,flexWrap:"wrap"}}>
          {CATS.map(c=>(
            <button key={c} onClick={()=>setCat(c)} style={{...btn2(cat===c?GRAD:W,cat===c?D:"#475569","7px 16px"),border:`1px solid ${cat===c?"transparent":"#e2e8f0"}`,fontSize:12,...(cat===c?glow(Y):{})}}>{c}</button>
          ))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(168px,1fr))",gap:14}}>
          {filtered.map(item=>{
            const inCart=cart.find(x=>x.sku===item.sku);
            return(
              <div key={item.id} style={{background:W,borderRadius:16,overflow:"hidden",boxShadow:"0 2px 12px rgba(0,0,0,0.06)",border:"1px solid #f1f5f9",transition:"all 0.25s",cursor:"pointer"}}
                onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.boxShadow="0 12px 32px rgba(0,0,0,0.12)";}}
                onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="0 2px 12px rgba(0,0,0,0.06)";}}>
                <div onClick={()=>{setSelProd(item);setPage("product");}} style={{background:"linear-gradient(135deg,#f8fafc,#f1f5f9)",padding:22,textAlign:"center",fontSize:54}}>{item.emoji}</div>
                <div style={{padding:"12px 14px"}}>
                  <div style={{fontSize:12,fontWeight:700,marginBottom:2,color:"#1e293b"}}>{item.name}</div>
                  <div style={{fontSize:10,color:"#94a3b8",marginBottom:10}}>{item.desc}</div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                    <span style={{fontWeight:900,fontSize:16,color:D}}>₹{item.price}</span>
                    <span style={{fontSize:10,color:item.qty<10?"#ef4444":item.qty<20?"#f59e0b":"#22c55e",fontWeight:600}}>{item.qty<10?`Only ${item.qty} left`:`${item.qty} in stock`}</span>
                  </div>
                  {inCart?(
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:ACC,borderRadius:10,padding:"6px 8px",...glow(Y)}}>
                      <button onClick={()=>changeQty(item.sku,-1)} style={{...btn2("transparent",D,"0 8px"),fontSize:18,fontWeight:900}}>−</button>
                      <span style={{fontWeight:900,fontSize:14,color:D}}>{inCart.qty}</span>
                      <button onClick={()=>addCart(item)} style={{...btn2("transparent",D,"0 8px"),fontSize:18,fontWeight:900}}>+</button>
                    </div>
                  ):(
                    <button onClick={()=>addCart(item)} style={{...btn2(D,ACC,"9px 0"),width:"100%",fontSize:12}}>+ Add to Cart</button>
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
        <div style={{flex:1,padding:20,maxWidth:560,margin:"0 auto",width:"100%"}}>
          <button onClick={()=>setPage("home")} style={{...btn2("#fff","#475569","8px 16px"),border:"1px solid #e2e8f0",marginBottom:16,fontSize:12}}>← Back</button>
          <div style={{...card2,overflow:"hidden",padding:0}}>
            <div style={{background:"linear-gradient(135deg,#f8fafc,#e2e8f0)",padding:48,textAlign:"center",fontSize:96}}>{live.emoji}</div>
            <div style={{padding:24}}>
              <div style={{fontWeight:900,fontSize:22,marginBottom:4}}>{live.name}</div>
              <div style={{color:"#94a3b8",fontSize:13,marginBottom:14}}>{live.desc}</div>
              <div style={{fontSize:30,fontWeight:900,marginBottom:20}}>₹{live.price}</div>
              {inCart?(
                <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:24,background:ACC,borderRadius:12,padding:"14px 20px",...glow(Y)}}>
                  <button onClick={()=>changeQty(live.sku,-1)} style={{...btn2("rgba(0,0,0,0.1)",D,"0 12px"),fontSize:22,fontWeight:900}}>−</button>
                  <span style={{fontWeight:900,fontSize:20,color:D}}>{inCart.qty} in cart</span>
                  <button onClick={()=>addCart(live)} style={{...btn2("rgba(0,0,0,0.1)",D,"0 12px"),fontSize:22,fontWeight:900}}>+</button>
                </div>
              ):(
                <button onClick={()=>addCart(live)} style={{...btn2(D,ACC,"15px 0"),...glow(Y),width:"100%",fontSize:15}}>🛒 Add to Cart — ₹{live.price}</button>
              )}
            </div>
          </div>
        </div>
      );
    })()}

    {page==="cart"&&(
      <div style={{flex:1,padding:20,maxWidth:520,margin:"0 auto",width:"100%",boxSizing:"border-box"}}>
        <button onClick={()=>setPage("home")} style={{...btn2("#fff","#475569","8px 16px"),border:"1px solid #e2e8f0",marginBottom:16,fontSize:12}}>← Continue Shopping</button>
        <h2 style={{fontWeight:900,fontSize:22,marginBottom:16}}>🛒 Your Cart</h2>
        {cart.length===0&&<div style={{textAlign:"center",padding:60,color:"#94a3b8"}}><div style={{fontSize:48,marginBottom:12}}>🛒</div><div style={{fontWeight:600}}>Cart is empty</div><button onClick={()=>setPage("home")} style={{...btn2(D,ACC,"12px 24px"),...glow(Y),marginTop:16,fontSize:14}}>Shop Now</button></div>}
        {cart.map(item=>(
          <div key={item.sku} style={{...card2,display:"flex",gap:14,alignItems:"center",marginBottom:10,padding:14}}>
            <div style={{fontSize:36,background:"#f8fafc",borderRadius:10,padding:8,flexShrink:0}}>{item.emoji}</div>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,fontSize:13}}>{item.name}</div>
              <div style={{color:"#94a3b8",fontSize:11,marginTop:2}}>₹{item.price} each</div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{display:"flex",alignItems:"center",gap:8,background:"#f1f5f9",borderRadius:10,padding:"6px 12px"}}>
                <button onClick={()=>changeQty(item.sku,-1)} style={{...btn2("transparent","#334155","0 4px"),fontSize:18,fontWeight:900}}>−</button>
                <span style={{fontWeight:800,minWidth:20,textAlign:"center"}}>{item.qty}</span>
                <button onClick={()=>addCart(item)} style={{...btn2("transparent","#334155","0 4px"),fontSize:18,fontWeight:900}}>+</button>
              </div>
              <span style={{fontWeight:900,fontSize:15}}>₹{item.qty*item.price}</span>
              <button onClick={()=>removeCart(item.sku)} style={{...btn2("#fff","#ef4444","4px 10px"),border:"1px solid #fecaca",fontSize:16}}>×</button>
            </div>
          </div>
        ))}
        {cart.length>0&&(
          <div style={{...card2,marginTop:12}}>
            <div style={{fontWeight:900,fontSize:17,marginBottom:14}}>Order Summary</div>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:8,fontSize:13}}><span style={{color:"#64748b"}}>Subtotal</span><span>₹{cartTotal}</span></div>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:8,fontSize:13}}><span style={{color:"#64748b"}}>Delivery</span><span style={{color:"#22c55e"}}>FREE</span></div>
            <div style={{display:"flex",justifyContent:"space-between",fontWeight:900,fontSize:18,padding:"12px 0",borderTop:"2px solid #f1f5f9"}}><span>Total</span><span>₹{cartTotal}</span></div>
            <div style={{background:"#f0fdf4",borderRadius:10,padding:12,marginBottom:14,fontSize:12,color:"#166534",border:"1px solid #bbf7d0"}}>⚡ Delivery in ~{rand(8,14)} minutes · 📍 {addr}</div>
            <button onClick={checkout} style={{...btn2(D,ACC,"15px 0"),...glow(Y),width:"100%",fontSize:15}}>⚡ Place Order — ₹{cartTotal}</button>
          </div>
        )}
      </div>
    )}

    {page==="orders"&&(
      <div style={{flex:1,padding:20,maxWidth:560,margin:"0 auto",width:"100%",boxSizing:"border-box"}}>
        <button onClick={()=>setPage("home")} style={{...btn2("#fff","#475569","8px 16px"),border:"1px solid #e2e8f0",marginBottom:16,fontSize:12}}>← Back</button>
        <h2 style={{fontWeight:900,fontSize:22,marginBottom:16}}>📦 My Orders</h2>
        {liveMyOrders.length===0&&<div style={{textAlign:"center",padding:60,color:"#94a3b8"}}><div style={{fontSize:48,marginBottom:12}}>📦</div><div>No orders yet</div><button onClick={()=>setPage("home")} style={{...btn2(D,ACC,"12px 24px"),...glow(Y),marginTop:14,fontSize:14}}>Shop Now</button></div>}
        {liveMyOrders.map(o=>(
          <div key={o.id} onClick={()=>{setTrackId(o.id);setPage("tracking");}} style={{...card2,marginBottom:12,borderLeft:`4px solid ${SM[o.status].color}`,cursor:"pointer",transition:"all 0.2s"}}
            onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";}}
            onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
              <div><div style={{fontWeight:800,fontSize:15}}>{o.id}</div><div style={{color:"#94a3b8",fontSize:11,marginTop:2}}>🕐 {o.time}</div></div>
              <div style={{textAlign:"right"}}>
                <span style={{...pill2(SM[o.status].color),fontSize:12,padding:"5px 12px"}}>{SM[o.status].icon} {SM[o.status].label}</span>
                <div style={{fontWeight:900,fontSize:16,marginTop:6}}>₹{o.total}</div>
              </div>
            </div>
            <OrderTracker order={o} dark={false}/>
            <div style={{marginTop:10,fontSize:11,color:"#6366f1",fontWeight:700}}>Tap to track →</div>
          </div>
        ))}
      </div>
    )}

    {page==="tracking"&&(()=>{
      const o=orders.find(x=>x.id===trackId)||liveMyOrders[0];
      if(!o)return<div style={{flex:1,padding:40,textAlign:"center",color:"#94a3b8"}}>Order not found.<button onClick={()=>setPage("home")} style={{...btn2(D,ACC,"10px 20px"),marginLeft:10,fontSize:12}}>Home</button></div>;
      return(
        <div style={{flex:1,padding:20,maxWidth:520,margin:"0 auto",width:"100%",boxSizing:"border-box"}}>
          <button onClick={()=>setPage("orders")} style={{...btn2("#fff","#475569","8px 16px"),border:"1px solid #e2e8f0",marginBottom:16,fontSize:12}}>← My Orders</button>
          <div style={{...card2,overflow:"hidden",padding:0}}>
            <div style={{background:`linear-gradient(135deg,${SM[o.status].color}15,${SM[o.status].color}08)`,padding:32,textAlign:"center",borderBottom:"1px solid #f1f5f9"}}>
              <div style={{fontSize:52,marginBottom:10}}>{SM[o.status].icon}</div>
              <div style={{fontSize:22,fontWeight:900}}>{SM[o.status].label}</div>
              <div style={{fontSize:13,color:"#64748b",marginTop:6}}>{SM[o.status].msg}</div>
              {o.status!=="delivered"&&<div style={{marginTop:10,display:"inline-block",background:SM[o.status].color,color:"#fff",borderRadius:20,padding:"6px 16px",fontSize:12,fontWeight:700}}>ETA ~{o.eta} minutes</div>}
            </div>
            <div style={{padding:24}}>
              <OrderTracker order={o} dark={false}/>
              <div style={{marginTop:16}}>
                {o.items.map(i=>(
                  <div key={i.sku} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid #f8fafc",fontSize:13}}>
                    <span style={{color:"#475569"}}>{i.emoji} {i.name} ×{i.qty}</span><span style={{fontWeight:800}}>₹{i.qty*i.price}</span>
                  </div>
                ))}
                <div style={{display:"flex",justifyContent:"space-between",fontWeight:900,fontSize:17,paddingTop:14}}><span>Total</span><span>₹{o.total}</span></div>
              </div>
              <div style={{marginTop:16,background:"#f8fafc",borderRadius:12,padding:14,border:"1px solid #e2e8f0"}}>
                <div style={{fontWeight:700,fontSize:12,marginBottom:8,color:"#475569"}}>📡 Live Updates</div>
                {[...o.log].reverse().map((l,i)=>(
                  <div key={i} style={{display:"flex",gap:10,marginBottom:5,fontSize:12}}>
                    <span style={{color:SM[l.status]?.color,fontWeight:700,minWidth:75}}>{l.time}</span>
                    <span style={{color:"#555"}}>{SM[l.status]?.icon} {l.msg}</span>
                  </div>
                ))}
              </div>
              {o.status==="delivered"&&(
                <div style={{marginTop:16,background:"linear-gradient(135deg,#f0fdf4,#dcfce7)",borderRadius:14,padding:20,textAlign:"center",border:"2px solid #86efac"}}>
                  <div style={{fontSize:44,marginBottom:8}}>🎉</div>
                  <div style={{fontWeight:900,color:"#166534",fontSize:17}}>Order Delivered!</div>
                  <button onClick={()=>setPage("home")} style={{...btn2(D,ACC,"11px 28px"),...glow(Y),marginTop:12,fontSize:14}}>Order Again</button>
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

export default function App(){
  const store=useSharedStore();
  const[view,setView]=useState("split");

  return(
  <div style={{minHeight:"100vh",background:"#000",fontFamily:"'Segoe UI',sans-serif"}}>
    <div style={{background:"linear-gradient(90deg,#020817,#0f172a,#020817)",padding:"0 20px",display:"flex",alignItems:"center",justifyContent:"space-between",height:52,borderBottom:"2px solid #1e293b",position:"sticky",top:0,zIndex:100}}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <div style={{background:GRAD,borderRadius:9,padding:"5px 14px",fontWeight:900,fontSize:17,color:D,letterSpacing:2,...glow(Y)}}>BLINKIT</div>
        <div style={{color:"#334155",fontSize:11,fontWeight:700,letterSpacing:2}}>FULL STACK REAL-TIME IMS</div>
      </div>
      <div style={{display:"flex",gap:6}}>
        {[["split","⚡ Split View"],["admin","🛡️ Admin"],["customer","🛍️ Customer"]].map(([v,l])=>(
          <button key={v} onClick={()=>setView(v)} style={{cursor:"pointer",border:view===v?`1px solid ${Y}`:"1px solid #1e293b",borderRadius:9,padding:"7px 16px",fontWeight:700,fontSize:12,background:view===v?GRAD:"rgba(255,255,255,0.03)",color:view===v?D:"#475569",transition:"all 0.2s",...(view===v?glow(Y):{})}}>{l}</button>
        ))}
      </div>
    </div>

    {view==="split"&&(
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",height:"calc(100vh - 52px)"}}>
        <div style={{overflowY:"auto",borderRight:"2px solid #FFD700"}}>
          <div style={{background:GRAD,padding:"5px 12px",fontSize:11,fontWeight:900,color:"#000",letterSpacing:1,position:"sticky",top:0,zIndex:10}}>🛡️ ADMIN PANEL — DARK STORE DELHI-01</div>
          <AdminPanel store={store}/>
        </div>
        <div style={{overflowY:"auto"}}>
          <div style={{background:"#111",padding:"5px 12px",fontSize:11,fontWeight:900,color:Y,letterSpacing:1,position:"sticky",top:0,zIndex:10}}>🛍️ CUSTOMER PANEL — LIVE SHOPPING</div>
          <CustomerPanel store={store}/>
        </div>
      </div>
    )}
    {view==="admin"&&<div style={{height:"calc(100vh - 52px)",overflowY:"auto"}}><AdminPanel store={store}/></div>}
    {view==="customer"&&<div style={{height:"calc(100vh - 52px)",overflowY:"auto"}}><CustomerPanel store={store}/></div>}
  </div>
  );
}