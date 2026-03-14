import React from 'react';
import Sidebar from './Sidebar';

export default function Results({ goToUpload, goToAnalysis, goToExport, goToLogin }) {
  const crystals = [
    { name: 'Calcium Oxalate', count: 23, color: '#E24B4A' },
    { name: 'Uric Acid', count: 12, color: '#1FB505' },
    { name: 'Struvite', count: 5, color: '#6D9922' },
    { name: 'Ca Phosphate', count: 8, color: '#6D7758' },
  ];

  return (
    <div style={styles.app}>
      <div style={styles.topbar}>
        <div style={styles.logoMark}>🔬</div>
        <div style={styles.appTitle}>Crystal Analysis Pro</div>
        <div style={styles.appSub}>Automated Urinary Crystal Identification</div>
        <div style={styles.topbarRight}>
          <div style={styles.statusChip}>
            <div style={styles.statusDot}></div>
            System Ready
          </div>
          <button onClick={goToLogin} style={styles.btnLogout}>Logout</button>
        </div>
      </div>

      <div style={styles.body}>
        <Sidebar currentPage="results" goToUpload={goToUpload} goToResults={() => {}} goToAnalysis={goToAnalysis} goToExport={goToExport} />

        <div style={styles.main}>
          <div style={styles.pane}>
            {/* Scope Card */}
            <div style={styles.card}>
              <div style={styles.cardTitle}>Sample #PT-2025-042</div>
              <div style={styles.scope}>
                <div style={{ color: '#A4AAA4', textAlign: 'center', fontSize: '14px' }}>🔬 Crystal Detection Scope</div>
              </div>
            </div>

            {/* Crystal Types */}
            <div style={styles.card}>
              <div style={styles.cardTitle}>Detection Summary</div>
              <div style={styles.ctypeRow}>
                {crystals.map((crystal, i) => (
                  <div key={i} style={styles.ctype}>
                    <div style={{ ...styles.ctypeDot, background: crystal.color }}></div>
                    <div style={styles.ctypeNum}>{crystal.count}</div>
                    <div style={styles.ctypeName}>{crystal.name}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Button Bar */}
            <div style={styles.bbar}>
              <button onClick={goToUpload} style={styles.btnGhost}>← Back to upload</button>
              <button onClick={goToAnalysis} style={styles.btnSolid}>Next →</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  app: { display: 'flex', flexDirection: 'column', width: '100%', height: '100vh', background: '#EEF0E8', overflow: 'hidden' },
  topbar: { flexShrink: 0, height: '56px', background: '#fff', borderBottom: '1.5px solid #D8DAD0', display: 'flex', alignItems: 'center', padding: '0 20px', gap: '10px' },
  logoMark: { fontSize: '24px' },
  appTitle: { fontSize: '15px', fontWeight: 700, color: '#141514' },
  appSub: { fontSize: '11px', color: '#A4AAA4', marginLeft: '8px' },
  topbarRight: { marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' },
  statusChip: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 500, color: '#306A33' },
  statusDot: { width: '8px', height: '8px', borderRadius: '50%', background: '#1FB505' },
  btnLogout: { padding: '7px 18px', borderRadius: '8px', border: 'none', background: '#E24B4A', fontSize: '12px', fontWeight: 600, color: '#fff', cursor: 'pointer' },
  body: { flex: 1, display: 'grid', gridTemplateColumns: '210px 1fr', minHeight: 0, overflow: 'hidden' },
  main: { display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden', background: '#EEF0E8' },
  pane: { flex: 1, display: 'flex', flexDirection: 'column', padding: '20px 28px', gap: '14px', minHeight: 0, overflowY: 'auto' },
  card: { background: '#fff', border: '1px solid #D8DAD0', borderRadius: '14px', padding: '16px 18px', flexShrink: 0 },
  cardTitle: { fontSize: '13px', fontWeight: 700, color: '#141514', marginBottom: '12px' },
  scope: { background: '#1C1E1C', borderRadius: '14px', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  ctypeRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' },
  ctype: { background: '#fff', border: '1px solid #D8DAD0', borderRadius: '12px', padding: '12px 14px', textAlign: 'center', cursor: 'pointer' },
  ctypeDot: { width: '10px', height: '10px', borderRadius: '50%', margin: '0 auto 6px' },
  ctypeNum: { fontSize: '20px', fontWeight: 800, color: '#141514' },
  ctypeName: { fontSize: '10px', color: '#A4AAA4', marginTop: '2px' },
  bbar: { flexShrink: 0, padding: '12px 28px', background: '#fff', borderTop: '1px solid #D8DAD0', display: 'flex', justifyContent: 'flex-end', gap: '8px' },
  btnGhost: { padding: '7px 16px', borderRadius: '8px', border: '1px solid #D8DAD0', background: '#fff', fontSize: '12px', fontWeight: 600, color: '#306A33', cursor: 'pointer' },
  btnSolid: { padding: '7px 16px', borderRadius: '8px', border: 'none', background: '#1F5330', fontSize: '12px', fontWeight: 600, color: '#fff', cursor: 'pointer' },
};
