import React from 'react';

const OrderTracker = ({ status }) => {
  const steps = ["Placed", "Confirmed", "Packing", "On the Way", "Delivered"];
  const currentIdx = steps.indexOf(status);

  return (
    <div style={styles.container}>
      {steps.map((step, index) => (
        <div key={step} style={styles.stepWrapper}>
          <div style={{
            ...styles.circle,
            backgroundColor: index <= currentIdx ? '#F8CB46' : '#334155',
            boxShadow: index === currentIdx ? '0 0 15px #F8CB46' : 'none'
          }}>
            {index < currentIdx ? '✓' : index + 1}
          </div>
          <span style={{...styles.label, color: index <= currentIdx ? '#fff' : '#64748b'}}>{step}</span>
          {index < steps.length - 1 && <div style={styles.line} />}
        </div>
      ))}
    </div>
  );
};

const styles = {
  container: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px', background: '#1e293b', borderRadius: '12px', marginTop: '20px' },
  stepWrapper: { display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, position: 'relative' },
  circle: { width: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', color: '#0f172a', zIndex: 2 },
  label: { fontSize: '10px', marginTop: '8px', fontWeight: '600' },
  line: { position: 'absolute', height: '2px', background: '#334155', width: '100%', top: '15px', left: '50%', zIndex: 1 }
};

export default OrderTracker;