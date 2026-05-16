import React, { useState } from 'react';
import './index.css';
import logo from './assets/logo.png';

const styles = {
  topbar: { flexShrink: 0, height: '64px', background: '#fff', borderBottom: '1.5px solid #D8DAD0', display: 'flex', alignItems: 'center', padding: '0 24px', gap: '16px', fontFamily: "'Poppins', sans-serif" },
  titleGroup: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    lineHeight: 1.1,
    marginLeft: '-8px',
  },
  logoImg: {
    height: '56px',
    objectFit: 'contain',
    display: 'block',
  },
  appSub: {
    fontSize: '12px',
    color: '#A4AAA4',
    fontFamily: "'Poppins', sans-serif",
    position: 'absolute',
    bottom: '-2px',
    left: '2px',
    whiteSpace: 'nowrap',
  },
  topbarRight: { marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '14px' },
  statusChip: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 500, color: '#306A33', fontFamily: "'Poppins', sans-serif" },
  statusDot: { width: '8px', height: '8px', borderRadius: '50%', background: '#1FB505' },

  // ── Overlay ──────────────────────────────────────────────────────────────
  overlay: {
    position: 'fixed', inset: 0, zIndex: 9999,
    background: 'rgba(8, 18, 10, 0.55)',
    backdropFilter: 'blur(5px)',
    WebkitBackdropFilter: 'blur(5px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },

  // ── Modal ─────────────────────────────────────────────────────────────────
  modal: {
    background: '#fff',
    borderRadius: '18px',
    width: '380px',
    maxWidth: '94vw',
    boxShadow: '0 24px 64px rgba(0,0,0,0.22), 0 4px 16px rgba(0,0,0,0.08)',
    overflow: 'hidden',
    fontFamily: "'Poppins', sans-serif",
    animation: 'logoutModalIn 0.24s cubic-bezier(0.34, 1.2, 0.64, 1)',
  },

  modalHeader: {
    background: '#1F5330',
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },

  modalHeaderIcon: {
    width: '32px', height: '32px', borderRadius: '8px',
    background: 'rgba(255,255,255,0.15)',
    border: '1px solid rgba(255,255,255,0.2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },

  modalHeaderTitle: {
    fontSize: '14px', fontWeight: 700, color: '#fff',
  },

  modalHeaderSub: {
    fontSize: '10px', color: 'rgba(255,255,255,0.6)', marginTop: '1px',
  },

  modalBody: {
    padding: '24px 24px 8px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    textAlign: 'center',
  },

  modalIconWrap: {
    width: '56px', height: '56px', borderRadius: '16px',
    background: '#FFF8ED',
    border: '1.5px solid #FDE68A',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },

  modalTitle: {
    fontSize: '16px', fontWeight: 700, color: '#141514', marginBottom: '2px',
  },

  modalDesc: {
    fontSize: '13px', color: '#6B7280', lineHeight: 1.65, maxWidth: '280px',
  },

  modalFooter: {
    padding: '16px 24px 20px',
    display: 'flex',
    gap: '10px',
  },

  btnCancel: {
    flex: 1, padding: '10px', borderRadius: '10px',
    border: '1.5px solid #D8DAD0', background: '#fff',
    fontSize: '13px', fontWeight: 600, color: '#4A5240',
    cursor: 'pointer', fontFamily: "'Poppins', sans-serif",
    transition: 'background 0.15s',
  },

  btnLogout: {
    flex: 1, padding: '10px', borderRadius: '10px',
    border: 'none', background: '#1F5330',
    fontSize: '13px', fontWeight: 700, color: '#fff',
    cursor: 'pointer', fontFamily: "'Poppins', sans-serif",
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
    transition: 'background 0.15s',
  },
};

// Inject animation once
if (!document.getElementById('logout-anim')) {
  const el = document.createElement('style');
  el.id = 'logout-anim';
  el.textContent = `
    @keyframes logoutModalIn {
      from { opacity: 0; transform: scale(0.94) translateY(10px); }
      to   { opacity: 1; transform: scale(1)    translateY(0);    }
    }
  `;
  document.head.appendChild(el);
}

export default function Topbar({ goToLogin }) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleLogoutConfirm = () => {
    setShowConfirm(false);
    // Clear auth data
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    goToLogin();
  };

  return (
    <>
      <div style={styles.topbar}>
        <div style={styles.titleGroup}>
          <img src={logo} alt="Magnitect Logo" style={styles.logoImg} />
          <div style={styles.appSub}>Automated Urinary Particle Detection System</div>
        </div>
        <div style={styles.topbarRight}>
          <div style={styles.statusChip}>
            <div style={styles.statusDot} />
            System Ready
          </div>
          <button onClick={() => setShowConfirm(true)} className="topbar-logout">
            Logout
          </button>
        </div>
      </div>

      {/* ── Logout Confirmation Modal ── */}
      {showConfirm && (
        <div style={styles.overlay} onClick={() => setShowConfirm(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>

            <div style={styles.modalHeader}>
              <div style={styles.modalHeaderIcon}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                  stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
              </div>
              <div>
                <div style={styles.modalHeaderTitle}>Confirm Logout</div>
                <div style={styles.modalHeaderSub}>MagniTect · Session Management</div>
              </div>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.modalIconWrap}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
                  stroke="#B45309" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <div>
                <div style={styles.modalTitle}>Are you sure you want to logout?</div>
                <div style={styles.modalDesc}>
                  You will be returned to the login screen. Any unsaved analysis progress will be lost.
                </div>
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button
                style={styles.btnCancel}
                onClick={() => setShowConfirm(false)}
                onMouseEnter={e => e.currentTarget.style.background = '#F5F6F0'}
                onMouseLeave={e => e.currentTarget.style.background = '#fff'}
              >
                Cancel
              </button>
              <button
                style={styles.btnLogout}
                onClick={handleLogoutConfirm}
                onMouseEnter={e => e.currentTarget.style.background = '#306A33'}
                onMouseLeave={e => e.currentTarget.style.background = '#1F5330'}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                  stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Yes, Logout
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}