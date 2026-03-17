import React, { useState } from 'react';
import Navbar from './components/Navbar';
import ProductCard from './components/ProductCard';

function App() {
  const [isAdmin, setIsAdmin] = useState(false); // Switch between panels
  const [products, setProducts] = useState([
    { id: 1, name: "Amul Gold Milk", price: 66, stock: 12, category: "Dairy" },
    { id: 2, name: "Harvest Gold Bread", price: 50, stock: 5, category: "Bakery" },
    { id: 3, name: "Lay's Classic Chips", price: 20, stock: 45, category: "Snacks" },
  ]);

  // Real-time stock update function
  const updateStock = (id, amount) => {
    setProducts(products.map(p => 
      p.id === id ? { ...p, stock: p.stock + amount } : p
    ));
  };

  return (
    <div style={{ backgroundColor: '#f4f6f8', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      <Navbar />
      
      {/* Control Switcher */}
      <div style={styles.tabContainer}>
        <button 
          onClick={() => setIsAdmin(false)} 
          style={{...styles.tab, borderBottom: !isAdmin ? '3px solid #0C831F' : 'none'}}>
          Customer View
        </button>
        <button 
          onClick={() => setIsAdmin(true)} 
          style={{...styles.tab, borderBottom: isAdmin ? '3px solid #0C831F' : 'none'}}>
          Admin Dashboard
        </button>
      </div>

      <div style={{ padding: '20px 40px' }}>
        <div style={styles.headerSection}>
          <h2>{isAdmin ? "Admin Inventory Manager" : "Order Online"}</h2>
          <p>{isAdmin ? "Manage your warehouse stock levels" : "Fastest delivery to your doorstep"}</p>
        </div>

        <div style={styles.grid}>
          {products.map(product => (
            <div key={product.id} style={styles.cardWrapper}>
              <ProductCard {...product} />
              
              {/* Admin Panel Controls */}
              {isAdmin && (
                <div style={styles.adminControls}>
                  <button onClick={() => updateStock(product.id, 1)} style={styles.plusBtn}>+ Add Stock</button>
                  <button onClick={() => updateStock(product.id, -1)} style={styles.minusBtn}>- Remove</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  tabContainer: { display: 'flex', justifyContent: 'center', background: '#fff', gap: '50px' },
  tab: { padding: '15px 20px', cursor: 'pointer', border: 'none', background: 'none', fontWeight: 'bold' },
  headerSection: { marginBottom: '30px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '25px' },
  adminControls: { marginTop: '10px', display: 'flex', gap: '5px' },
  plusBtn: { flex: 1, background: '#0C831F', color: '#fff', border: 'none', padding: '5px', borderRadius: '4px', cursor: 'pointer' },
  minusBtn: { flex: 1, background: '#e53e3e', color: '#fff', border: 'none', padding: '5px', borderRadius: '4px', cursor: 'pointer' },
};

export default App;