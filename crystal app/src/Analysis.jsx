import React, { useState } from 'react';
import Sidebar from './Sidebar';

export default function Analysis({ goToUpload, goToResults, goToExport, goToLogin }) {
  const [confidence, setConfidence] = useState(70);

  const distributions = [
    { name: 'Calcium Oxalate', count: 23, pct: 48, conf: 92, color: '#E24B4A' },
    { name: 'Uric Acid', count: 12, pct: 25, conf: 88, color: '#1FB505' },
    { name: 'Struvite', count: 5, pct: 10, conf: 85, color: '#6D9922' },
    { name: 'Ca Phosphate', count: 8, pct: 17, conf: 82, color: '#6D7758' },
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
        <Sidebar currentPage="analysis" goToUpload={goToUpload} goToResults={goToResults} goToAnalysis={() => {}} goToExport={goToExport} />

        <div style={styles.main}>
          <div style={styles.pane}>
            <div style={styles.anGrid}>
              <div style={styles.anLeft}>
                {/* Analysis Results Card */}
                <div style={styles.card}>
                  <div style={styles.cardTitle}>Analysis results</div>
                  <div style={styles.stats}>
                    <div>
                      <div style={styles.statLbl}>Total crystals</div>
                      <div style={styles.statVal}>48</div>
                    </div>
                    <div>
                      <div style={styles.statLbl}>Accuracy</div>
                      <div style={styles.statVal}>87%</div>
                    </div>
                    <div>
                      <div style={styles.statLbl}>Risk level</div>
                      <div style={{ ...styles.statVal, fontSize: '18px', color: '#C07320' }}>Moderate</div>
                    </div>
                  </div>
                </div>

                {/* Distribution Card */}
                <div style={styles.distCard}>
                  <div style={styles.cardTitle}>Crystal distribution</div>
                  {distributions.map((dist, i) => (
                    <div key={i} style={styles.drow}>
                      <div style={{ ...styles.ddot, background: dist.color }}></div>
                      <div style={styles.dname}>{dist.name}</div>
                      <div style={styles.dcnt}>{dist.count} ({dist.pct}%)</div>
                      <div style={styles.dbar}>
                        <div style={{ ...styles.dfill, width: `${dist.conf}%`, background: dist.color }}></div>
                      </div>
                      <div style={styles.dpct}>{dist.conf}%</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Filter Card */}
              <div style={styles.filterCard}>
                <div style={styles.cardTitle}>Filters</div>
                <div>
                  <div style={styles.flbl}>Crystal type</div>
                  <select style={styles.fsel}>
                    <option>All types</option>
                    <option>Calcium Oxalate</option>
                    <option>Uric Acid</option>
                  </select>
                </div>
                <div>
                  <div style={styles.flbl}>Min. confidence</div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={confidence}
                    onChange={(e) => setConfidence(e.target.value)}
                    style={styles.fRange}
                  />
                  <div style={styles.fval}>{confidence}%</div>
                </div>
              </div>
            </div>

            {/* Button Bar */}
            <div style={styles.bbar}>
              <button onClick={goToResults} style={styles.btnGhost}>← Back</button>
              <button onClick={goToExport} style={styles.btnSolid}>Next →</button>
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
  anGrid: { flex: 1, display: 'grid', gridTemplateColumns: '1fr 220px', gap: '14px', minHeight: 0, overflow: 'hidden' },
  anLeft: { display: 'flex', flexDirection: 'column', gap: '14px', minHeight: 0, overflow: 'hidden' },
  card: { background: '#fff', border: '1px solid #D8DAD0', borderRadius: '14px', padding: '16px 18px', flexShrink: 0 },
  cardTitle: { fontSize: '13px', fontWeight: 700, color: '#141514', marginBottom: '12px' },
  stats: { display: 'flex', gap: '32px' },
  statLbl: { fontSize: '10px', fontWeight: 600, color: '#A4AAA4', textTransform: 'uppercase', marginBottom: '3px' },
  statVal: { fontSize: '28px', fontWeight: 800, color: '#1F5330' },
  distCard: { background: '#fff', border: '1px solid #D8DAD0', borderRadius: '14px', padding: '16px 18px', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  drow: { display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '1px solid #EEEFE8' },
  ddot: { width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0 },
  dname: { fontSize: '12px', fontWeight: 600, color: '#141514', width: '130px', flexShrink: 0 },
  dcnt: { fontSize: '11px', color: '#A4AAA4', width: '58px', flexShrink: 0 },
  dbar: { flex: 1, height: '6px', background: '#EEEFE8', borderRadius: '3px' },
  dfill: { height: '100%', borderRadius: '3px' },
  dpct: { fontSize: '11px', fontWeight: 700, color: '#141514', width: '32px', textAlign: 'right', flexShrink: 0 },
  filterCard: { background: '#fff', border: '1px solid #D8DAD0', borderRadius: '14px', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '14px' },
  flbl: { fontSize: '10px', fontWeight: 700, color: '#A4AAA4', textTransform: 'uppercase', marginBottom: '5px' },
  fsel: { width: '100%', padding: '7px 10px', border: '1px solid #D8DAD0', borderRadius: '8px', fontSize: '12px', color: '#141514', background: '#F5F6F0' },
  fRange: { width: '100%', accentColor: '#1FB505' },
  fval: { fontSize: '14px', fontWeight: 800, color: '#1FB505', marginTop: '5px' },
  bbar: { flexShrink: 0, padding: '12px 28px', background: '#fff', borderTop: '1px solid #D8DAD0', display: 'flex', justifyContent: 'flex-end', gap: '8px' },
  btnGhost: { padding: '7px 16px', borderRadius: '8px', border: '1px solid #D8DAD0', background: '#fff', fontSize: '12px', fontWeight: 600, color: '#306A33', cursor: 'pointer' },
  btnSolid: { padding: '7px 16px', borderRadius: '8px', border: 'none', background: '#1F5330', fontSize: '12px', fontWeight: 600, color: '#fff', cursor: 'pointer' },
};
