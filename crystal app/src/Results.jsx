import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { saveAnalyses } from './api';
import './index.css';

const CRYSTAL_COLORS = {
  'CaOx Dihydrate':         '#E24B4A',
  'CaOx Monohydrate Ovoid': '#F5A623',
  'Phosphate':              '#6D9922',
  'Calcium Oxalate':        '#E24B4A',
  'Uric Acid':              '#1FB505',
  'Struvite':               '#6D9922',
  'Ca Phosphate':           '#6D7758',
};

export default function Results({
  goToUpload, goToAnalysis, goToExport, goToPatients, goToLibrary, goToLogin,
  addCrystalRecords, analysisData, markResultsViewed,
  badges = {},
}) {
  const [saved, setSaved]     = useState(false);
  const [loading, setLoading] = useState(false);

  const crystals = (analysisData?.results?.length > 0) ? analysisData.results : [];

  const handleSaveToLibrary = async () => {
    if (saved) return;
    setLoading(true);
    try {
      const records = crystals.map(crystal => ({
        patientId:   analysisData?.patientId,
        patientName: analysisData?.patientName,
        sampleId:    analysisData?.sampleId,
        crystalType: crystal.crystalType || crystal.name,
        count:       crystal.count,
        risk:        crystal.risk,
        date:        new Date().toISOString().split('T')[0],
      }));
      await saveAnalyses(records);
      addCrystalRecords(records);
      setSaved(true);
      // ← NO clearAnalysisData here — data stays until user clears manually
    } catch (err) {
      alert('Error saving to library. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

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
                Sample #{analysisData?.sampleId || 'PT-2025-042'}
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
                  alt="Annotated crystals"
                  style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '14px' }}
                />
                ) : (
                  <div style={{ color: '#A4AAA4', textAlign: 'center', fontSize: '14px', fontFamily: "'Poppins', sans-serif" }}>
                    🔬 Crystal Detection Scope
                  </div>
                )}
              </div>
            </div>

            {/* Detection Summary */}
            <div style={styles.card}>
              <div style={styles.cardTitle}>
                Detection Summary
                <span style={{ fontSize: '11px', color: '#A4AAA4', fontWeight: 400 }}>
                  {crystals.reduce((sum, c) => sum + c.count, 0)} crystals detected
                </span>
              </div>
              {crystals.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#A4AAA4', padding: '20px', fontSize: '13px', fontFamily: "'Poppins', sans-serif" }}>
                  No crystals detected yet — analyze an image first
                </div>
              ) : (
                <div style={{ ...styles.ctypeRow, gridTemplateColumns: `repeat(${Math.min(crystals.length, 4)}, 1fr)` }}>
                  {crystals.map((crystal, i) => (
                    <div key={i} className="ctype-card">
                      <div style={{ ...styles.ctypeDot, background: CRYSTAL_COLORS[crystal.crystalType] || '#888' }}></div>
                      <div style={styles.ctypeNum}>{crystal.count}</div>
                      <div style={styles.ctypeName}>{crystal.crystalType}</div>
                      <div style={{
                        fontSize: '9px', marginTop: '4px', fontWeight: 600, padding: '2px 6px',
                        borderRadius: '8px', display: 'inline-block',
                        background: crystal.risk === 'High' ? '#FFF0ED' : crystal.risk === 'Moderate' ? '#FFF8ED' : '#E8F5E8',
                        color: crystal.risk === 'High' ? '#A32D2D' : crystal.risk === 'Moderate' ? '#C07320' : '#1F5330',
                        fontFamily: "'Poppins', sans-serif"
                      }}>
                        {crystal.risk}
                      </div>
                    </div>
                  ))}
                </div>
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
  app:      { display: 'flex', flexDirection: 'column', width: '100%', height: '100vh', background: '#EEF0E8', overflow: 'hidden' },
  body:     { flex: 1, display: 'grid', gridTemplateColumns: '210px 1fr', minHeight: 0, overflow: 'hidden' },
  main:     { display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden', background: '#EEF0E8' },
  pane:     { flex: 1, display: 'flex', flexDirection: 'column', padding: '20px 28px', gap: '14px', minHeight: 0, overflowY: 'auto' },
  card:     { background: '#fff', border: '1px solid #D8DAD0', borderRadius: '14px', padding: '16px 18px', flexShrink: 0 },
  cardTitle:{ fontSize: '13px', fontWeight: 700, color: '#141514', marginBottom: '12px', fontFamily: "'Poppins', sans-serif", display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  scope: { background: '#1C1E1C', borderRadius: '14px', height: '475px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  ctypeDot: { width: '10px', height: '10px', borderRadius: '50%', margin: '0 auto 6px' },
  ctypeNum: { fontSize: '20px', fontWeight: 800, color: '#141514', fontFamily: "'Poppins', sans-serif" },
  ctypeName:{ fontSize: '10px', color: '#A4AAA4', marginTop: '2px', fontFamily: "'Poppins', sans-serif" },
  bbar:     { flexShrink: 0, padding: '12px 28px', background: '#fff', borderTop: '1px solid #D8DAD0', display: 'flex', justifyContent: 'flex-end', gap: '8px' },
};