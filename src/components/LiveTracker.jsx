import React from 'react';

const LiveTracker = ({ step }) => {
  const labels = ["Received", "Packing", "Out for Delivery", "Arrived"];
  return (
    <div style={styles.container}>
      {labels.map((label, i) => (
        <div key={label} style={styles.stepContainer}>
          <div style={{
            ...styles.circle,
            backgroundColor: i <= step ? '#4ade80' : '#334155',
            boxShadow: i === step ? '0 0 10px #4ade80' : 'none'
          }}>{i < step ? '✓' : i + 1}</div>
          <span style={{...styles.label, color: i <= step ? '#fff' : '#64748b'}}>{label}</span>
          {i < 3 && <div style={{...styles.line, backgroundColor: i < step ? '#4ade80' : '#334155'}} />}
        </div>
      ))}
    </div>
  );
};

const styles = {
  container: { display: 'flex', justifyContent: 'space-between', padding: '20px', background: '#1e293b', borderRadius: '12px', margin: '20px 0', position: 'relative' },
  stepContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, zIndex: 2 },
  circle: { width: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' },
  label: { fontSize: '10px', marginTop: '8px' },
  line: { position: 'absolute', height: '2px', width: '20%', top: '35px', left: 'calc(12% + (i * 25%))', zIndex: 1 }
};

export default LiveTracker;