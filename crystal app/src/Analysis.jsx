import React, { useState } from 'react';
import './index.css';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const CRYSTAL_COLORS = {
  'CaOx Dihydrate':         '#E24B4A',
  'CaOx Monohydrate Ovoid': '#F5A623',
  'Phosphate':              '#6D9922',
  'Calcium Oxalate':        '#E24B4A',
  'Uric Acid':              '#1FB505',
  'Struvite':               '#6D9922',
  'Ca Phosphate':           '#6D7758',
};

export default function Analysis({
  goToUpload, goToResults, goToExport, goToPatients, goToLibrary, goToLogin,
  badges = {}, analysisData,
}) {
  const [confidence, setConfidence] = useState(70);

  const crystals = analysisData?.results || [];
  const totalCrystals = crystals.reduce((sum, c) => sum + c.count, 0);

  // Overall risk — highest risk among crystals
  const riskOrder = { High: 3, Moderate: 2, Low: 1 };
  const overallRisk = crystals.reduce((top, c) => {
    return (riskOrder[c.risk] || 0) > (riskOrder[top] || 0) ? c.risk : top;
  }, 'Low');

  const riskColor = { High: '#A32D2D', Moderate: '#C07320', Low: '#1F5330' };

  const filtered = crystals.filter(c => c.count / totalCrystals * 100 >= confidence / 10);

  return (
    <div style={styles.app}>
      <Topbar goToLogin={goToLogin} />
      <div style={styles.body}>
        <Sidebar
          currentPage="analysis"
          goToUpload={goToUpload}
          goToResults={goToResults}
          goToAnalysis={() => {}}
          goToExport={goToExport}
          goToPatients={goToPatients}
          goToLibrary={goToLibrary}
          badges={badges}
        />
        <div style={styles.main}>
          <div style={styles.pane}>

            {crystals.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={{ fontSize: '40px' }}>🔬</div>
                <div style={{ fontSize: '14px', fontWeight: 500, color: '#A4AAA4', fontFamily: "'Poppins', sans-serif" }}>No analysis yet</div>
                <div style={{ fontSize: '12px', color: '#C9CAC0', fontFamily: "'Poppins', sans-serif" }}>Analyze an image first from New Analysis</div>
              </div>
            ) : (
              <div style={styles.anGrid}>
                <div style={styles.anLeft}>

                  {/* Summary Card */}
                  <div style={styles.card}>
                    <div style={styles.cardTitle}>
                      Analysis results
                      {analysisData?.patientName && (
                        <span style={{ fontSize: '11px', color: '#A4AAA4', fontWeight: 400 }}>
                          {analysisData.patientName} · {analysisData.sampleId}
                        </span>
                      )}
                    </div>
                    <div style={styles.stats}>
                      <div>
                        <div style={styles.statLbl}>Total crystals</div>
                        <div style={styles.statVal}>{totalCrystals}</div>
                      </div>
                      <div>
                        <div style={styles.statLbl}>Crystal types</div>
                        <div style={styles.statVal}>{crystals.length}</div>
                      </div>
                      <div>
                        <div style={styles.statLbl}>Risk level</div>
                        <div style={{ ...styles.statVal, fontSize: '18px', color: riskColor[overallRisk] }}>{overallRisk}</div>
                      </div>
                    </div>
                  </div>

                  {/* Distribution Card */}
                  <div style={styles.distCard}>
                    <div style={styles.cardTitle}>Crystal distribution</div>
                    {filtered.length === 0 ? (
                      <div style={{ color: '#A4AAA4', fontSize: '12px', fontFamily: "'Poppins', sans-serif", textAlign: 'center', padding: '20px' }}>
                        No crystals match the current filter
                      </div>
                    ) : (
                      filtered.map((crystal, i) => {
                        const pct = totalCrystals > 0 ? Math.round(crystal.count / totalCrystals * 100) : 0;
                        const color = CRYSTAL_COLORS[crystal.crystalType] || '#888';
                        return (
                          <div key={i} style={styles.drow}>
                            <div style={{ ...styles.ddot, background: color }}></div>
                            <div style={styles.dname}>{crystal.crystalType}</div>
                            <div style={styles.dcnt}>{crystal.count} ({pct}%)</div>
                            <div style={styles.dbar}>
                              <div style={{ ...styles.dfill, width: `${pct}%`, background: color }}></div>
                            </div>
                            <div style={{ ...styles.riskBadge,
                              background: crystal.risk === 'High' ? '#FFF0ED' : crystal.risk === 'Moderate' ? '#FFF8ED' : '#E8F5E8',
                              color: crystal.risk === 'High' ? '#A32D2D' : crystal.risk === 'Moderate' ? '#C07320' : '#1F5330',
                            }}>
                              {crystal.risk}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Filters */}
                <div style={styles.filterCard}>
                  <div style={styles.cardTitle}>Filters</div>
                  <div>
                    <div style={styles.flbl}>Min. count threshold</div>
                    <input type="range" min="0" max="100" value={confidence} onChange={(e) => setConfidence(Number(e.target.value))} style={styles.fRange} />
                    <div style={styles.fval}>{confidence}%</div>
                  </div>
                </div>
              </div>
            )}

            <div style={styles.bbar}>
              <button onClick={() => goToResults()} className="btn-ghost">← Back</button>
              <button onClick={goToExport} className="btn-solid">Next →</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  app:        { display: 'flex', flexDirection: 'column', width: '100%', height: '100vh', background: '#EEF0E8', overflow: 'hidden' },
  body:       { flex: 1, display: 'grid', gridTemplateColumns: '210px 1fr', minHeight: 0, overflow: 'hidden' },
  main:       { display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden', background: '#EEF0E8' },
  pane:       { flex: 1, display: 'flex', flexDirection: 'column', padding: '20px 28px', gap: '14px', minHeight: 0, overflowY: 'auto' },
  anGrid:     { flex: 1, display: 'grid', gridTemplateColumns: '1fr 220px', gap: '14px', minHeight: 0 },
  anLeft:     { display: 'flex', flexDirection: 'column', gap: '14px', minHeight: 0 },
  card:       { background: '#fff', border: '1px solid #D8DAD0', borderRadius: '14px', padding: '16px 18px', flexShrink: 0 },
  cardTitle:  { fontSize: '13px', fontWeight: 700, color: '#141514', marginBottom: '12px', fontFamily: "'Poppins', sans-serif", display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  stats:      { display: 'flex', gap: '32px' },
  statLbl:    { fontSize: '10px', fontWeight: 600, color: '#A4AAA4', textTransform: 'uppercase', marginBottom: '3px', fontFamily: "'Poppins', sans-serif" },
  statVal:    { fontSize: '28px', fontWeight: 800, color: '#1F5330', fontFamily: "'Poppins', sans-serif" },
  distCard:   { background: '#fff', border: '1px solid #D8DAD0', borderRadius: '14px', padding: '16px 18px', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  drow:       { display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '1px solid #EEEFE8' },
  ddot:       { width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0 },
  dname:      { fontSize: '12px', fontWeight: 600, color: '#141514', width: '130px', flexShrink: 0, fontFamily: "'Poppins', sans-serif" },
  dcnt:       { fontSize: '11px', color: '#A4AAA4', width: '80px', flexShrink: 0, fontFamily: "'Poppins', sans-serif" },
  dbar:       { flex: 1, height: '6px', background: '#EEEFE8', borderRadius: '3px' },
  dfill:      { height: '100%', borderRadius: '3px' },
  riskBadge:  { fontSize: '9px', fontWeight: 600, padding: '2px 7px', borderRadius: '10px', fontFamily: "'Poppins', sans-serif", flexShrink: 0 },
  filterCard: { background: '#fff', border: '1px solid #D8DAD0', borderRadius: '14px', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '14px' },
  flbl:       { fontSize: '10px', fontWeight: 700, color: '#A4AAA4', textTransform: 'uppercase', marginBottom: '5px', fontFamily: "'Poppins', sans-serif" },
  fRange:     { width: '100%', accentColor: '#1FB505' },
  fval:       { fontSize: '14px', fontWeight: 800, color: '#1FB505', marginTop: '5px', fontFamily: "'Poppins', sans-serif" },
  bbar:       { flexShrink: 0, padding: '12px 28px', background: '#fff', borderTop: '1px solid #D8DAD0', display: 'flex', justifyContent: 'flex-end', gap: '8px' },
  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '8px' },
};