import React from 'react';

const styles = {
  topbar: {
    flexShrink: 0,
    height: '64px',
    background: '#fff',
    borderBottom: '1.5px solid #D8DAD0',
    display: 'flex',
    alignItems: 'center',
    padding: '0 24px',
    gap: '16px',
    fontFamily: "'Poppins', sans-serif"
  },

  titleGroup: {
    display: 'flex',
    flexDirection: 'column',
    lineHeight: 1.1,
    fontFamily: "'Poppins', sans-serif"
  },

  appTitle: {
    fontSize: '22px',
    fontWeight: 700,
    color: '#141514',
    fontFamily: "'Poppins', sans-serif"
  },

  appSub: {
    fontSize: '12px',
    color: '#A4AAA4',
    fontFamily: "'Poppins', sans-serif"
  },

  topbarRight: {
    marginLeft: 'auto',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    fontFamily: "'Poppins', sans-serif"
  },

  statusChip: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    fontWeight: 500,
    color: '#306A33',
    fontFamily: "'Poppins', sans-serif"
  },

  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#1FB505'
  },

  btnLogout: {
    padding: '7px 18px',
    borderRadius: '8px',
    border: 'none',
    background: '#E24B4A',
    fontSize: '12px',
    fontWeight: 600,
    color: '#fff',
    cursor: 'pointer',
    fontFamily: "'Poppins', sans-serif"
  }
};

export default function Topbar({ goToLogin }) {
  return (
    <div style={styles.topbar}>
      <div style={styles.titleGroup}>
        <div style={styles.appTitle}>CrystalScope</div>
        <div style={styles.appSub}>
          Automated Urinary Crystal Analysis Deep Learning Detection System
        </div>
      </div>

      <div style={styles.topbarRight}>
        <div style={styles.statusChip}>
          <div style={styles.statusDot}></div>
          System Ready
        </div>
        <button onClick={goToLogin} style={styles.btnLogout}>Logout</button>
      </div>
    </div>
  );
}