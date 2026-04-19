/* ── Brand colors ─────────────────────────────────────────────────────── */
export const C = {
  yellow:  "#F8C200",
  black:   "#0D0D0D",
  white:   "#FFFFFF",
  green:   "#0EA472",
  red:     "#E53935",
  orange:  "#FF6B35",
  purple:  "#7C3AED",
  blue:    "#1A73E8",
  gray1:   "#F7F7F7",
  gray2:   "#EBEBEB",
  gray3:   "#9E9E9E",
  gray4:   "#4A4A4A",
  dark1:   "#111827",
  dark2:   "#1F2937",
  dark3:   "#374151",
};

/* ── Products ─────────────────────────────────────────────────────────── */
export const PRODUCTS = [
  {id:1, sku:"AMU-001",name:"Amul Milk 500ml",      cat:"Dairy",        emoji:"🥛",img:"https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300&q=80",price:28, cost:22, qty:120,msL:30,expiry:"2026-08-20",vendor:"Amul",       desc:"Fresh full-cream milk"},
  {id:2, sku:"LAY-002",name:"Lay's Classic Salted", cat:"Snacks",       emoji:"🍟",img:"https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300&q=80",price:20, cost:14, qty:45, msL:20,expiry:"2026-08-10",vendor:"PepsiCo",    desc:"Crispy potato chips"},
  {id:3, sku:"BAN-003",name:"Bananas (Dozen)",       cat:"Fruits",       emoji:"🍌",img:"https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=300&q=80",price:45, cost:30, qty:60, msL:15,expiry:"2026-03-15",vendor:"FreshFarm",  desc:"Fresh ripe bananas"},
  {id:4, sku:"COC-004",name:"Coca-Cola 750ml",       cat:"Beverages",    emoji:"🥤",img:"https://images.unsplash.com/photo-1554866585-cd94860890b7?w=300&q=80",price:45, cost:32, qty:30, msL:25,expiry:"2026-12-01",vendor:"Coca-Cola",   desc:"Ice-cold refreshing cola"},
  {id:5, sku:"SUR-005",name:"Surf Excel 1kg",        cat:"Household",    emoji:"🧺",img:"https://images.unsplash.com/photo-1585421514738-01798e348b17?w=300&q=80",price:220,cost:170,qty:35, msL:10,expiry:"2027-06-01",vendor:"HUL",        desc:"Premium detergent powder"},
  {id:6, sku:"BRI-006",name:"Britannia Bread",       cat:"Bakery",       emoji:"🍞",img:"https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&q=80",price:42, cost:30, qty:18, msL:12,expiry:"2026-06-14",vendor:"Britannia",  desc:"Soft sandwich bread"},
  {id:7, sku:"MAG-007",name:"Maggi 2-Min Noodles",   cat:"Snacks",       emoji:"🍜",img:"https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=300&q=80",price:14, cost:9,  qty:200,msL:50,expiry:"2026-11-01",vendor:"Nestle",     desc:"Quick 2-minute noodles"},
  {id:8, sku:"DOV-008",name:"Dove Soap 75g",         cat:"Personal Care",emoji:"🧼",img:"https://images.unsplash.com/photo-1607006344380-b6775a0824a7?w=300&q=80",price:55, cost:40, qty:18, msL:20,expiry:"2028-01-01",vendor:"HUL",        desc:"Moisturising beauty bar"},
  {id:9, sku:"EGG-009",name:"Eggs (12 pcs)",         cat:"Dairy",        emoji:"🥚",img:"https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=300&q=80",price:84, cost:65, qty:40, msL:20,expiry:"2026-06-18",vendor:"Country Eggs",desc:"Farm-fresh white eggs"},
  {id:10,sku:"ONI-010",name:"Onions 1kg",            cat:"Fruits",       emoji:"🧅",img:"https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=300&q=80",price:30, cost:20, qty:55, msL:15,expiry:"2026-06-22",vendor:"FreshFarm",  desc:"Fresh red onions"},
  {id:11,sku:"TOM-011",name:"Tomatoes 500g",         cat:"Fruits",       emoji:"🍅",img:"https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=300&q=80",price:25, cost:15, qty:0,  msL:15,expiry:"2026-03-13",vendor:"FreshFarm",  desc:"Vine-ripened tomatoes"},
  {id:12,sku:"YOG-012",name:"Amul Curd 400g",        cat:"Dairy",        emoji:"🍶",img:"https://images.unsplash.com/photo-1488477181946-6428a0291777?w=300&q=80",price:40, cost:30, qty:22, msL:20,expiry:"2026-06-16",vendor:"Amul",       desc:"Thick & creamy curd"},
  {id:13,sku:"RIC-013",name:"Basmati Rice 1kg",      cat:"Household",    emoji:"🍚",img:"https://images.unsplash.com/photo-1536304993881-ff86d42a1430?w=300&q=80",price:99, cost:72, qty:80, msL:15,expiry:"2027-01-01",vendor:"India Gate", desc:"Long-grain premium rice"},
  {id:14,sku:"CHA-014",name:"Haldiram's Bhujia",     cat:"Snacks",       emoji:"🫘",img:"https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=300&q=80",price:60, cost:42, qty:50, msL:20,expiry:"2026-09-01",vendor:"Haldiram's", desc:"Crunchy sev bhujia"},
  {id:15,sku:"COF-015",name:"Nescafé Classic 50g",   cat:"Beverages",    emoji:"☕",img:"https://images.unsplash.com/photo-1610889556528-9a770e32642f?w=300&q=80",price:135,cost:95, qty:25, msL:10,expiry:"2027-06-01",vendor:"Nestle",     desc:"Rich instant coffee"},
  {id:16,sku:"PAN-016",name:"Paneer 200g",           cat:"Dairy",        emoji:"🧀",img:"https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=300&q=80",price:65, cost:48, qty:0,  msL:15,expiry:"2026-03-18",vendor:"Amul",       desc:"Fresh cottage cheese"},
  {id:17,sku:"ATA-017",name:"Aashirvaad Atta 5kg",   cat:"Household",    emoji:"🌾",img:"https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=300&q=80",price:280,cost:220,qty:40, msL:10,expiry:"2027-03-01",vendor:"ITC",        desc:"Whole wheat atta"},
  {id:18,sku:"ORA-018",name:"Fresh Oranges 1kg",     cat:"Fruits",       emoji:"🍊",img:"https://images.unsplash.com/photo-1547514701-42782101795e?w=300&q=80",price:60, cost:40, qty:35, msL:10,expiry:"2026-03-25",vendor:"FreshFarm",  desc:"Juicy Nagpur oranges"},
];

export const CATS = ["All","Dairy","Snacks","Fruits","Beverages","Household","Bakery","Personal Care"];

/* ── Local stores (Delhi NCR) ─────────────────────────────────────────── */
export const LOCAL_STORES = [
  {id:"LS1", name:"Sharma Kirana Store",    area:"Saket",        pos:[28.5244,77.2167], phone:"9876543210", rating:4.2, deliveryTime:"20-30 min"},
  {id:"LS2", name:"Green Park SuperMart",   area:"Green Park",   pos:[28.5494,77.2001], phone:"9876543211", rating:4.5, deliveryTime:"15-25 min"},
  {id:"LS3", name:"Hauz Khas Quick Store",  area:"Hauz Khas",    pos:[28.5535,77.2032], phone:"9876543212", rating:4.3, deliveryTime:"18-28 min"},
  {id:"LS4", name:"Malviya Nagar Daily",    area:"Malviya Nagar",pos:[28.5355,77.2167], phone:"9876543213", rating:4.1, deliveryTime:"25-35 min"},
];

/* ── Dark store coords ────────────────────────────────────────────────── */
export const DARK_STORE = { pos:[28.5274,77.2167], name:"Blinkit Dark Store – Saket" };

/* ── Delivery riders ──────────────────────────────────────────────────── */
export const RIDERS = [
  {id:"R1",name:"Raju Sharma",  phone:"9811234567",emoji:"🛵",rating:4.8},
  {id:"R2",name:"Mohan Singh",  phone:"9822345678",emoji:"🛵",rating:4.6},
  {id:"R3",name:"Suresh Kumar", phone:"9833456789",emoji:"🛵",rating:4.9},
  {id:"R4",name:"Amit Yadav",   phone:"9844567890",emoji:"🛵",rating:4.7},
];

/* ── Order status flow ────────────────────────────────────────────────── */
export const STATUS_FLOW = ["placed","confirmed","picking","packed","out_for_delivery","delivered"];
export const SM = {
  placed:           {label:"Order Placed",    color:"#7C3AED",icon:"📱", msg:"Your order has been placed!",                 adminMsg:"New order received"},
  confirmed:        {label:"Confirmed",       color:"#D97706",icon:"✅", msg:"Store confirmed your order",                  adminMsg:"Order confirmed by store"},
  picking:          {label:"Picking Items",   color:"#0284C7",icon:"🧺", msg:"Our picker is collecting your items",         adminMsg:"Picker assigned & picking"},
  packed:           {label:"Order Packed",    color:"#7C3AED",icon:"📦", msg:"Your order is packed & ready",               adminMsg:"Order packed, awaiting rider"},
  out_for_delivery: {label:"On the Way",      color:"#EA580C",icon:"🛵", msg:"Rider is on the way to your location!",      adminMsg:"Rider picked up order"},
  delivered:        {label:"Delivered",       color:"#16A34A",icon:"🎉", msg:"Order delivered! Enjoy your groceries 😊",   adminMsg:"Order delivered successfully"},
};

export const rand  = (a,b) => Math.floor(Math.random()*(b-a+1))+a;
export const pick  = arr   => arr[rand(0,arr.length-1)];
export const ts    = ()    => new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",second:"2-digit"});
export const fmtINR= n     => `₹${Number(n).toLocaleString("en-IN")}`;