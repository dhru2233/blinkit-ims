import React, { useState, useEffect, useMemo } from 'react';
import Navbar from './components/Navbar';
import ProductCard from './components/ProductCard';
import OrderTracker from './components/OrderTracker';
import Login from './components/Login'; // NEW IMPORT

function App() {
  const [userRole, setUserRole] = useState(null); // 'admin', 'customer', or null
  const [searchTerm, setSearchTerm] = useState("");
  const [revenue, setRevenue] = useState(0);

  // LOAD DATA FROM LOCAL STORAGE OR GENERATE NEW
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem("blinkit_inventory");
    if (saved) return JSON.parse(saved);
    
    const items = [];
    const categories = ["Dairy", "Snacks", "Bakery", "Beverages", "Household"];
    for (let i = 1; i <= 100; i++) {
      items.push({
        id: i,
        name: `${categories[i % categories.length]} Item ${i}`,
        price: Math.floor(Math.random() * 500) + 20,
        stock: Math.floor(Math.random() * 50),
        category: categories[i % categories.length]
      });
    }
    return items;
  });

  // SAVE DATA WHENEVER PRODUCTS CHANGE
  useEffect(() => {
    localStorage.setItem("blinkit_inventory", JSON.stringify(products));
  }, [products]);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!userRole) return <Login onLogin={(isAdmin) => setUserRole(isAdmin ? 'admin' : 'customer')} />;

  return (
    <div style={{ backgroundColor: '#0f172a', minHeight: '100vh', color: '#fff' }}>
      <Navbar onSearch={setSearchTerm} />
      <div style={{ padding: '20px 40px' }}>
        <div style={styles.statsGrid}>
          <div style={styles.statCard}><h3>{userRole.toUpperCase()}</h3><p>CURRENT ROLE</p></div>
          <div style={styles.statCard}><h3 style={{color: '#4ade80'}}>₹{revenue}</h3><p>SESSION REVENUE</p></div>
          <div style={styles.statCard}><h3 style={{color: '#f87171'}}>{products.filter(p => p.stock < 5).length}</h3><p>LOW STOCK</p></div>
        </div>
        
        <OrderTracker status="Packing" />

        <div style={styles.grid}>
          {filteredProducts.map(product => (
            <ProductCard key={product.id} {...product} isAdmin={userRole === 'admin'} />
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginTop: '20px' },
    statCard: { background: '#1e293b', padding: '15px', borderRadius: '12px', textAlign: 'center', border: '1px solid #334155' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px', marginTop: '40px' }
};

export default App;