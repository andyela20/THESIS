import React, { useState, useRef } from 'react';
import logo from './assets/logo.png';
import logoBg from './assets/LOGOGRAPHIC.png';

const API_BASE = 'http://localhost:5000';

export default function Login({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleHovered, setGoogleHovered] = useState(false);

  const popupRef = useRef(null);
  const pollRef = useRef(null);

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setConfirmPass('');
    setError('');
    setSuccess('');
  };

  const saveLogin = (data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('username', data.username || data.user?.username || 'Google User');

    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
    }

    onLogin();
  };

  const handleLogin = async () => {
    if (!username.trim() || !password) {
      setError('Please enter username and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Invalid credentials');
        setLoading(false);
        return;
      }

      saveLogin(data);
    } catch (err) {
      setError('Cannot connect to server. Make sure backend is running.');
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!username.trim() || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPass) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Registration failed');
        setLoading(false);
        return;
      }

      setSuccess('Account created! You can now login.');
      setLoading(false);

      setTimeout(() => {
        setMode('login');
        resetForm();
      }, 1500);
    } catch (err) {
      setError('Cannot connect to server. Make sure backend is running.');
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setSuccess('');
    setGoogleLoading(true);

    const state =
      window.crypto?.randomUUID?.() ||
      `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    const googleUrl = `${API_BASE}/api/auth/google?state=${encodeURIComponent(state)}`;

    try {
      popupRef.current = window.open(
        googleUrl,
        'magnitect_google_login',
        'width=520,height=720,menubar=no,toolbar=no,location=yes,status=no'
      );

      if (!popupRef.current) {
        setGoogleLoading(false);
        setError('Popup was blocked. Please allow popups and try again.');
        return;
      }

      let attempts = 0;
      const maxAttempts = 120;

      pollRef.current = window.setInterval(async () => {
        attempts += 1;

        try {
          const response = await fetch(`${API_BASE}/api/auth/google/status/${encodeURIComponent(state)}`);
          const data = await response.json();

          if (data.success && data.token) {
            window.clearInterval(pollRef.current);
            pollRef.current = null;

            try {
              popupRef.current?.close();
            } catch {}

            setGoogleLoading(false);
            saveLogin(data);
            return;
          }

          if (response.status === 404 || attempts >= maxAttempts) {
            window.clearInterval(pollRef.current);
            pollRef.current = null;
            setGoogleLoading(false);
            setError('Google sign-in expired. Please try again.');
          }
        } catch {
          if (attempts >= maxAttempts) {
            window.clearInterval(pollRef.current);
            pollRef.current = null;
            setGoogleLoading(false);
            setError('Google sign-in could not be completed.');
          }
        }
      }, 1000);
    } catch {
      setGoogleLoading(false);
      setError('Google sign-in could not be started.');
    }
  };

  const FEATURES = [
    {
      icon: 'AI',
      title: 'AI Particle Detection',
      desc: 'Automated identification of urinary particles and crystal types using deep learning.'
    },
    {
      icon: 'PDF',
      title: 'Detailed Reports',
      desc: 'Generate patient reports with image results, summaries, and clinical interpretation aids.'
    },
    {
      icon: 'DB',
      title: 'Patient Management',
      desc: 'Organize patient records, samples, analysis history, and saved findings.'
    },
  ];

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      mode === 'login' ? handleLogin() : handleRegister();
    }
  };

  return (
    <div style={styles.loginWrap}>
      <div style={styles.bgTop} />
      <div style={styles.bgBl} />
      <div style={styles.bgBr} />

      <div style={styles.loginBox}>
        <div style={styles.lgLeft}>
          <img src={logo} alt="Magnitect Logo" style={styles.logoImg} />

          {mode === 'register' && (
            <div style={styles.lgTitle}>CREATE ACCOUNT</div>
          )}

          <div style={styles.lgGroup}>
            <label style={styles.label}>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={handleKeyDown}
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
              onKeyDown={handleKeyDown}
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
                onKeyDown={handleKeyDown}
                placeholder="Confirm your password"
                style={styles.input}
              />
            </div>
          )}

          {error && <div style={styles.lgErr}>{error}</div>}
          {success && <div style={styles.lgSuccess}>{success}</div>}

          {mode === 'login' && (
            <div style={styles.lgOpts}>
              <label style={styles.lgCheck}>
                <input type="checkbox" style={{ marginRight: '7px' }} />
                Remember me
              </label>
              <a href="#forgot" style={styles.lgForgot}>Forgot Password?</a>
            </div>
          )}

          <button
            onClick={mode === 'login' ? handleLogin : handleRegister}
            className="btn-login-submit"
            disabled={loading || googleLoading}
            style={{ opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'PLEASE WAIT...' : mode === 'login' ? 'LOGIN' : 'CREATE ACCOUNT'}
          </button>

          <div style={styles.dividerWrap}>
            <div style={styles.dividerLine} />
            <span style={styles.dividerText}>or continue with</span>
            <div style={styles.dividerLine} />
          </div>

          <button
            onClick={handleGoogleLogin}
            onMouseEnter={() => setGoogleHovered(true)}
            onMouseLeave={() => setGoogleHovered(false)}
            disabled={loading || googleLoading}
            style={{
              ...styles.googleBtn,
              borderColor: googleHovered ? '#588157' : '#d4dccf',
              background: googleHovered ? '#f4f9f4' : '#fff',
              boxShadow: googleHovered ? '0 4px 16px rgba(88,129,87,0.18)' : 'none',
              transform: googleHovered ? 'translateY(-2px)' : 'translateY(0)',
              color: googleHovered ? '#2d5a27' : '#1a3a1a',
              opacity: googleLoading ? 0.75 : 1,
            }}
          >
            <img
              src="https://developers.google.com/identity/images/g-logo.png"
              alt="Google"
              style={{
                width: '18px',
                height: '18px',
                transform: googleHovered ? 'scale(1.1)' : 'scale(1)',
                transition: 'transform 0.2s ease',
              }}
            />
            {googleLoading
              ? 'Waiting for Google...'
              : mode === 'login'
                ? 'Sign in with Google'
                : 'Sign up with Google'}
          </button>

          <div style={styles.toggleWrap}>
            {mode === 'login' ? (
              <>
                <span style={styles.toggleText}>Don't have an account?</span>
                <button
                  onClick={() => {
                    setMode('register');
                    resetForm();
                  }}
                  style={styles.toggleBtn}
                >
                  Create Account
                </button>
              </>
            ) : (
              <>
                <span style={styles.toggleText}>Already have an account?</span>
                <button
                  onClick={() => {
                    setMode('login');
                    resetForm();
                  }}
                  style={styles.toggleBtn}
                >
                  Back to Login
                </button>
              </>
            )}
          </div>
        </div>

        <div style={styles.rightPanel}>
          <img src={logoBg} alt="" style={styles.rightBgLogo} />
          <div style={styles.rightInner}>
            <h2 style={styles.rightHeading}>Welcome to MagniTect</h2>
            <p style={styles.rightSub}>
              Detect and classify urinary particles with precision using advanced image recognition technology.
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

            <div style={styles.noticeBox}>
              Google sign-in is configured for local testing. For AWS deployment, use an HTTPS domain callback.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  loginWrap: {
    position: 'fixed',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #f5f7f2 0%, #e8f0e0 100%)',
    overflow: 'hidden',
  },

  bgTop: {
    position: 'absolute',
    top: '-100px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '600px',
    height: '400px',
    background: '#588157',
    borderRadius: '0 0 200px 200px',
    opacity: 0.3,
    pointerEvents: 'none',
  },

  bgBl: {
    position: 'absolute',
    bottom: '-100px',
    left: '-100px',
    width: '400px',
    height: '400px',
    background: '#ffd700',
    borderRadius: '50%',
    opacity: 0.3,
    pointerEvents: 'none',
  },

  bgBr: {
    position: 'absolute',
    bottom: '-50px',
    right: '-50px',
    width: '350px',
    height: '350px',
    background: '#2d5a27',
    borderRadius: '50%',
    opacity: 0.2,
    pointerEvents: 'none',
  },

  loginBox: {
    background: '#fff',
    borderRadius: '20px',
    padding: '60px 80px',
    width: '90%',
    maxWidth: '1100px',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '60px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
    position: 'relative',
    zIndex: 10,
  },

  lgLeft: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },

  logoImg: {
    height: '80px',
    width: 'auto',
    marginBottom: '14px',
    objectFit: 'contain',
    alignSelf: 'flex-start',
  },

  lgTitle: {
    fontSize: '33px',
    fontWeight: 700,
    color: '#2d5a27',
    marginBottom: '40px',
    letterSpacing: '1px',
  },

  lgGroup: {
    marginBottom: '15px',
  },

  label: {
    display: 'block',
    fontSize: '13px',
    color: '#4a6645',
    marginBottom: '8px',
    fontWeight: 600,
    letterSpacing: '0.4px',
  },

  input: {
    width: '100%',
    padding: '14px 0',
    border: 'none',
    borderBottom: '2px solid #d4dccf',
    fontSize: '14px',
    color: '#1a3a1a',
    background: 'transparent',
    outline: 'none',
    transition: 'border-color 0.25s',
    boxSizing: 'border-box',
  },

  lgOpts: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '34px',
    fontSize: '13px',
  },

  lgCheck: {
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
    cursor: 'pointer',
    color: '#4a6645',
  },

  lgForgot: {
    color: '#E24B4A',
    textDecoration: 'none',
    fontWeight: 400,
  },

  lgErr: {
    fontSize: '12px',
    color: '#E24B4A',
    marginTop: '-6px',
    marginBottom: '10px',
    lineHeight: 1.45,
  },

  lgSuccess: {
    fontSize: '12px',
    color: '#1FB505',
    marginTop: '-6px',
    marginBottom: '10px',
    fontWeight: 600,
  },

  dividerWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    margin: '20px 0 12px',
  },

  dividerLine: {
    flex: 1,
    height: '1px',
    background: '#d4dccf',
  },

  dividerText: {
    fontSize: '12px',
    color: '#8aab82',
    whiteSpace: 'nowrap',
  },

  googleBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    width: '100%',
    padding: '12px',
    border: '2px solid #d4dccf',
    borderRadius: '8px',
    background: '#fff',
    fontSize: '14px',
    fontWeight: 600,
    color: '#1a3a1a',
    cursor: 'pointer',
    transition: 'border-color 0.25s, box-shadow 0.25s, transform 0.25s, background 0.25s, color 0.25s',
    marginBottom: '4px',
  },

  toggleWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '16px',
    justifyContent: 'center',
  },

  toggleText: {
    fontSize: '13px',
    color: '#4a6645',
  },

  toggleBtn: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#2d5a27',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    textDecoration: 'underline',
    padding: 0,
  },

  rightPanel: {
    background: 'linear-gradient(160deg, #588157 0%, #2d5a27 100%)',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 40px',
    position: 'relative',
    overflow: 'hidden',
  },

  rightBgLogo: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '125%',
    height: 'auto',
    opacity: 0.10,
    filter: 'brightness(0) invert(1)',
    pointerEvents: 'none',
    userSelect: 'none',
  },

  rightInner: {
    color: '#fff',
    position: 'relative',
    zIndex: 1,
  },

  rightHeading: {
    fontSize: '22px',
    fontWeight: 700,
    color: '#fff',
    margin: '0 0 12px 0',
  },

  rightSub: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.82)',
    lineHeight: 1.65,
    margin: '0 0 28px 0',
  },

  featureList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },

  featureItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '14px',
  },

  featureIcon: {
    minWidth: '38px',
    height: '28px',
    borderRadius: '8px',
    background: 'rgba(255,255,255,0.16)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '10px',
    fontWeight: 800,
    color: '#fff',
    flexShrink: 0,
    marginTop: '2px',
  },

  featureTitle: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#fff',
    marginBottom: '4px',
  },

  featureDesc: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 1.5,
  },

  noticeBox: {
    marginTop: '28px',
    padding: '10px 12px',
    borderRadius: '10px',
    background: 'rgba(255,255,255,0.12)',
    border: '1px solid rgba(255,255,255,0.20)',
    fontSize: '11px',
    lineHeight: 1.45,
    color: 'rgba(255,255,255,0.82)',
  },
};
