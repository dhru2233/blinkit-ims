import React from 'react';

const ProductCard = ({ name, price, stock, category, isAdmin, onAction }) => {
  const isLowStock = stock < 5;

  return (
    <div style={{
      ...styles.card, 
      borderColor: isLowStock ? '#FF4D4F' : '#334155',
      backgroundColor: isLowStock ? '#2d1b1b' : '#1e293b'
    }}>
      {isLowStock && <div style={styles.badge}>LOW STOCK</div>}
      
      <div style={styles.imagePlaceholder}>📦</div>
      <h4 style={{color: '#fff', margin: '10px 0'}}>{name}</h4>
      <p style={{color: '#64748b', fontSize: '12px'}}>{category}</p>
      
      <div style={styles.details}>
        <span style={{color: '#F8CB46', fontWeight: 'bold'}}>₹{price}</span>
        <span style={{color: isLowStock ? '#ff4d4f' : '#64748b'}}>Qty: {stock}</span>
      </div>

      {/* DYNAMIC BUTTON BASED ON ROLE */}
      <button 
        onClick={onAction}
        style={{
          ...styles.btn,
          backgroundColor: isAdmin ? '#334155' : '#0C831F',
          border: isAdmin ? '1px solid #4ade80' : 'none'
        }}
      >
        {isAdmin ? "🔧 Manage Stock" : "🛒 Add to Cart"}
      </button>
    </div>
  );
};

const styles = {
  card: { padding: '15px', borderRadius: '12px', border: '1px solid', position: 'relative', transition: '0.3s' },
  badge: { position: 'absolute', top: '10px', right: '10px', background: '#FF4D4F', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '4px' },
  imagePlaceholder: { height: '80px', background: '#0f172a', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '30px' },
  details: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' },
  btn: { width: '100%', marginTop: '15px', padding: '10px', borderRadius: '8px', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }
};

export default ProductCard;