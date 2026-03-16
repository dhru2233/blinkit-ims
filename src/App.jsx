import React from 'react'
import Navbar from './components/Navbar'

function App() {
  return (
    <div style={{ backgroundColor: '#fff', minHeight: '100vh' }}>
      <Navbar />
      
      {/* Main Content Area */}
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2 style={{ color: '#333' }}>Inventory Dashboard</h2>
        <p style={{ color: '#666' }}>Welcome to your Blinkit-style Management System.</p>
        
        {/* We will add the Inventory Table here next! */}
      </div>
    </div>
  )
}

export default App