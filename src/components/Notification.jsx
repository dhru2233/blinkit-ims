import React, { useEffect } from 'react';

const Notification = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000); // Auto-close after 3 seconds
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div style={styles.toast}>
      <span style={{ marginRight: '10px' }}>🔔</span>
      {message}
    </div>
  );
};

const styles = {
  toast: {
    position: 'fixed',
    bottom: '30px',
    right: '30px',
    backgroundColor: '#4ade80',
    color: '#0f172a',
    padding: '15px 25px',
    borderRadius: '12px',
    fontWeight: 'bold',
    boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
    zIndex: 3000,
    animation: 'slideIn 0.3s ease-out',
  }
};

export default Notification;