import React, { useMemo, useState } from 'react';
import logo from './assets/logo.png';
import logoBg from './assets/LOGOGRAPHIC.png';

const API_BASE = 'http://16.59.206.79:5000';

const getPasswordStrength = (password) => {
  const value = String(password || '');

  if (!value) {
    return {
      label: '',
      hint: '',
      color: '#A4AAA4',
      width: '0%',
      level: 0,
    };
  }

  let score = 0;

  if (value.length >= 6) score += 1;
  if (value.length >= 8) score += 1;
  if (/[A-Z]/.test(value)) score += 1;
  if (/[0-9]/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value)) score += 1;

  if (value.length < 6) {
    return {
      label: 'Weak',
      hint: 'Password is too short. Use at least 6 characters.',
      color: '#E24B4A',
      width: '25%',
      level: 1,
    };
  }

  if (score <= 2) {
    return {
      label: 'Weak',
      hint: 'Add uppercase letters, numbers, or symbols to make it stronger.',
      color: '#E24B4A',
      width: '35%',
      level: 1,
    };
  }

  if (score === 3 || score === 4) {
    return {
      label: 'Medium',
      hint: 'Password is acceptable, but can still be improved.',
      color: '#C07320',
      width: '70%',
      level: 2,
    };
  }

  return {
    label: 'Strong',
    hint: 'Password strength is good.',
    color: '#1F5330',
    width: '100%',
    level: 3,
  };
};

const EyeIcon = ({ hidden = false }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {hidden ? (
      <>
        <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.89 1 12a18.45 18.45 0 0 1 5.06-6.94" />
        <path d="M9.9 4.24A10.7 10.7 0 0 1 12 4c5 0 9.27 3.11 11 8a18.5 18.5 0 0 1-2.16 3.19" />
        <path d="M14.12 14.12A3 3 0 0 1 9.88 9.88" />
        <path d="M1 1l22 22" />
      </>
    ) : (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
        <circle cx="12" cy="12" r="3" />
      </>
    )}
  </svg>
);

export default function Login({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState(() => localStorage.getItem('rememberedUsername') || '');
  const [password, setPassword] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => localStorage.getItem('rememberMe') === 'true');

  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);

  const resetForm = () => {
    setUsername(localStorage.getItem('rememberedUsername') || '');
    setPassword('');
    setConfirmPass('');
    setShowPassword(false);
    setShowConfirmPass(false);
    setError('');
    setSuccess('');
  };

  const saveLogin = (data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('username', data.username || data.user?.username || username);

    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
    }

    if (rememberMe) {
      localStorage.setItem('rememberMe', 'true');
      localStorage.setItem('rememberedUsername', username.trim());
    } else {
      localStorage.removeItem('rememberMe');
      localStorage.removeItem('rememberedUsername');
    }

    onLogin();
  };

  const handleLogin = async () => {
    if (!username.trim() || !password) {
      setError('Please enter username and password.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.message || 'Invalid username or password.');
        setLoading(false);
        return;
      }

      saveLogin(data);
    } catch (err) {
      setError('Cannot connect to server. Please check your internet connection or backend server.');
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!username.trim() || !password || !confirmPass) {
      setError('Please fill in all fields.');
      return;
    }

    if (password !== confirmPass) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password is too weak. Use at least 6 characters.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.message || 'Registration failed.');
        setLoading(false);
        return;
      }

      setSuccess('Account created successfully. You can now log in.');
      setLoading(false);

      setTimeout(() => {
        setMode('login');
        resetForm();
      }, 1200);
    } catch (err) {
      setError('Cannot connect to server. Please check your internet connection or backend server.');
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      mode === 'login' ? handleLogin() : handleRegister();
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

            <div style={styles.passwordField}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter your password"
                style={{ ...styles.input, paddingRight: '42px' }}
              />

              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                onMouseDown={(e) => e.preventDefault()}
                style={styles.eyeBtn}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                <EyeIcon hidden={showPassword} />
              </button>
            </div>
          </div>

          {mode === 'register' && password && (
            <div style={styles.passwordFeedback}>
              <div style={styles.strengthTop}>
                <span style={{ ...styles.strengthLabel, color: passwordStrength.color }}>
                  {passwordStrength.label}
                </span>
                <span style={styles.strengthHint}>{passwordStrength.hint}</span>
              </div>

              <div style={styles.strengthTrack}>
                <div
                  style={{
                    ...styles.strengthFill,
                    width: passwordStrength.width,
                    background: passwordStrength.color,
                  }}
                />
              </div>
            </div>
          )}

          {mode === 'register' && (
            <div style={styles.lgGroup}>
              <label style={styles.label}>Confirm Password</label>

              <div style={styles.passwordField}>
                <input
                  type={showConfirmPass ? 'text' : 'password'}
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Confirm your password"
                  style={{ ...styles.input, paddingRight: '42px' }}
                />

                <button
                  type="button"
                  onClick={() => setShowConfirmPass(prev => !prev)}
                  onMouseDown={(e) => e.preventDefault()}
                  style={styles.eyeBtn}
                  aria-label={showConfirmPass ? 'Hide password' : 'Show password'}
                  title={showConfirmPass ? 'Hide password' : 'Show password'}
                >
                  <EyeIcon hidden={showConfirmPass} />
                </button>
              </div>

              {confirmPass && password !== confirmPass && (
                <div style={styles.confirmHint}>Passwords do not match.</div>
              )}

              {confirmPass && password === confirmPass && (
                <div style={styles.confirmMatch}>Passwords match.</div>
              )}
            </div>
          )}

          {error && <div style={styles.lgErr}>{error}</div>}
          {success && <div style={styles.lgSuccess}>{success}</div>}

          {mode === 'login' && (
            <div style={styles.lgOpts}>
              <label style={styles.lgCheck}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ marginRight: '7px' }}
                />
                Remember me
              </label>
              <span style={styles.lgForgot}>Forgot Password?</span>
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

  passwordField: {
    position: 'relative',
    width: '100%',
  },

  eyeBtn: {
    position: 'absolute',
    right: 0,
    top: '50%',
    transform: 'translateY(-50%)',
    width: '30px',
    height: '30px',
    border: 'none',
    background: 'transparent',
    color: '#4a6645',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  },

  passwordFeedback: {
    marginTop: '-6px',
    marginBottom: '14px',
  },

  strengthTop: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
    marginBottom: '6px',
  },

  strengthLabel: {
    fontSize: '12px',
    fontWeight: 800,
    fontFamily: "'Poppins', sans-serif",
  },

  strengthHint: {
    fontSize: '11px',
    color: '#6B7168',
    lineHeight: 1.4,
    fontFamily: "'Poppins', sans-serif",
  },

  strengthTrack: {
    width: '100%',
    height: '5px',
    borderRadius: '999px',
    background: '#E5E8DF',
    overflow: 'hidden',
  },

  strengthFill: {
    height: '100%',
    borderRadius: '999px',
    transition: 'width 0.2s ease, background 0.2s ease',
  },

  confirmHint: {
    marginTop: '6px',
    fontSize: '11px',
    color: '#E24B4A',
    fontFamily: "'Poppins', sans-serif",
  },

  confirmMatch: {
    marginTop: '6px',
    fontSize: '11px',
    color: '#1F5330',
    fontWeight: 700,
    fontFamily: "'Poppins', sans-serif",
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
};