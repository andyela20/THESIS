import React, { useState, useEffect, useRef } from 'react';
import logo from './assets/logo.png';
import logoBg from './assets/LOGOGRAPHIC.png';

const API_BASE = 'https://thesis-633l.onrender.com';

// ── Rate limiter: max 5 attempts per 60s ─────────────────────────────────────
const RATE_LIMIT = 5;
const RATE_WINDOW = 60 * 1000;

function useRateLimit() {
  const attempts = useRef([]);
  const isLocked = () => {
    const now = Date.now();
    attempts.current = attempts.current.filter(t => now - t < RATE_WINDOW);
    return attempts.current.length >= RATE_LIMIT;
  };
  const remaining = () => {
    const now = Date.now();
    attempts.current = attempts.current.filter(t => now - t < RATE_WINDOW);
    return RATE_LIMIT - attempts.current.length;
  };
  const record = () => attempts.current.push(Date.now());
  const lockoutSeconds = () => {
    if (!isLocked()) return 0;
    const oldest = Math.min(...attempts.current);
    return Math.ceil((RATE_WINDOW - (Date.now() - oldest)) / 1000);
  };
  return { isLocked, record, remaining, lockoutSeconds };
}

// ── Inject animations once ───────────────────────────────────────────────────
function injectLoginStyles() {
  if (document.getElementById('login-anim')) return;
  const el = document.createElement('style');
  el.id = 'login-anim';
  el.textContent = `
    @keyframes loginFadeIn  { from { opacity:0; transform:translateY(18px) scale(0.98); } to { opacity:1; transform:none; } }
    @keyframes loginShake   { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-6px)} 40%,80%{transform:translateX(6px)} }
    @keyframes loginSuccess { 0%{transform:scale(1)} 50%{transform:scale(1.04)} 100%{transform:scale(1)} }
    @keyframes modalIn      { from{opacity:0;transform:scale(0.94) translateY(10px)} to{opacity:1;transform:none} }
    @keyframes spin         { to{transform:rotate(360deg)} }
    .login-input:focus { border-bottom-color: #2d5a27 !important; }
    .login-input::placeholder { color: #b0c4b0; }
    .login-submit-btn:hover:not(:disabled) { background: #2d5a27 !important; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(45,90,39,0.35) !important; }
    .login-submit-btn:active:not(:disabled) { transform: translateY(0); }
  `;
  document.head.appendChild(el);
}

// ── Password strength ────────────────────────────────────────────────────────
function getPasswordStrength(pw) {
  if (!pw) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pw.length >= 8)               score++;
  if (/[A-Z]/.test(pw))             score++;
  if (/[0-9]/.test(pw))             score++;
  if (/[^A-Za-z0-9]/.test(pw))      score++;
  const map = [
    { label: '',         color: '' },
    { label: 'Weak',     color: '#E24B4A' },
    { label: 'Fair',     color: '#F5A623' },
    { label: 'Good',     color: '#4A7A9B' },
    { label: 'Strong',   color: '#1FB505' },
  ];
  return { score, ...map[score] };
}

// ── Forgot Password Modal ────────────────────────────────────────────────────
function ForgotPasswordModal({ onClose }) {
  const [email, setEmail]       = useState('');
  const [sent, setSent]         = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleSend = async () => {
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address.'); return;
    }
    setLoading(true); setError('');
    try {
      // Replace with your actual forgot-password endpoint
      const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      // We show success regardless to avoid user enumeration
      setSent(true);
    } catch {
      setError('Could not connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(8,18,10,0.55)', backdropFilter:'blur(5px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background:'#fff', borderRadius:'18px', width:'380px', maxWidth:'94vw', overflow:'hidden', boxShadow:'0 24px 64px rgba(0,0,0,0.22)', animation:'modalIn 0.24s cubic-bezier(0.34,1.2,0.64,1)', fontFamily:"'Poppins', sans-serif" }}>
        <div style={{ background:'#2d5a27', padding:'16px 20px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <div style={{ width:'30px', height:'30px', borderRadius:'8px', background:'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <div>
              <div style={{ fontSize:'14px', fontWeight:700, color:'#fff' }}>Reset Password</div>
              <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.6)' }}>We'll send a reset link to your email</div>
            </div>
          </div>
          <button onClick={onClose} style={{ width:'28px', height:'28px', borderRadius:'6px', border:'1px solid rgba(255,255,255,0.25)', background:'rgba(226,75,74,0.35)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
            <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1 1l7 7M8 1l-7 7" stroke="rgba(255,255,255,0.9)" strokeWidth="1.6" strokeLinecap="round"/></svg>
          </button>
        </div>

        <div style={{ padding:'24px' }}>
          {sent ? (
            <div style={{ textAlign:'center', padding:'8px 0 16px' }}>
              <div style={{ width:'56px', height:'56px', borderRadius:'50%', background:'#E8F5E8', border:'1.5px solid #B8E0AF', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1F5330" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div style={{ fontSize:'15px', fontWeight:700, color:'#141514', marginBottom:'8px' }}>Check your email</div>
              <div style={{ fontSize:'13px', color:'#6B7280', lineHeight:1.65 }}>
                If an account exists for <strong>{email}</strong>, a password reset link has been sent.
              </div>
              <button onClick={onClose} style={{ marginTop:'20px', padding:'10px 28px', background:'#2d5a27', color:'#fff', border:'none', borderRadius:'8px', fontSize:'13px', fontWeight:600, cursor:'pointer', fontFamily:"'Poppins', sans-serif" }}>
                Done
              </button>
            </div>
          ) : (
            <>
              <div style={{ fontSize:'13px', color:'#6B7280', marginBottom:'18px', lineHeight:1.6 }}>
                Enter your email address and we'll send you a link to reset your password.
              </div>
              <label htmlFor="forgot-email" style={{ display:'block', fontSize:'11px', fontWeight:700, color:'#4a6645', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'6px' }}>Email Address</label>
              <input
                id="forgot-email"
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="you@example.com"
                style={{ width:'100%', padding:'10px 12px', border:'1.5px solid #D8DAD0', borderRadius:'8px', fontSize:'13px', color:'#141514', background:'#F5F6F0', outline:'none', fontFamily:"'Poppins', sans-serif", boxSizing:'border-box', marginBottom:'6px' }}
                autoFocus
              />
              {error && <div style={{ fontSize:'11px', color:'#E24B4A', marginBottom:'4px' }}>{error}</div>}
              <div style={{ display:'flex', gap:'10px', marginTop:'16px' }}>
                <button onClick={onClose} style={{ flex:1, padding:'10px', borderRadius:'8px', border:'1.5px solid #D8DAD0', background:'#fff', fontSize:'13px', fontWeight:600, color:'#4A5240', cursor:'pointer', fontFamily:"'Poppins', sans-serif" }}>
                  Cancel
                </button>
                <button
                  onClick={handleSend}
                  disabled={loading}
                  style={{ flex:1, padding:'10px', borderRadius:'8px', border:'none', background:'#2d5a27', color:'#fff', fontSize:'13px', fontWeight:600, cursor: loading ? 'not-allowed' : 'pointer', fontFamily:"'Poppins', sans-serif", opacity: loading ? 0.7 : 1, display:'flex', alignItems:'center', justifyContent:'center', gap:'7px' }}
                >
                  {loading && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" style={{ animation:'spin 0.8s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>}
                  {loading ? 'Sending…' : 'Send Reset Link'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Login Component ─────────────────────────────────────────────────────
export default function Login({ onLogin }) {
  injectLoginStyles();

  const [mode, setMode]                   = useState('login');
  const [username, setUsername]           = useState('');
  const [password, setPassword]           = useState('');
  const [confirmPass, setConfirmPass]     = useState('');
  const [showPass, setShowPass]           = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [rememberMe, setRememberMe]       = useState(false);
  const [error, setError]                 = useState('');
  const [success, setSuccess]             = useState('');
  const [loading, setLoading]             = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [shake, setShake]                 = useState(false);
  const [showForgot, setShowForgot]       = useState(false);
  const [googleHovered, setGoogleHovered] = useState(false);
  const { isLocked, record, remaining, lockoutSeconds } = useRateLimit();
  const [lockoutTimer, setLockoutTimer]   = useState(0);

  // Load remembered username on mount
  useEffect(() => {
    const saved = localStorage.getItem('rememberedUsername');
    if (saved) { setUsername(saved); setRememberMe(true); }

    // Handle Google OAuth callback token in URL
    const params = new URLSearchParams(window.location.search);
    const token    = params.get('token');
    const uname    = params.get('username');
    if (token) {
      localStorage.setItem('token', token);
      if (uname) localStorage.setItem('username', uname);
      window.history.replaceState({}, '', window.location.pathname);
      onLogin();
    }
  }, []);

  // Lockout countdown
  useEffect(() => {
    if (lockoutTimer <= 0) return;
    const t = setTimeout(() => setLockoutTimer(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [lockoutTimer]);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const resetForm = () => {
    setUsername(''); setPassword(''); setConfirmPass('');
    setError(''); setSuccess('');
    setShowPass(false); setShowConfirmPass(false);
  };

  // ── Sanitize: strip leading/trailing whitespace, max length ────────────────
  const sanitize = (val, max = 64) => val.trim().slice(0, max);

  const handleLogin = async () => {
    if (isLocked()) {
      const secs = lockoutSeconds();
      setLockoutTimer(secs);
      setError(`Too many attempts. Please wait ${secs}s.`);
      triggerShake(); return;
    }
    const u = sanitize(username);
    const p = password.slice(0, 128);
    if (!u || !p) { setError('Please enter username and password.'); triggerShake(); return; }

    record();
    setLoading(true); setError('');
    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, password: p }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || 'Invalid credentials.');
        triggerShake(); setLoading(false); return;
      }
      // Remember me
      if (rememberMe) localStorage.setItem('rememberedUsername', u);
      else            localStorage.removeItem('rememberedUsername');

      localStorage.setItem('token', data.token);
      localStorage.setItem('username', data.username || u);
      setLoading(false);
      onLogin();
    } catch {
      setError('Cannot connect to server. Please try again.');
      triggerShake(); setLoading(false);
    }
  };

  const handleRegister = async () => {
    const u = sanitize(username, 32);
    const p = password.slice(0, 128);
    if (!u || !p) { setError('Please fill in all fields.'); triggerShake(); return; }
    if (u.length < 3) { setError('Username must be at least 3 characters.'); triggerShake(); return; }
    if (!/^[a-zA-Z0-9_]+$/.test(u)) { setError('Username can only contain letters, numbers, and underscores.'); triggerShake(); return; }
    if (p.length < 6) { setError('Password must be at least 6 characters.'); triggerShake(); return; }
    if (p !== confirmPass) { setError('Passwords do not match.'); triggerShake(); return; }

    setLoading(true); setError('');
    try {
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, password: p }),
      });
      const data = await response.json();
      if (!response.ok) { setError(data.message || 'Registration failed.'); triggerShake(); setLoading(false); return; }
      setSuccess('Account created! Redirecting to login…');
      setLoading(false);
      setTimeout(() => { setMode('login'); resetForm(); }, 1500);
    } catch {
      setError('Cannot connect to server. Please try again.');
      triggerShake(); setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setGoogleLoading(true);
    const isElectron = window.navigator.userAgent.includes('Electron');
    if (isElectron) {
      window.open(`${API_BASE}/api/auth/google`, '_blank');
      setGoogleLoading(false);
    } else {
      window.location.href = `${API_BASE}/api/auth/google`;
    }
  };

  const pwStrength = getPasswordStrength(password);

  const FEATURES = [
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          <circle cx="11" cy="11" r="3"/>
        </svg>
      ),
      title: 'AI Crystal Detection',
      desc: 'Automated identification of urinary crystal types with high accuracy.',
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
        </svg>
      ),
      title: 'Detailed Reports',
      desc: 'Generate comprehensive patient reports with crystal analysis data.',
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
      title: 'Patient Management',
      desc: 'Organize and track patient samples and analysis history.',
    },
  ];

  return (
    <div style={s.loginWrap}>
      <div style={s.bgTop} />
      <div style={s.bgBl} />
      <div style={s.bgBr} />

      <div style={{ ...s.loginBox, animation: 'loginFadeIn 0.45s ease both' }}>

        {/* ── LEFT PANEL ── */}
        <div style={{ ...s.lgLeft, animation: shake ? 'loginShake 0.45s ease' : 'none' }}>

          <img src={logo} alt="MagniTect Logo" style={s.logoImg} />

          {mode === 'register' && (
            <div style={s.lgTitle}>CREATE ACCOUNT</div>
          )}

          {/* Username */}
          <div style={s.lgGroup}>
            <label htmlFor="login-username" style={s.label}>Username</label>
            <div style={{ position: 'relative' }}>
              <input
                id="login-username"
                className="login-input"
                type="text"
                value={username}
                maxLength={32}
                onChange={e => { setUsername(e.target.value); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && (mode === 'login' ? handleLogin() : handleRegister())}
                placeholder="Enter your username"
                style={s.input}
                autoComplete="username"
                aria-describedby={error ? 'login-error' : undefined}
              />
            </div>
          </div>

          {/* Password */}
          <div style={s.lgGroup}>
            <label htmlFor="login-password" style={s.label}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="login-password"
                className="login-input"
                type={showPass ? 'text' : 'password'}
                value={password}
                maxLength={128}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && (mode === 'login' ? handleLogin() : handleRegister())}
                placeholder="Enter your password"
                style={{ ...s.input, paddingRight: '36px' }}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                title={showPass ? 'Hide password' : 'Show password'}
                style={s.eyeBtn}
                tabIndex={-1}
              >
                {showPass
                  ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A4AAA4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A4AAA4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>

            {/* Password strength bar — register only */}
            {mode === 'register' && password && (
              <div style={{ marginTop: '6px' }}>
                <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} style={{ flex: 1, height: '3px', borderRadius: '2px', background: i <= pwStrength.score ? pwStrength.color : '#E8EAE0', transition: 'background 0.25s' }} />
                  ))}
                </div>
                {pwStrength.label && (
                  <div style={{ fontSize: '10px', fontWeight: 600, color: pwStrength.color }}>{pwStrength.label} password</div>
                )}
              </div>
            )}
          </div>

          {/* Confirm Password — register only */}
          {mode === 'register' && (
            <div style={s.lgGroup}>
              <label htmlFor="login-confirm" style={s.label}>Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="login-confirm"
                  className="login-input"
                  type={showConfirmPass ? 'text' : 'password'}
                  value={confirmPass}
                  maxLength={128}
                  onChange={e => { setConfirmPass(e.target.value); setError(''); }}
                  onKeyDown={e => e.key === 'Enter' && handleRegister()}
                  placeholder="Confirm your password"
                  style={{ ...s.input, paddingRight: '36px', borderBottomColor: confirmPass && confirmPass !== password ? '#E24B4A' : undefined }}
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowConfirmPass(v => !v)} style={s.eyeBtn} tabIndex={-1}>
                  {showConfirmPass
                    ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A4AAA4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A4AAA4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
              {confirmPass && confirmPass !== password && (
                <div style={{ fontSize: '10px', color: '#E24B4A', marginTop: '4px' }}>Passwords do not match</div>
              )}
            </div>
          )}

          {/* Error / Success */}
          {error   && <div id="login-error" role="alert" style={s.lgErr}>{error}{lockoutTimer > 0 ? ` (${lockoutTimer}s)` : ''}</div>}
          {success && <div role="status"  style={s.lgSuccess}>{success}</div>}

          {/* Remember me + Forgot password — login only */}
          {mode === 'login' && (
            <div style={s.lgOpts}>
              <label htmlFor="remember-me" style={s.lgCheck}>
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  style={{ marginRight: '7px', accentColor: '#2d5a27' }}
                />
                Remember me
              </label>
              <button
                type="button"
                onClick={() => setShowForgot(true)}
                style={s.lgForgot}
              >
                Forgot Password?
              </button>
            </div>
          )}

          {/* Submit */}
          <button
            className="login-submit-btn"
            onClick={mode === 'login' ? handleLogin : handleRegister}
            disabled={loading || lockoutTimer > 0}
            style={{
              ...s.submitBtn,
              opacity: (loading || lockoutTimer > 0) ? 0.7 : 1,
              cursor:  (loading || lockoutTimer > 0) ? 'not-allowed' : 'pointer',
              animation: success ? 'loginSuccess 0.4s ease' : 'none',
            }}
          >
            {loading
              ? <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" style={{ animation:'spin 0.8s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                  PLEASE WAIT…
                </span>
              : lockoutTimer > 0
                ? `WAIT ${lockoutTimer}s`
                : mode === 'login' ? 'LOGIN' : 'CREATE ACCOUNT'
            }
          </button>

          {/* Divider */}
          <div style={s.dividerWrap}>
            <div style={s.dividerLine} />
            <span style={s.dividerText}>or continue with</span>
            <div style={s.dividerLine} />
          </div>

          {/* Google */}
          <button
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            onMouseEnter={() => setGoogleHovered(true)}
            onMouseLeave={() => setGoogleHovered(false)}
            style={{
              ...s.googleBtn,
              borderColor: googleHovered ? '#588157' : '#d4dccf',
              background:  googleHovered ? '#f4f9f4' : '#fff',
              boxShadow:   googleHovered ? '0 4px 16px rgba(88,129,87,0.18)' : 'none',
              transform:   googleHovered ? 'translateY(-2px)' : 'translateY(0)',
              color:       googleHovered ? '#2d5a27' : '#1a3a1a',
              opacity:     googleLoading ? 0.7 : 1,
              cursor:      googleLoading ? 'not-allowed' : 'pointer',
            }}
          >
            {googleLoading
              ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#588157" strokeWidth="2.5" strokeLinecap="round" style={{ animation:'spin 0.8s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              : <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google" style={{ width:'18px', height:'18px', transition:'transform 0.2s ease', transform: googleHovered ? 'scale(1.1)' : 'scale(1)' }} />
            }
            {googleLoading ? 'Redirecting…' : mode === 'login' ? 'Sign in with Google' : 'Sign up with Google'}
          </button>

          {/* Toggle mode */}
          <div style={s.toggleWrap}>
            {mode === 'login' ? (
              <>
                <span style={s.toggleText}>Don't have an account?</span>
                <button type="button" onClick={() => { setMode('register'); resetForm(); }} style={s.toggleBtn}>
                  Create Account
                </button>
              </>
            ) : (
              <>
                <span style={s.toggleText}>Already have an account?</span>
                <button type="button" onClick={() => { setMode('login'); resetForm(); }} style={s.toggleBtn}>
                  Back to Login
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div style={s.rightPanel}>
          <img src={logoBg} alt="" aria-hidden="true" style={s.rightBgLogo} />
          <div style={s.rightInner}>
            <h2 style={s.rightHeading}>Welcome to MagniTect</h2>
            <p style={s.rightSub}>
              Detect and classify urinary crystals with precision using advanced image recognition technology.
            </p>
            <ul style={s.featureList}>
              {FEATURES.map(f => (
                <li key={f.title} style={s.featureItem}>
                  <div style={s.featureIconWrap}>{f.icon}</div>
                  <div>
                    <div style={s.featureTitle}>{f.title}</div>
                    <div style={s.featureDesc}>{f.desc}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

      </div>

      {/* Forgot Password Modal */}
      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}
    </div>
  );
}

const s = {
  loginWrap:  { position:'fixed', inset:0, display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg, #f5f7f2 0%, #e8f0e0 100%)', overflow:'hidden', fontFamily:"'Poppins', sans-serif" },
  bgTop:      { position:'absolute', top:'-100px', left:'50%', transform:'translateX(-50%)', width:'600px', height:'400px', background:'#588157', borderRadius:'0 0 200px 200px', opacity:0.3, pointerEvents:'none' },
  bgBl:       { position:'absolute', bottom:'-100px', left:'-100px', width:'400px', height:'400px', background:'#ffd700', borderRadius:'50%', opacity:0.3, pointerEvents:'none' },
  bgBr:       { position:'absolute', bottom:'-50px', right:'-50px', width:'350px', height:'350px', background:'#2d5a27', borderRadius:'50%', opacity:0.2, pointerEvents:'none' },
  loginBox:   { background:'#fff', borderRadius:'20px', padding:'60px 80px', width:'90%', maxWidth:'1100px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'60px', boxShadow:'0 20px 60px rgba(0,0,0,0.12)', position:'relative', zIndex:10 },
  lgLeft:     { display:'flex', flexDirection:'column', justifyContent:'center' },
  logoImg:    { height:'80px', width:'auto', marginBottom:'14px', objectFit:'contain', alignSelf:'flex-start' },
  lgTitle:    { fontSize:'28px', fontWeight:700, color:'#2d5a27', marginBottom:'32px', letterSpacing:'1px' },
  lgGroup:    { marginBottom:'15px' },
  label:      { display:'block', fontSize:'13px', color:'#4a6645', marginBottom:'8px', fontWeight:600, letterSpacing:'0.4px' },
  input:      { width:'100%', padding:'14px 0', border:'none', borderBottom:'2px solid #d4dccf', fontSize:'14px', color:'#1a3a1a', background:'transparent', outline:'none', transition:'border-color 0.25s', boxSizing:'border-box', fontFamily:"'Poppins', sans-serif" },
  eyeBtn:     { position:'absolute', right:0, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', padding:'4px', display:'flex', alignItems:'center', justifyContent:'center' },
  lgOpts:     { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'28px', fontSize:'13px' },
  lgCheck:    { display:'flex', alignItems:'center', cursor:'pointer', color:'#4a6645' },
  lgForgot:   { color:'#E24B4A', background:'none', border:'none', fontSize:'13px', cursor:'pointer', fontFamily:"'Poppins', sans-serif", textDecoration:'none' },
  lgForgotHov:{ textDecoration:'underline' },
  lgErr:      { fontSize:'12px', color:'#E24B4A', marginTop:'-10px', marginBottom:'10px', fontWeight:500 },
  lgSuccess:  { fontSize:'12px', color:'#1FB505', marginTop:'-10px', marginBottom:'10px', fontWeight:600 },
  submitBtn:  { width:'100%', padding:'15px', background:'#3a7a3f', border:'none', borderRadius:'10px', color:'#fff', fontSize:'14px', fontWeight:700, letterSpacing:'1px', cursor:'pointer', fontFamily:"'Poppins', sans-serif", transition:'background 0.2s, transform 0.15s, box-shadow 0.2s', boxShadow:'0 4px 14px rgba(45,90,39,0.25)', marginBottom:'4px' },
  dividerWrap:{ display:'flex', alignItems:'center', gap:'10px', margin:'20px 0 12px' },
  dividerLine:{ flex:1, height:'1px', background:'#d4dccf' },
  dividerText:{ fontSize:'12px', color:'#8aab82', whiteSpace:'nowrap' },
  googleBtn:  { display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', width:'100%', padding:'12px', border:'2px solid #d4dccf', borderRadius:'8px', background:'#fff', fontSize:'14px', fontWeight:600, color:'#1a3a1a', cursor:'pointer', transition:'all 0.25s', marginBottom:'4px', fontFamily:"'Poppins', sans-serif" },
  toggleWrap: { display:'flex', alignItems:'center', gap:'8px', marginTop:'16px', justifyContent:'center' },
  toggleText: { fontSize:'13px', color:'#4a6645' },
  toggleBtn:  { fontSize:'13px', fontWeight:700, color:'#2d5a27', background:'none', border:'none', cursor:'pointer', textDecoration:'underline', padding:0, fontFamily:"'Poppins', sans-serif" },
  rightPanel: { background:'linear-gradient(160deg, #588157 0%, #2d5a27 100%)', borderRadius:'16px', display:'flex', alignItems:'center', justifyContent:'center', padding:'48px 40px', position:'relative', overflow:'hidden' },
  rightBgLogo:{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:'125%', height:'auto', opacity:0.10, filter:'brightness(0) invert(1)', pointerEvents:'none', userSelect:'none' },
  rightInner: { color:'#fff', position:'relative', zIndex:1 },
  rightHeading:{ fontSize:'22px', fontWeight:700, color:'#fff', margin:'0 0 12px 0' },
  rightSub:   { fontSize:'14px', color:'rgba(255,255,255,0.82)', lineHeight:1.65, margin:'0 0 28px 0' },
  featureList:{ listStyle:'none', padding:0, margin:0, display:'flex', flexDirection:'column', gap:'20px' },
  featureItem:{ display:'flex', alignItems:'flex-start', gap:'14px' },
  featureIconWrap:{ width:'36px', height:'36px', borderRadius:'10px', background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:'2px' },
  featureTitle:{ fontSize:'14px', fontWeight:700, color:'#fff', marginBottom:'4px' },
  featureDesc: { fontSize:'12px', color:'rgba(255,255,255,0.75)', lineHeight:1.5 },
};