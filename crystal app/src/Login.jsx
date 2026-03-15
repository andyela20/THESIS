import React, { useState } from 'react';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState(false);

  const handleLogin = () => {
    if (!username.trim() || !password) { setError(true); return; }
    setError(false);
    onLogin();
  };

  return (
    <div style={styles.loginWrap}>
      <div style={styles.bgTop}></div>
      <div style={styles.bgBl}></div>
      <div style={styles.bgBr}></div>

      <div style={styles.loginBox}>
        <div style={styles.lgLeft}>
          <div style={styles.lgTitle}>WELCOME</div>

          <div style={styles.lgGroup}>
            <label style={styles.label}>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="Enter your username"
              style={styles.input}
            />
          </div>

          <div style={styles.lgGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="Enter your password"
              style={styles.input}
            />
          </div>

          {error && <div style={styles.lgErr}>Incorrect username or password. Please try again.</div>}

          <div style={styles.lgOpts}>
            <label style={styles.lgCheck}>
              <input type="checkbox" style={{ marginRight: '7px' }} />
              Remember me
            </label>
            <a href="#" style={styles.lgForgot}>Forgot Password?</a>
          </div>

          <button onClick={handleLogin} className="btn-login-submit">SUBMIT</button>
        </div>

        <div style={styles.lgRight}>
          <div style={styles.lgMonitor}>
            <div style={styles.lgScreenWrap}>
              <div style={styles.lgDots}>
                <div style={styles.lgDot}></div>
                <div style={styles.lgDot}></div>
                <div style={styles.lgDot}></div>
              </div>
              <div style={styles.lgScreen}>
                <div style={styles.lgLock}>🔒</div>
                <div style={styles.lgScreenText}>WELCOME</div>
              </div>
            </div>
            <div style={styles.lgStand}></div>
            <div style={styles.lgBase}></div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  loginWrap: { position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f5f7f2 0%, #e8f0e0 100%)', overflow: 'hidden' },
  bgTop: { position: 'absolute', top: '-100px', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '400px', background: '#588157', borderRadius: '0 0 200px 200px', opacity: 0.3, pointerEvents: 'none' },
  bgBl:  { position: 'absolute', bottom: '-100px', left: '-100px', width: '400px', height: '400px', background: '#ffd700', borderRadius: '50%', opacity: 0.3, pointerEvents: 'none' },
  bgBr:  { position: 'absolute', bottom: '-50px',  right: '-50px',  width: '350px', height: '350px', background: '#2d5a27', borderRadius: '50%', opacity: 0.2, pointerEvents: 'none' },
  loginBox: { background: '#fff', borderRadius: '20px', padding: '60px 80px', width: '90%', maxWidth: '1100px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', boxShadow: '0 20px 60px rgba(0,0,0,0.12)', position: 'relative', zIndex: 10 },
  lgLeft:   { display: 'flex', flexDirection: 'column', justifyContent: 'center' },
  lgTitle:  { fontSize: '36px', fontWeight: 700, color: '#2d5a27', marginBottom: '40px', letterSpacing: '1px' },
  lgGroup:  { marginBottom: '26px' },
  label:    { display: 'block', fontSize: '13px', color: '#4a6645', marginBottom: '8px', fontWeight: 600, letterSpacing: '0.4px' },
  input:    { width: '100%', padding: '14px 0', border: 'none', borderBottom: '2px solid #d4dccf', fontSize: '14px', color: '#1a3a1a', background: 'transparent', outline: 'none', transition: 'border-color 0.25s', boxSizing: 'border-box' },
  lgOpts:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '34px', fontSize: '13px' },
  lgCheck:  { display: 'flex', alignItems: 'center', gap: '7px', cursor: 'pointer', color: '#4a6645' },
  lgForgot: { color: '#2d5a27', textDecoration: 'none', fontWeight: 600 },
  lgErr:    { fontSize: '12px', color: '#E24B4A', marginTop: '-16px', marginBottom: '10px' },
  lgRight:  { display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', minHeight: '420px' },
  lgMonitor: { width: '280px', flexShrink: 0 },
  lgScreenWrap: { background: 'linear-gradient(135deg, #588157 0%, #2d5a27 100%)', borderRadius: '16px 16px 0 0', padding: '16px', boxShadow: '0 20px 50px rgba(45,90,39,0.2)' },
  lgDots:   { display: 'flex', gap: '8px', marginBottom: '14px' },
  lgDot:    { width: '10px', height: '10px', borderRadius: '50%', background: '#fff', opacity: 0.65 },
  lgScreen: { background: '#fff', borderRadius: '8px', padding: '28px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '14px', height: '150px' },
  lgLock:   { fontSize: '36px' },
  lgScreenText: { fontSize: '17px', fontWeight: 700, color: '#2d5a27', letterSpacing: '0.5px' },
  lgStand:  { width: '90px', height: '18px', background: 'linear-gradient(135deg, #9ab890 0%, #a0aaa0 100%)', margin: '0 auto', borderRadius: '0 0 10px 10px' },
  lgBase:   { width: '130px', height: '8px', background: '#c8d4c4', margin: '0 auto', borderRadius: '4px' },
};