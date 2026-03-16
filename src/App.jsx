import React from 'react'
import Navbar from './components/Navbar'
import ProductCard from './components/ProductCard'

function App() {
  // Sample data (In the future, this will come from your MySQL database)
  const products = [
    { id: 1, name: "Amul Gold Milk", price: 66, stock: 12, category: "Dairy" },
    { id: 2, name: "Harvest Gold Bread", price: 50, stock: 3, category: "Bakery" },
    { id: 3, name: "Lay's Classic Chips", price: 20, stock: 45, category: "Snacks" },
    { id: 4, name: "Maggi Noodles", price: 14, stock: 20, category: "Instant Food" },
  ];

  return (
    <div style={{ backgroundColor: '#fff', minHeight: '100vh' }}>
      <Navbar />
      
      <div style={{ padding: '40px' }}>
        <h2 style={{ marginBottom: '20px' }}>Inventory Overview</h2>
        
        {/* The Grid Layout */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
          gap: '20px' 
        }}>
          {products.map(product => (
            <ProductCard 
              key={product.id}
              name={product.name}
              price={product.price}
              stock={product.stock}
              category={product.category}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default App