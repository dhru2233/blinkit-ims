import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import ProductCard from './components/ProductCard';
import LiveTracker from './components/LiveTracker';
import Login from './components/Login';

function App() {
  const [role, setRole] = useState(null); // 'admin' or 'customer'
  const [orderStep, setOrderStep] = useState(0);
  const [products, setProducts] = useState(JSON.parse(localStorage.getItem('blinkit_inventory')) || []);

  // Update Stock Logic
  const handleStock = (id, change) => {
    const updated = products.map(p => p.id === id ? {...p, stock: Math.max(0, p.stock + change)} : p);
    setProducts(updated);
    localStorage.setItem('blinkit_inventory', JSON.stringify(updated));
  };

  if (!role) return <Login onLogin={(isAdmin) => setRole(isAdmin ? 'admin' : 'customer')} />;

  return (
    <div style={{ backgroundColor: '#0f172a', minHeight: '100vh', color: '#fff' }}>
      <Navbar onSearch={() => {}} />
      
      <div style={{ padding: '20px 40px' }}>
        {/* --- ADMIN PANEL VIEW --- */}
        {role === 'admin' ? (
          <div id="admin-panel">
            <h1 style={{color: '#F8CB46'}}>Admin Portal - Dark Store Delhi-01</h1>
            <div style={styles.statsRow}>
              <div style={styles.statBox}><h3>{products.filter(p => p.stock < 5).length}</h3><p>Alerts</p></div>
              <button onClick={() => setOrderStep((prev) => (prev + 1) % 4)} style={styles.trackBtn}>
                Update Order Status (Live)
              </button>
            </div>
            <div style={styles.grid}>
              {products.map(p => (
                <div key={p.id} style={styles.adminCard}>
                  <h4>{p.name}</h4>
                  <p>Stock: {p.stock}</p>
                  <button onClick={() => handleStock(p.id, 5)} style={styles.addBtn}>+ Restock 5</button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* --- CUSTOMER PANEL VIEW --- */
          <div id="customer-panel">
            <div style={styles.promoBanner}>
              <h2>Groceries in 10 minutes</h2>
              <p>Fresh products from our dark store to your door</p>
            </div>
            <h3>Live Track your Order</h3>
            <LiveTracker step={orderStep} />
            <div style={styles.grid}>
              {products.filter(p => p.stock > 0).map(p => (
                <ProductCard key={p.id} {...p} isAdmin={false} onAction={() => handleStock(p.id, -1)} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' },
  statsRow: { display: 'flex', gap: '20px', margin: '20px 0' },
  statBox: { background: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #ff4d4f' },
  adminCard: { background: '#1e293b', padding: '15px', borderRadius: '12px', border: '1px solid #334155' },
  addBtn: { width: '100%', background: '#F8CB46', border: 'none', padding: '8px', borderRadius: '5px', marginTop: '10px', fontWeight: 'bold', cursor: 'pointer' },
  trackBtn: { background: '#4ade80', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
  promoBanner: { background: 'linear-gradient(90deg, #1e293b, #0f172a)', padding: '40px', borderRadius: '20px', marginBottom: '30px', border: '1px solid #334155' }
};
// Add this inside your App component
useEffect(() => {
  if (orderStep > 0) {
    const statusLabels = ["Order Received", "Packing your items", "Out for Delivery", "Arrived at your location"];
    setToast(`Order Update: ${statusLabels[orderStep]}`);
  }
}, [orderStep]);

// Inside your return() (near the bottom)
{toast && <Notification message={toast} onClose={() => setToast("")} />}
export default App;