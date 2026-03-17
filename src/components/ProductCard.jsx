import React from 'react';

const ProductCard = ({ name, price, stock, category }) => {
  // Logic to check if stock is low
  const isLowStock = stock < 5;

  return (
    <div style={{
      ...styles.card, 
      borderColor: isLowStock ? '#FF4D4F' : '#eee', // Red border if low
      backgroundColor: isLowStock ? '#FFF1F0' : '#fff' // Light red tint
    }}>
      {isLowStock && <div style={styles.badge}>⚠️ LOW STOCK</div>}
      
      <div style={styles.imagePlaceholder}>📦</div>
      <h4 style={styles.name}>{name}</h4>
      <p style={styles.category}>{category}</p>
      
      <div style={styles.details}>
        <span style={styles.price}>₹{price}</span>
        <span style={{
          ...styles.stock, 
          color: isLowStock ? '#D32F2F' : '#666',
          fontWeight: isLowStock ? 'bold' : 'normal'
        }}>
          Qty: {stock}
        </span>
      </div>
    </div>
  );
};

const styles = {
  card: {
    width: '220px',
    border: '2px solid',
    borderRadius: '12px',
    padding: '15px',
    position: 'relative',
    transition: 'all 0.3s ease',
  },
  badge: {
    position: 'absolute',
    top: '-10px',
    right: '10px',
    backgroundColor: '#FF4D4F',
    color: 'white',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: 'bold',
  },
  imagePlaceholder: {
    height: '100px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '30px',
    marginBottom: '10px'
  },
  name: { fontSize: '16px', margin: '5px 0', color: '#1a1a1a' },
  category: { fontSize: '12px', color: '#888', marginBottom: '10px' },
  details: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  price: { fontWeight: 'bold', fontSize: '17px', color: '#0C831F' },
  stock: { fontSize: '13px' }
};

export default ProductCard;
