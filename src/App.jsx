import React, { useState, useMemo } from 'react';
import Navbar from './components/Navbar';
import ProductCard from './components/ProductCard';
import OrderTracker from './components/OrderTracker';

function App() {
  const [searchTerm, setSearchTerm] = useState("");
  
  // 1. Generate 100 items (Same as before)
  const initialProducts = useMemo(() => {
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
  }, []);

  const [products] = useState(initialProducts);

  // 2. FILTER LOGIC
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ backgroundColor: '#0f172a', minHeight: '100vh', color: '#fff' }}>
      <Navbar onSearch={setSearchTerm} />
      
      <div style={{ padding: '20px 40px' }}>
        {/* Stats Cards */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}><h3>{filteredProducts.length}</h3><p>RESULTS FOUND</p></div>
          <div style={styles.statCard}><h3 style={{color: '#4ade80'}}>7</h3><p>DELIVERED</p></div>
          <div style={styles.statCard}><h3 style={{color: '#f87171'}}>{products.filter(p => p.stock < 5).length}</h3><p>ALERTS</p></div>
        </div>

        <OrderTracker status="Packing" />

        <h3 style={{marginTop: '40px'}}>Inventory Catalog</h3>
        <div style={styles.grid}>
          {filteredProducts.map(product => (
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
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px', marginTop: '20px' }
};

export default App;