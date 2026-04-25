import React, { useState } from 'react';
import './index.css';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { PARTICLE_COLORS, PARTICLE_TYPES, RISK_STYLE } from './particleConstants';

export default function Analysis({
  goToUpload, goToResults, goToExport, goToPatients, goToLibrary, goToLogin,
  badges = {}, analysisData, clearAnalysisData,
}) {
  const [confidence, setConfidence] = useState(0);

  const particles    = analysisData?.results || [];
  const totalCount   = particles.reduce((sum, p) => sum + p.count, 0);

  const riskOrder    = { High: 3, Moderate: 2, Low: 1 };
  const overallRisk  = particles.reduce((top, p) => {
    return (riskOrder[p.risk] || 0) > (riskOrder[top] || 0) ? p.risk : top;
  }, 'Low');

  const riskColor = { High: '#A32D2D', Moderate: '#C07320', Low: '#1F5330' };

  // Filter: show particles with count >= threshold (slider = min count, 0–50)
  const filtered = particles.filter(p => p.count >= confidence);

  const handleClear = () => {
    if (window.confirm('Clear this analysis? This cannot be undone.')) {
      if (clearAnalysisData) clearAnalysisData();
    }
  };

  // Group particles by category for the distribution view
  const groupedByCategory = filtered.reduce((acc, p) => {
    const ptype = PARTICLE_TYPES.find(pt => pt.label === p.particleType);
    const group = ptype?.group || 'Other';
    if (!acc[group]) acc[group] = [];
    acc[group].push(p);
    return acc;
  }, {});

  return (
    <div style={styles.app}>
      <Topbar goToLogin={goToLogin} />
      <div style={styles.body}>
        <Sidebar
          currentPage="analysis"
          goToUpload={goToUpload}
          goToResults={() => goToResults()}
          goToAnalysis={() => {}}
          goToExport={goToExport}
          goToPatients={goToPatients}
          goToLibrary={goToLibrary}
          badges={badges}
        />
        <div style={styles.main}>
          <div style={styles.pane}>

            {particles.length === 0 ? (
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
                      Analysis Results
                      {analysisData?.patientName && (
                        <span style={{ fontSize: '11px', color: '#A4AAA4', fontWeight: 400 }}>
                          {analysisData.patientName} · {analysisData.sampleId}
                        </span>
                      )}
                    </div>
                    <div style={styles.stats}>
                      <div>
                        <div style={styles.statLbl}>Total Particles</div>
                        <div style={styles.statVal}>{totalCount}</div>
                      </div>
                      <div>
                        <div style={styles.statLbl}>Particle Types</div>
                        <div style={styles.statVal}>{particles.length}</div>
                      </div>
                      <div>
                        <div style={styles.statLbl}>Risk Level</div>
                        <div style={{ ...styles.statVal, fontSize: '18px', color: riskColor[overallRisk] }}>{overallRisk}</div>
                      </div>
                      <div>
                        <div style={styles.statLbl}>Categories</div>
                        <div style={styles.statVal}>{Object.keys(groupedByCategory).length}</div>
                      </div>
                    </div>
                  </div>

                  {/* Distribution Card */}
                  <div style={styles.distCard}>
                    <div style={styles.cardTitle}>Particle Distribution</div>
                    {filtered.length === 0 ? (
                      <div style={{ color: '#A4AAA4', fontSize: '12px', fontFamily: "'Poppins', sans-serif", textAlign: 'center', padding: '20px' }}>
                        No particles match the current filter
                      </div>
                    ) : (
                      Object.entries(groupedByCategory).map(([groupName, groupParticles]) => (
                        <div key={groupName}>
                          {/* Group label */}
                          <div style={styles.groupLabel}>{groupName}</div>
                          {groupParticles.map((particle, i) => {
                            const pct   = totalCount > 0 ? Math.round(particle.count / totalCount * 100) : 0;
                            const color = PARTICLE_COLORS[particle.particleType] || '#888';
                            const rs    = RISK_STYLE[particle.risk] || RISK_STYLE.Low;
                            return (
                              <div key={i} style={styles.drow}>
                                <div style={{ ...styles.ddot, background: color }} />
                                <div style={styles.dname}>{particle.particleType}</div>
                                <div style={styles.dcnt}>{particle.count} ({pct}%)</div>
                                <div style={styles.dbar}>
                                  <div style={{ ...styles.dfill, width: `${pct}%`, background: color }} />
                                </div>
                                <div style={{ ...styles.riskBadge, ...rs }}>
                                  {particle.risk}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Filters */}
                <div style={styles.filterCard}>
                  <div style={styles.cardTitle}>Filters</div>
                  <div>
                    <div style={styles.flbl}>Min. count threshold</div>
                    <input
                      type="range"
                      min="0" max="50"
                      value={confidence}
                      onChange={(e) => setConfidence(Number(e.target.value))}
                      style={styles.fRange}
                    />
                    <div style={styles.fval}>≥ {confidence} particles</div>
                  </div>

                  {/* Model source legend */}
                  <div style={{ marginTop: '8px' }}>
                    <div style={styles.flbl}>Detection Source</div>
                    <div style={styles.legendItem}>
                      <div style={{ ...styles.legendDot, background: '#1F5330' }} />
                      <span style={styles.legendText}>YOLOv8 — Cells, Casts, Misc</span>
                    </div>
                    <div style={styles.legendItem}>
                      <div style={{ ...styles.legendDot, background: '#E24B4A' }} />
                      <span style={styles.legendText}>RF-DETR — Crystals</span>
                    </div>
                  </div>

                  <button
                    onClick={handleClear}
                    style={styles.clearBtn}
                  >
                    🗑 Clear analysis
                  </button>
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
  distCard:   { background: '#fff', border: '1px solid #D8DAD0', borderRadius: '14px', padding: '16px 18px', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', overflowY: 'auto' },
  groupLabel: { fontSize: '10px', fontWeight: 700, color: '#A4AAA4', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '10px 0 4px', fontFamily: "'Poppins', sans-serif" },
  drow:       { display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 0', borderBottom: '1px solid #EEEFE8' },
  ddot:       { width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0 },
  dname:      { fontSize: '12px', fontWeight: 600, color: '#141514', width: '160px', flexShrink: 0, fontFamily: "'Poppins', sans-serif" },
  dcnt:       { fontSize: '11px', color: '#A4AAA4', width: '80px', flexShrink: 0, fontFamily: "'Poppins', sans-serif" },
  dbar:       { flex: 1, height: '6px', background: '#EEEFE8', borderRadius: '3px' },
  dfill:      { height: '100%', borderRadius: '3px' },
  riskBadge:  { fontSize: '9px', fontWeight: 600, padding: '2px 7px', borderRadius: '10px', fontFamily: "'Poppins', sans-serif", flexShrink: 0 },
  filterCard: { background: '#fff', border: '1px solid #D8DAD0', borderRadius: '14px', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '14px' },
  flbl:       { fontSize: '10px', fontWeight: 700, color: '#A4AAA4', textTransform: 'uppercase', marginBottom: '5px', fontFamily: "'Poppins', sans-serif" },
  fRange:     { width: '100%', accentColor: '#1F5330' },
  fval:       { fontSize: '13px', fontWeight: 800, color: '#1F5330', marginTop: '5px', fontFamily: "'Poppins', sans-serif" },
  legendItem: { display: 'flex', alignItems: 'center', gap: '7px', marginTop: '6px' },
  legendDot:  { width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0 },
  legendText: { fontSize: '11px', color: '#4A5240', fontFamily: "'Poppins', sans-serif" },
  clearBtn:   { marginTop: 'auto', padding: '7px 14px', borderRadius: '8px', border: '1px solid #F5C9C9', background: '#fff', fontSize: '11px', fontWeight: 600, color: '#E24B4A', cursor: 'pointer', fontFamily: "'Poppins', sans-serif" },
  bbar:       { flexShrink: 0, padding: '12px 28px', background: '#fff', borderTop: '1px solid #D8DAD0', display: 'flex', justifyContent: 'flex-end', gap: '8px' },
  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '8px' },
};