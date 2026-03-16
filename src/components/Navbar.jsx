import React from 'react';

const Navbar = () => {
  return (
    <nav style={styles.nav}>
      <div style={styles.logo}>
        <span style={styles.blink}>Blink</span>
        <span style={styles.it}>it</span>
        <span style={styles.ims}> IMS</span>
      </div>

      <div style={styles.searchContainer}>
        <input 
          type="text" 
          placeholder="Search inventory (e.g. Milk, Bread, Soap)" 
          style={styles.searchInput} 
        />
      </div>

      <div style={styles.menu}>
        <button style={styles.button}>Login</button>
        <div style={styles.cart}>
          🛒 <span style={styles.cartText}>Cart</span>
        </div>
      </div>
    </nav>
  );
};

const styles = {
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 40px',
    backgroundColor: '#fff',
    borderBottom: '1px solid #eee',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
  },
  logo: {
    fontSize: '24px',
    fontWeight: '800',
    cursor: 'pointer',
  },
  blink: { color: '#F8CB46' },
  it: { color: '#000' },
  ims: { fontSize: '14px', color: '#666', fontWeight: '400' },
  searchContainer: {
    flex: 1,
    margin: '0 50px',
  },
  searchInput: {
    width: '100%',
    padding: '12px 20px',
    borderRadius: '10px',
    border: '1px solid #eee',
    backgroundColor: '#f8f8f8',
    fontSize: '14px',
    outline: 'none',
  },
  menu: {
    display: 'flex',
    alignItems: 'center',
    gap: '25px',
  },
  button: {
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  cart: {
    backgroundColor: '#0C831F',
    color: '#fff',
    padding: '10px 20px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontWeight: '600',
    cursor: 'pointer',
  }
};

export default Navbar;