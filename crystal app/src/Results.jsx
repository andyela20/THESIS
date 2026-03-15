import React from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import './index.css';

export default function Results({ goToUpload, goToAnalysis, goToExport, goToLogin }) {
  const crystals = [
    { name: 'Calcium Oxalate', count: 23, color: '#E24B4A' },
    { name: 'Uric Acid',       count: 12, color: '#1FB505' },
    { name: 'Struvite',        count: 5,  color: '#6D9922' },
    { name: 'Ca Phosphate',    count: 8,  color: '#6D7758' },
  ];

  return (
    <div style={styles.app}>
      <Topbar goToLogin={goToLogin} />
      <div style={styles.body}>
        <Sidebar currentPage="results" goToUpload={goToUpload} goToResults={() => {}} goToAnalysis={goToAnalysis} goToExport={goToExport} />
        <div style={styles.main}>
          <div style={styles.pane}>
            <div style={styles.card}>
              <div style={styles.cardTitle}>Sample #PT-2025-042</div>
              <div style={styles.scope}>
                <div style={{ color: '#A4AAA4', textAlign: 'center', fontSize: '14px', fontFamily: "'Poppins', sans-serif" }}>🔬 Crystal Detection Scope</div>
              </div>
            </div>
            <div style={styles.card}>
              <div style={styles.cardTitle}>Detection Summary</div>
              <div style={styles.ctypeRow}>
                {crystals.map((crystal, i) => (
                  <div key={i} className="ctype-card">
                    <div style={{ ...styles.ctypeDot, background: crystal.color }}></div>
                    <div style={styles.ctypeNum}>{crystal.count}</div>
                    <div style={styles.ctypeName}>{crystal.name}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={styles.bbar}>
              <button onClick={goToUpload} className="btn-ghost">← Back to upload</button>
              <button onClick={goToAnalysis} className="btn-solid">Next →</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  app: { display: 'flex', flexDirection: 'column', width: '100%', height: '100vh', background: '#EEF0E8', overflow: 'hidden' },
  body: { flex: 1, display: 'grid', gridTemplateColumns: '210px 1fr', minHeight: 0, overflow: 'hidden' },
  main: { display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden', background: '#EEF0E8' },
  pane: { flex: 1, display: 'flex', flexDirection: 'column', padding: '20px 28px', gap: '14px', minHeight: 0, overflowY: 'auto' },
  card: { background: '#fff', border: '1px solid #D8DAD0', borderRadius: '14px', padding: '16px 18px', flexShrink: 0 },
  cardTitle: { fontSize: '13px', fontWeight: 700, color: '#141514', marginBottom: '12px', fontFamily: "'Poppins', sans-serif" },
  scope: { background: '#1C1E1C', borderRadius: '14px', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  ctypeRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' },
  ctypeDot: { width: '10px', height: '10px', borderRadius: '50%', margin: '0 auto 6px' },
  ctypeNum: { fontSize: '20px', fontWeight: 800, color: '#141514', fontFamily: "'Poppins', sans-serif" },
  ctypeName: { fontSize: '10px', color: '#A4AAA4', marginTop: '2px', fontFamily: "'Poppins', sans-serif" },
  bbar: { flexShrink: 0, padding: '12px 28px', background: '#fff', borderTop: '1px solid #D8DAD0', display: 'flex', justifyContent: 'flex-end', gap: '8px' },
};