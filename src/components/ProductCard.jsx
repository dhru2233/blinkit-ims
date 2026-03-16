import React from 'react';

const ProductCard = ({ name, price, stock, category }) => {
  return (
    <div style={styles.card}>
      <div style={styles.imagePlaceholder}>📦</div>
      <h4 style={styles.name}>{name}</h4>
      <p style={styles.category}>{category}</p>
      <div style={styles.details}>
        <span style={styles.price}>₹{price}</span>
        <span style={{...styles.stock, color: stock < 5 ? 'red' : '#666'}}>
          Stock: {stock}
        </span>
      </div>
      <button style={styles.addButton}>Edit Stock</button>
    </div>
  );
};

const styles = {
  card: {
    width: '200px',
    border: '1px solid #eee',
    borderRadius: '12px',
    padding: '15px',
    textAlign: 'left',
    backgroundColor: '#fff',
    transition: '0.3s',
  },
  imagePlaceholder: {
    height: '120px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '40px',
    marginBottom: '10px'
  },
  name: { fontSize: '16px', margin: '5px 0' },
  category: { fontSize: '12px', color: '#888', marginBottom: '10px' },
  details: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  price: { fontWeight: 'bold', fontSize: '16px' },
  stock: { fontSize: '12px' },
  addButton: {
    width: '100%',
    marginTop: '15px',
    padding: '8px',
    borderRadius: '6px',
    border: '1px solid #0C831F',
    backgroundColor: '#fff',
    color: '#0C831F',
    fontWeight: '600',
    cursor: 'pointer'
  }
};

export default ProductCard;