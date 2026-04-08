import React from 'react';
import './index.css';
import logo from './assets/logo.png';

const styles = {
  topbar: { flexShrink: 0, height: '64px', background: '#fff', borderBottom: '1.5px solid #D8DAD0', display: 'flex', alignItems: 'center', padding: '0 24px', gap: '16px', fontFamily: "'Poppins', sans-serif" },
  titleGroup: { 
    position: 'relative',
    display: 'flex', 
    flexDirection: 'column', 
    lineHeight: 1.1,
    marginLeft: '-8px',   // nudge a little to the left
  },
  logoImg: {
    height: '56px',       // a bit bigger
    objectFit: 'contain',
    display: 'block',
  },
  appSub: { 
    fontSize: '12px', 
    color: '#A4AAA4', 
    fontFamily: "'Poppins', sans-serif",
    position: 'absolute',  // float over the logo
    bottom: '-2px',        // push it down near the base of the logo
    left: '2px',
    whiteSpace: 'nowrap',
  },
  topbarRight: { marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '14px' },
  statusChip: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 500, color: '#306A33', fontFamily: "'Poppins', sans-serif" },
  statusDot: { width: '8px', height: '8px', borderRadius: '50%', background: '#1FB505' },
};

export default function Topbar({ goToLogin }) {
  return (
    <div style={styles.topbar}>
      <div style={styles.titleGroup}>
        <img
          src={logo}
          alt="Magnitect Logo"
          style={styles.logoImg}
        />
        <div style={styles.appSub}>Automated Urinary Crystal Detection System</div>
      </div>
      <div style={styles.topbarRight}>
        <div style={styles.statusChip}>
          <div style={styles.statusDot}></div>
          System Ready
        </div>
        <button onClick={goToLogin} className="topbar-logout">Logout</button>
      </div>
    </div>
  );
}