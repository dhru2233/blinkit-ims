import React from 'react';

const Navbar = ({ onSearch }) => {
  return (
    <nav style={styles.nav}>
      <div style={styles.logo}>
        <span style={styles.blink}>Blink</span><span style={styles.it}>it</span>
        <span style={styles.ims}> IMS</span>
      </div>

      <div style={styles.searchContainer}>
        <input 
          type="text" 
          placeholder="Search 100+ products (e.g. Dairy, Snacks...)" 
          style={styles.searchInput} 
          onChange={(e) => onSearch(e.target.value)} // Sends text to App.jsx
        />
      </div>

      <div style={styles.menu}>
        <div style={styles.status}>🟢 System Online</div>
        <div style={styles.cart}>🛒 Cart</div>
      </div>
    </nav>
  );
};

const styles = {
  nav: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 40px', backgroundColor: '#1e293b', borderBottom: '1px solid #334155', position: 'sticky', top: 0, zIndex: 1000 },
  logo: { fontSize: '24px', fontWeight: '800' },
  blink: { color: '#F8CB46' },
  it: { color: '#fff' },
  ims: { fontSize: '14px', color: '#64748b', marginLeft: '5px' },
  searchContainer: { flex: 1, margin: '0 50px' },
  searchInput: { width: '100%', padding: '12px 20px', borderRadius: '10px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', fontSize: '14px', outline: 'none' },
  menu: { display: 'flex', gap: '20px', alignItems: 'center' },
  status: { fontSize: '12px', color: '#4ade80', fontWeight: 'bold' },
  cart: { backgroundColor: '#0C831F', color: '#fff', padding: '8px 15px', borderRadius: '6px', fontWeight: 'bold' }
};

export default Navbar;