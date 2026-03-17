import React, { useState } from 'react';

const Login = ({ onLogin }) => {
  const [pass, setPass] = useState("");

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2 style={{color: '#fff'}}>Admin Access</h2>
        <p style={{color: '#64748b', fontSize: '14px'}}>Enter password to manage warehouse</p>
        <input 
          type="password" 
          placeholder="Enter Password (try: admin123)" 
          style={styles.input}
          onChange={(e) => setPass(e.target.value)}
        />
        <button 
          onClick={() => pass === "admin123" ? onLogin(true) : alert("Wrong Password")}
          style={styles.btn}
        >
          Login to Dashboard
        </button>
        <button onClick={() => onLogin(false)} style={styles.guestBtn}>
          Continue as Customer
        </button>
      </div>
    </div>
  );
};

const styles = {
  overlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15, 23, 42, 0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 },
  modal: { background: '#1e293b', padding: '40px', borderRadius: '16px', textAlign: 'center', border: '1px solid #334155', width: '350px' },
  input: { width: '100%', padding: '12px', margin: '20px 0', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff' },
  btn: { width: '100%', padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#F8CB46', fontWeight: 'bold', cursor: 'pointer' },
  guestBtn: { background: 'none', border: 'none', color: '#64748b', marginTop: '15px', cursor: 'pointer', textDecoration: 'underline' }
};

export default Login;