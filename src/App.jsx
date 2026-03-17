import React, { useState, useMemo } from 'react';
import Navbar from './components/Navbar';
import ProductCard from './components/ProductCard';
import OrderTracker from './components/OrderTracker';

function App() {
  const [isAdmin, setIsAdmin] = useState(true);
  
  // GENERATING 100 ITEMS AUTOMATICALLY
  const initialProducts = useMemo(() => {
    const items = [];
    const categories = ["Dairy", "Snacks", "Bakery", "Beverages", "Household"];
    for (let i = 1; i <= 100; i++) {
      items.push({
        id: i,
        name: `Product ${i}`,
        price: Math.floor(Math.random() * 500) + 20,
        stock: Math.floor(Math.random() * 50),
        category: categories[i % categories.length]
      });
    }
    return items;
  }, []);

  const [products, setProducts] = useState(initialProducts);

  return (
    <div style={{ backgroundColor: '#0f172a', minHeight: '100vh', color: '#fff', paddingBottom: '50px' }}>
      <Navbar />
      
      <div style={{ padding: '20px 40px' }}>
        {/* Real-Time Dashboard Stats */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}><h3 style={{color: '#F8CB46'}}>100</h3><p>TOTAL SKUs</p></div>
          <div style={styles.statCard}><h3 style={{color: '#4ade80'}}>₹2,714</h3><p>REVENUE</p></div>
          <div style={styles.statCard}><h3 style={{color: '#f87171'}}>
            {products.filter(p => p.stock < 5).length}
          </h3><p>ALERTS</p></div>
        </div>

        {/* Live Tracking Experience */}
        <h3 style={{marginTop: '30px'}}>Active Order: ORD-207</h3>
        <OrderTracker status="Packing" />

        {/* Product Grid */}
        <h3 style={{marginTop: '40px'}}>Warehouse Inventory</h3>
        <div style={styles.grid}>
          {products.map(product => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginTop: '20px' },
  statCard: { background: '#1e293b', padding: '15px', borderRadius: '12px', textAlign: 'center', border: '1px solid #334155' },
  grid: { 
    display: 'grid', 
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
    gap: '20px', 
    marginTop: '20px' 
  }
};

export default App;