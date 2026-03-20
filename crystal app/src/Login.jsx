import React, { useState } from 'react';

export default function Login({ onLogin }) {
  const [mode, setMode]         = useState('login'); // 'login' or 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [loading, setLoading]   = useState(false);

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

  return (
    <div style={styles.loginWrap}>
      <div style={styles.bgTop}></div>
      <div style={styles.bgBl}></div>
      <div style={styles.bgBr}></div>

      <div style={styles.loginBox}>
        <div style={styles.lgLeft}>
          <div style={styles.lgTitle}>
            {mode === 'login' ? 'WELCOME TO CRYSTALSCOPE' : 'CREATE ACCOUNT'}
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
            {loading ? 'PLEASE WAIT...' : mode === 'login' ? 'SUBMIT' : 'CREATE ACCOUNT'}
          </button>

          {/* Toggle link */}
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

        <div style={styles.lgRight}>
          <div style={styles.lgMonitor}>
            <div style={styles.lgScreenWrap}>
              <div style={styles.lgDots}>
                <div style={styles.lgDot}></div>
                <div style={styles.lgDot}></div>
                <div style={styles.lgDot}></div>
              </div>
              <div style={styles.lgScreen}>
                <div style={styles.lgLock}>{mode === 'login' ? '🔒' : '✨'}</div>
                <div style={styles.lgScreenText}>{mode === 'login' ? 'WELCOME' : 'REGISTER'}</div>
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
  loginWrap:  { position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f5f7f2 0%, #e8f0e0 100%)', overflow: 'hidden' },
  bgTop:      { position: 'absolute', top: '-100px', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '400px', background: '#588157', borderRadius: '0 0 200px 200px', opacity: 0.3, pointerEvents: 'none' },
  bgBl:       { position: 'absolute', bottom: '-100px', left: '-100px', width: '400px', height: '400px', background: '#ffd700', borderRadius: '50%', opacity: 0.3, pointerEvents: 'none' },
  bgBr:       { position: 'absolute', bottom: '-50px', right: '-50px', width: '350px', height: '350px', background: '#2d5a27', borderRadius: '50%', opacity: 0.2, pointerEvents: 'none' },
  loginBox:   { background: '#fff', borderRadius: '20px', padding: '60px 80px', width: '90%', maxWidth: '1100px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', boxShadow: '0 20px 60px rgba(0,0,0,0.12)', position: 'relative', zIndex: 10 },
  lgLeft:     { display: 'flex', flexDirection: 'column', justifyContent: 'center' },
  lgTitle:    { fontSize: '33px', fontWeight: 700, color: '#2d5a27', marginBottom: '40px', letterSpacing: '1px' },
  lgGroup:    { marginBottom: '26px' },
  label:      { display: 'block', fontSize: '13px', color: '#4a6645', marginBottom: '8px', fontWeight: 600, letterSpacing: '0.4px' },
  input:      { width: '100%', padding: '14px 0', border: 'none', borderBottom: '2px solid #d4dccf', fontSize: '14px', color: '#1a3a1a', background: 'transparent', outline: 'none', transition: 'border-color 0.25s', boxSizing: 'border-box' },
  lgOpts:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '34px', fontSize: '13px' },
  lgCheck:    { display: 'flex', alignItems: 'center', gap: '7px', cursor: 'pointer', color: '#4a6645' },
  lgForgot:   { color: '#E24B4A', textDecoration: 'none', fontWeight: 400 },
  lgErr:      { fontSize: '12px', color: '#E24B4A', marginTop: '-16px', marginBottom: '10px' },
  lgSuccess:  { fontSize: '12px', color: '#1FB505', marginTop: '-16px', marginBottom: '10px', fontWeight: 600 },
  lgRight:    { display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', minHeight: '420px' },
  lgMonitor:  { width: '280px', flexShrink: 0 },
  lgScreenWrap: { background: 'linear-gradient(135deg, #588157 0%, #2d5a27 100%)', borderRadius: '16px 16px 0 0', padding: '16px', boxShadow: '0 20px 50px rgba(45,90,39,0.2)' },
  lgDots:     { display: 'flex', gap: '8px', marginBottom: '14px' },
  lgDot:      { width: '10px', height: '10px', borderRadius: '50%', background: '#fff', opacity: 0.65 },
  lgScreen:   { background: '#fff', borderRadius: '8px', padding: '28px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '14px', height: '150px' },
  lgLock:     { fontSize: '36px' },
  lgScreenText: { fontSize: '17px', fontWeight: 700, color: '#2d5a27', letterSpacing: '0.5px' },
  lgStand:    { width: '90px', height: '18px', background: 'linear-gradient(135deg, #9ab890 0%, #a0aaa0 100%)', margin: '0 auto', borderRadius: '0 0 10px 10px' },
  lgBase:     { width: '130px', height: '8px', background: '#c8d4c4', margin: '0 auto', borderRadius: '4px' },
  toggleWrap: { display: 'flex', alignItems: 'center', gap: '8px', marginTop: '20px', justifyContent: 'center' },
  toggleText: { fontSize: '13px', color: '#4a6645' },
  toggleBtn:  { fontSize: '13px', fontWeight: 700, color: '#2d5a27', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 },
};