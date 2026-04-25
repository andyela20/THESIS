import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { saveAnalyses } from './api';
import { PARTICLE_COLORS, PARTICLE_TYPES, RISK_STYLE } from './particleConstants';
import './index.css';

export default function Results({
  goToUpload, goToAnalysis, goToExport, goToPatients, goToLibrary, goToLogin,
  addCrystalRecords, analysisData, markResultsViewed,
  badges = {},
}) {
  const [saved, setSaved]     = useState(false);
  const [loading, setLoading] = useState(false);

  const particles = (analysisData?.results?.length > 0) ? analysisData.results : [];
  const total     = particles.reduce((sum, p) => sum + p.count, 0);

  const handleSaveToLibrary = async () => {
    if (saved) return;
    setLoading(true);
    try {
      const records = particles.map(particle => ({
        patientId:    analysisData?.patientId,
        patientName:  analysisData?.patientName,
        sampleId:     analysisData?.sampleId,
        particleType: particle.particleType || particle.name,
        count:        particle.count,
        risk:         particle.risk,
        date:         new Date().toISOString().split('T')[0],
      }));
      await saveAnalyses(records);
      addCrystalRecords(records);
      setSaved(true);
    } catch {
      alert('Error saving to library. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  // Group particles by category for display
  const grouped = particles.reduce((acc, p) => {
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
          currentPage="results"
          goToUpload={goToUpload}
          goToResults={() => {}}
          goToAnalysis={goToAnalysis}
          goToExport={goToExport}
          goToPatients={goToPatients}
          goToLibrary={goToLibrary}
          badges={badges}
        />
        <div style={styles.main}>
          <div style={styles.pane}>

            {/* Sample Card */}
            <div style={styles.card}>
              <div style={styles.cardTitle}>
                Sample #{analysisData?.sampleId || '—'}
                {analysisData?.patientName && (
                  <span style={{ fontSize: '11px', color: '#A4AAA4', fontWeight: 400 }}>
                    Patient: {analysisData.patientName}
                  </span>
                )}
              </div>
              <div style={styles.scope}>
                {analysisData?.annotatedImage ? (
                  <img
                    src={analysisData.annotatedImage}
                    alt="Annotated urinary sediment"
                    style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '14px' }}
                  />
                ) : (
                  <div style={{ color: '#A4AAA4', textAlign: 'center', fontSize: '14px', fontFamily: "'Poppins', sans-serif" }}>
                    🔬 Urinary Sediment Detection Scope
                  </div>
                )}
              </div>
            </div>

            {/* Detection Summary */}
            <div style={styles.card}>
              <div style={styles.cardTitle}>
                Detection Summary
                <span style={{ fontSize: '11px', color: '#A4AAA4', fontWeight: 400 }}>
                  {total} particles detected · {particles.length} types
                </span>
              </div>
              {particles.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#A4AAA4', padding: '20px', fontSize: '13px', fontFamily: "'Poppins', sans-serif" }}>
                  No particles detected yet — analyze an image first
                </div>
              ) : (
                Object.entries(grouped).map(([groupName, groupParticles]) => (
                  <div key={groupName} style={{ marginBottom: '12px' }}>
                    {/* Group label */}
                    <div style={styles.groupLabel}>{groupName}</div>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: `repeat(${Math.min(groupParticles.length, 4)}, 1fr)`,
                      gap: '8px',
                    }}>
                      {groupParticles.map((particle, i) => {
                        const color = PARTICLE_COLORS[particle.particleType] || '#888';
                        const rs    = RISK_STYLE[particle.risk] || RISK_STYLE.Low;
                        return (
                          <div key={i} className="ctype-card">
                            <div style={{ ...styles.ctypeDot, background: color }} />
                            <div style={styles.ctypeNum}>{particle.count}</div>
                            <div style={styles.ctypeName}>{particle.particleType}</div>
                            <div style={{
                              fontSize: '9px', marginTop: '4px', fontWeight: 600, padding: '2px 6px',
                              borderRadius: '8px', display: 'inline-block',
                              ...rs, fontFamily: "'Poppins', sans-serif"
                            }}>
                              {particle.risk}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Button Bar */}
            <div style={styles.bbar}>
              <button onClick={goToUpload} className="btn-ghost">← Back to upload</button>
              <button
                onClick={handleSaveToLibrary}
                className="btn-ghost"
                disabled={saved || loading}
                style={{ color: saved ? '#1FB505' : '#306A33', borderColor: saved ? '#1FB505' : '#D8DAD0' }}
              >
                {loading ? 'Saving...' : saved ? '✓ Saved to Library' : '+ Save to Library'}
              </button>
              <button onClick={goToAnalysis} className="btn-solid">Next →</button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  app:       { display: 'flex', flexDirection: 'column', width: '100%', height: '100vh', background: '#EEF0E8', overflow: 'hidden' },
  body:      { flex: 1, display: 'grid', gridTemplateColumns: '210px 1fr', minHeight: 0, overflow: 'hidden' },
  main:      { display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden', background: '#EEF0E8' },
  pane:      { flex: 1, display: 'flex', flexDirection: 'column', padding: '20px 28px', gap: '14px', minHeight: 0, overflowY: 'auto' },
  card:      { background: '#fff', border: '1px solid #D8DAD0', borderRadius: '14px', padding: '16px 18px', flexShrink: 0 },
  cardTitle: { fontSize: '13px', fontWeight: 700, color: '#141514', marginBottom: '12px', fontFamily: "'Poppins', sans-serif", display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  scope:     { background: '#1C1E1C', borderRadius: '14px', height: '420px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  groupLabel:{ fontSize: '10px', fontWeight: 700, color: '#A4AAA4', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px', fontFamily: "'Poppins', sans-serif" },
  ctypeDot:  { width: '10px', height: '10px', borderRadius: '50%', margin: '0 auto 6px' },
  ctypeNum:  { fontSize: '20px', fontWeight: 800, color: '#141514', fontFamily: "'Poppins', sans-serif" },
  ctypeName: { fontSize: '10px', color: '#A4AAA4', marginTop: '2px', fontFamily: "'Poppins', sans-serif" },
  bbar:      { flexShrink: 0, padding: '12px 28px', background: '#fff', borderTop: '1px solid #D8DAD0', display: 'flex', justifyContent: 'flex-end', gap: '8px' },
};