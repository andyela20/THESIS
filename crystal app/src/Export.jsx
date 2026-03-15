import React from 'react';
import Sidebar from './Sidebar';

export default function Export({ goToUpload, goToResults, goToAnalysis, goToLogin }) {
  const crystals = [
    { name: 'Calcium Oxalate', count: 23, pct: 48, color: '#E24B4A' },
    { name: 'Uric Acid',       count: 12, pct: 25, color: '#1FB505' },
    { name: 'Struvite',        count: 5,  pct: 10, color: '#6D9922' },
    { name: 'Calcium Phosphate', count: 8, pct: 17, color: '#6D7758' },
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
          <button onClick={goToLogin} className="btn-logout">Logout</button>
        </div>
      </div>

      <div style={styles.body}>
        <Sidebar currentPage="export" goToUpload={goToUpload} goToResults={goToResults} goToAnalysis={goToAnalysis} goToExport={() => {}} />

        <div style={styles.main}>
          <div style={styles.pane}>
            <div style={styles.expTitle}>Detected crystals (48)</div>
            <div style={styles.expTable}>
              <div style={styles.expThead}>
                <div style={styles.eth}>Type</div>
                <div style={styles.eth}>Count</div>
                <div style={styles.eth}>Distribution</div>
              </div>
              <div style={styles.expBody}>
                {crystals.map((crystal, i) => (
                  <div key={i} style={styles.erow}>
                    <div style={styles.etd}>
                      <div style={{ ...styles.ddot, background: crystal.color }}></div>
                      {crystal.name}
                    </div>
                    <div style={styles.etd}>{crystal.count}</div>
                    <div style={styles.etd}>
                      <div style={styles.ebar}>
                        <div style={{ ...styles.efill, width: `${crystal.pct}%`, background: crystal.color }}></div>
                      </div>
                      {crystal.pct}%
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={styles.bbar}>
              <button onClick={() => alert('Exporting PDF...')} className="btn-export">📥 Export PDF</button>
              <button onClick={goToUpload} className="btn-solid">Analyze another</button>
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
  body: { flex: 1, display: 'grid', gridTemplateColumns: '210px 1fr', minHeight: 0, overflow: 'hidden' },
  main: { display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden', background: '#EEF0E8' },
  pane: { flex: 1, display: 'flex', flexDirection: 'column', padding: '20px 28px', gap: '14px', minHeight: 0, overflowY: 'auto' },
  expTitle: { flexShrink: 0, fontSize: '14px', fontWeight: 700, color: '#141514' },
  expTable: { flex: 1, background: '#fff', border: '1px solid #D8DAD0', borderRadius: '14px', overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 },
  expThead: { display: 'grid', gridTemplateColumns: '2.2fr 1fr 2.5fr', background: '#1F5330', flexShrink: 0 },
  eth: { padding: '10px 16px', fontSize: '10px', fontWeight: 700, color: '#9FC8A8', letterSpacing: '0.06em', textTransform: 'uppercase' },
  expBody: { flex: 1, overflow: 'hidden' },
  erow: { display: 'grid', gridTemplateColumns: '2.2fr 1fr 2.5fr', borderBottom: '1px solid #EEEFE8', alignItems: 'center' },
  etd: { padding: '10px 16px', fontSize: '12px', color: '#141514', display: 'flex', alignItems: 'center', gap: '8px' },
  ddot: { width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0 },
  ebar: { flex: 1, height: '6px', background: '#D8DAD0', borderRadius: '3px', margin: '0 6px' },
  efill: { height: '100%', borderRadius: '3px' },
  bbar: { flexShrink: 0, padding: '12px 28px', background: '#fff', borderTop: '1px solid #D8DAD0', display: 'flex', justifyContent: 'flex-end', gap: '8px' },
};