import React, { useState } from 'react';

export default function Login({ onLogin }) {
  const [mode, setMode]               = useState('login');
  const [username, setUsername]       = useState('');
  const [password, setPassword]       = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [error, setError]             = useState('');
  const [success, setSuccess]         = useState('');
  const [loading, setLoading]         = useState(false);

  const resetForm = () => {
    setUsername(''); setPassword(''); setConfirmPass('');
    setError(''); setSuccess('');
  };

  const handleLogin = async () => {
    if (!username.trim() || !password) { setError('Please enter username and password'); return; }
    setLoading(true); setError('');
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (!response.ok) { setError(data.message || 'Invalid credentials'); setLoading(false); return; }
      localStorage.setItem('token', data.token);
      localStorage.setItem('username', data.username);
      setLoading(false);
      onLogin();
    } catch (err) {
      setError('Cannot connect to server. Make sure backend is running.');
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!username.trim() || !password) { setError('Please fill in all fields'); return; }
    if (password !== confirmPass) { setError('Passwords do not match'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true); setError('');
    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (!response.ok) { setError(data.message || 'Registration failed'); setLoading(false); return; }
      setSuccess('Account created! You can now login.');
      setLoading(false);
      setTimeout(() => { setMode('login'); resetForm(); }, 1500);
    } catch (err) {
      setError('Cannot connect to server. Make sure backend is running.');
      setLoading(false);
    }
  };

  const FEATURES = [
    { title: 'AI Crystal Detection', desc: 'Automated identification of urinary crystal types with high accuracy.' },
    { title: 'Detailed Reports',     desc: 'Generate comprehensive patient reports with crystal analysis data.' },
    { title: 'Patient Management',   desc: 'Organize and track patient samples and analysis history.' },
  ];

  return (
    <div style={styles.loginWrap}>
      <div style={styles.bgTop} />
      <div style={styles.bgBl} />
      <div style={styles.bgBr} />

      <div style={styles.loginBox}>

        {/* ── LEFT PANEL ── */}
        <div style={styles.lgLeft}>
          <div style={styles.lgTitle}>
            {mode === 'login' ? 'Welcome to MagniTect' : 'CREATE ACCOUNT'}
          </div>

          <div style={styles.lgGroup}>
            <label style={styles.label}>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (mode === 'login' ? handleLogin() : handleRegister())}
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
              onKeyDown={(e) => e.key === 'Enter' && (mode === 'login' ? handleLogin() : handleRegister())}
              placeholder="Enter your password"
              style={styles.input}
            />
          </div>

          {mode === 'register' && (
            <div style={styles.lgGroup}>
              <label style={styles.label}>Confirm Password</label>
              <input
                type="password"
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
                placeholder="Confirm your password"
                style={styles.input}
              />
            </div>
          )}

          {error   && <div style={styles.lgErr}>{error}</div>}
          {success && <div style={styles.lgSuccess}>{success}</div>}

          {mode === 'login' && (
            <div style={styles.lgOpts}>
              <label style={styles.lgCheck}>
                <input type="checkbox" style={{ marginRight: '7px' }} />
                Remember me
              </label>
              <a href="#" style={styles.lgForgot}>Forgot Password?</a>
            </div>
          )}

          <button
            onClick={mode === 'login' ? handleLogin : handleRegister}
            className="btn-login-submit"
            disabled={loading}
            style={{ opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'PLEASE WAIT...' : mode === 'login' ? 'LOGIN' : 'CREATE ACCOUNT'}
          </button>

          <div style={styles.toggleWrap}>
            {mode === 'login' ? (
              <>
                <span style={styles.toggleText}>Don't have an account?</span>
                <button onClick={() => { setMode('register'); resetForm(); }} style={styles.toggleBtn}>
                  Create Account
                </button>
              </>
            ) : (
              <>
                <span style={styles.toggleText}>Already have an account?</span>
                <button onClick={() => { setMode('login'); resetForm(); }} style={styles.toggleBtn}>
                  Back to Login
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div style={styles.rightPanel}>
          <div style={styles.rightInner}>
            <h2 style={styles.rightHeading}>AI-Powered Urinalysis</h2>
            <p style={styles.rightSub}>
              Detect and classify urinary crystals with precision using advanced image recognition technology.
            </p>
            <ul style={styles.featureList}>
              {FEATURES.map((f) => (
                <li key={f.title} style={styles.featureItem}>
                  <span style={styles.featureIcon}>{f.icon}</span>
                  <div>
                    <div style={styles.featureTitle}>{f.title}</div>
                    <div style={styles.featureDesc}>{f.desc}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}

const styles = {
  /* ── page background ── */
  loginWrap:    { position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f5f7f2 0%, #e8f0e0 100%)', overflow: 'hidden' },
  bgTop:        { position: 'absolute', top: '-100px', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '400px', background: '#588157', borderRadius: '0 0 200px 200px', opacity: 0.3, pointerEvents: 'none' },
  bgBl:         { position: 'absolute', bottom: '-100px', left: '-100px', width: '400px', height: '400px', background: '#ffd700', borderRadius: '50%', opacity: 0.3, pointerEvents: 'none' },
  bgBr:         { position: 'absolute', bottom: '-50px', right: '-50px', width: '350px', height: '350px', background: '#2d5a27', borderRadius: '50%', opacity: 0.2, pointerEvents: 'none' },

  /* ── card ── */
  loginBox:     { background: '#fff', borderRadius: '20px', padding: '60px 80px', width: '90%', maxWidth: '1100px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', boxShadow: '0 20px 60px rgba(0,0,0,0.12)', position: 'relative', zIndex: 10 },

  /* ── left panel ── */
  lgLeft:       { display: 'flex', flexDirection: 'column', justifyContent: 'center' },
  lgTitle:      { fontSize: '33px', fontWeight: 700, color: '#2d5a27', marginBottom: '40px', letterSpacing: '1px' },
  lgGroup:      { marginBottom: '26px' },
  label:        { display: 'block', fontSize: '13px', color: '#4a6645', marginBottom: '8px', fontWeight: 600, letterSpacing: '0.4px' },
  input:        { width: '100%', padding: '14px 0', border: 'none', borderBottom: '2px solid #d4dccf', fontSize: '14px', color: '#1a3a1a', background: 'transparent', outline: 'none', transition: 'border-color 0.25s', boxSizing: 'border-box' },
  lgOpts:       { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '34px', fontSize: '13px' },
  lgCheck:      { display: 'flex', alignItems: 'center', gap: '7px', cursor: 'pointer', color: '#4a6645' },
  lgForgot:     { color: '#E24B4A', textDecoration: 'none', fontWeight: 400 },
  lgErr:        { fontSize: '12px', color: '#E24B4A', marginTop: '-16px', marginBottom: '10px' },
  lgSuccess:    { fontSize: '12px', color: '#1FB505', marginTop: '-16px', marginBottom: '10px', fontWeight: 600 },
  toggleWrap:   { display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', justifyContent: 'center' },
  toggleText:   { fontSize: '13px', color: '#4a6645' },
  toggleBtn:    { fontSize: '13px', fontWeight: 700, color: '#2d5a27', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 },

  /* ── right panel ── */
  rightPanel:   { background: 'linear-gradient(160deg, #588157 0%, #2d5a27 100%)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 40px' },
  rightInner:   { color: '#fff' },
  rightIcon:    { fontSize: '52px', marginBottom: '18px' },
  rightHeading: { fontSize: '22px', fontWeight: 700, color: '#fff', margin: '0 0 12px 0' },
  rightSub:     { fontSize: '14px', color: 'rgba(255,255,255,0.82)', lineHeight: 1.65, margin: '0 0 28px 0' },
  featureList:  { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '20px' },
  featureItem:  { display: 'flex', alignItems: 'flex-start', gap: '14px' },
  featureIcon:  { fontSize: '24px', flexShrink: 0, marginTop: '2px' },
  featureTitle: { fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '4px' },
  featureDesc:  { fontSize: '12px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 },
};