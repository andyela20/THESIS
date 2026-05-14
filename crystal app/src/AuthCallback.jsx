import { useEffect } from 'react';

export default function AuthCallback({ onLogin }) {
  useEffect(() => {
    const params   = new URLSearchParams(window.location.search);
    const token    = params.get('token');
    const username = params.get('username');

    if (token && username) {
      localStorage.setItem('token', token);
      localStorage.setItem('username', username);
      onLogin();
    }
  }, []);

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <div style={styles.spinner} />
        <p style={styles.text}>Signing you in with Google...</p>
      </div>
    </div>
  );
}

const styles = {
  wrap:    { position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f5f7f2 0%, #e8f0e0 100%)' },
  card:    { background: '#fff', borderRadius: '16px', padding: '48px 60px', boxShadow: '0 20px 60px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' },
  spinner: { width: '40px', height: '40px', border: '4px solid #d4dccf', borderTop: '4px solid #2d5a27', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  text:    { fontSize: '15px', color: '#4a6645', fontWeight: 600, margin: 0 },
};
