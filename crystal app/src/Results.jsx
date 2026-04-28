import React, { useState, useRef, useEffect, useCallback } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { saveAnalyses } from './api';
import { PARTICLE_COLORS, PARTICLE_TYPES, RISK_STYLE } from './particleConstants';
import './index.css';

// Draw bounding boxes on canvas over the image
function AnnotatedCanvas({ imageSrc, detections = [], visibleTypes, showAll }) {
  const canvasRef   = useRef(null);
  const imgRef      = useRef(null);
  const [imgLoaded, setImgLoaded] = useState(false);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img    = imgRef.current;
    if (!canvas || !img || !imgLoaded) return;

    const ctx = canvas.getContext('2d');
    canvas.width  = img.naturalWidth;
    canvas.height = img.naturalHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    detections.forEach(det => {
      const isVisible = showAll || visibleTypes.has(det.crystalType);
      if (!isVisible) return;

      const [x1, y1, x2, y2] = det.bbox;
      const color = PARTICLE_COLORS[det.crystalType] || '#888';
      const w = x2 - x1;
      const h = y2 - y1;

      // Box
      ctx.strokeStyle = color;
      ctx.lineWidth   = Math.max(2, canvas.width / 300);
      ctx.strokeRect(x1, y1, w, h);

      // Label background
      const fontSize = Math.max(10, canvas.width / 60);
      ctx.font = `bold ${fontSize}px Poppins, sans-serif`;
      const label = `${det.crystalType} ${Math.round(det.confidence)}%`;
      const tw    = ctx.measureText(label).width;
      const th    = fontSize + 6;

      ctx.fillStyle = color;
      ctx.fillRect(x1, y1 - th, tw + 8, th);

      // Label text
      ctx.fillStyle = '#fff';
      ctx.fillText(label, x1 + 4, y1 - 4);
    });
  }, [detections, visibleTypes, showAll, imgLoaded]);

  useEffect(() => { draw(); }, [draw]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Hidden img used for natural dimensions */}
      <img
        ref={imgRef}
        src={imageSrc}
        alt=""
        style={{ display: 'none' }}
        onLoad={() => setImgLoaded(true)}
        crossOrigin="anonymous"
      />
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '14px', display: 'block' }}
      />
    </div>
  );
}

export default function Results({
  goToUpload, goToAnalysis, goToExport, goToPatients, goToLibrary, goToLogin,
  addCrystalRecords, analysisData, markResultsViewed,
  badges = {},
}) {
  const [saved, setSaved]       = useState(false);
  const [loading, setLoading]   = useState(false);
  const [showAll, setShowAll]   = useState(true);
  const [visibleTypes, setVisibleTypes] = useState(new Set());

  const particles  = (analysisData?.results?.length > 0) ? analysisData.results : [];

  // Init to show all when new analysis data loads
  useEffect(() => {
    if (particles.length > 0) {
      setShowAll(true);
      setVisibleTypes(new Set(particles.map(p => p.crystalType || p.particleType)));
    }
  }, [analysisData]); // eslint-disable-line react-hooks/exhaustive-deps

  const detections = analysisData?.detections || [];
  const total      = particles.reduce((sum, p) => sum + p.count, 0);

  // Exclusive selection: clicking a type shows only that type
  const toggleType = (type) => {
    setShowAll(false);
    setVisibleTypes(new Set([type]));
  };

  // All button toggles: first press = show all, second press = hide all
  const handleShowAll = () => {
    if (showAll) {
      // Already showing all — toggle off (hide everything)
      setShowAll(false);
      setVisibleTypes(new Set());
    } else {
      // Show all
      setShowAll(true);
      setVisibleTypes(new Set(particles.map(p => p.crystalType || p.particleType)));
    }
  };

  const handleSaveToLibrary = async () => {
    if (saved) return;
    setLoading(true);
    try {
      const records = particles.map(particle => ({
        patientId:    analysisData?.patientId,
        patientName:  analysisData?.patientName,
        sampleId:     analysisData?.sampleId,
        particleType: particle.crystalType || particle.particleType || particle.name,
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

  // Group particles by category
  const grouped = particles.reduce((acc, p) => {
    const ptype = PARTICLE_TYPES.find(pt => pt.label === (p.crystalType || p.particleType));
    const group = ptype?.group || 'Other';
    if (!acc[group]) acc[group] = [];
    acc[group].push(p);
    return acc;
  }, {});

  // Check if we have bbox data to enable filtering
  const hasBboxData = detections.length > 0 && analysisData?.rawImage;

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

            {/* ── Image Card ── */}
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
                {hasBboxData ? (
                  <AnnotatedCanvas
                    imageSrc={analysisData.rawImage}
                    detections={detections}
                    visibleTypes={visibleTypes}
                    showAll={showAll}
                  />
                ) : analysisData?.annotatedImage ? (
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

              {/* Filter controls — only show if we have bbox data */}
              {hasBboxData && particles.length > 0 && (
                <div style={styles.filterRow}>
                  <span style={styles.filterLabel}>Show annotations:</span>
                  <button
                    onClick={handleShowAll}
                    style={{
                      ...styles.filterPill,
                      ...(showAll ? styles.filterPillActive : {}),
                    }}
                  >
                    All
                  </button>
                  {particles.map(p => {
                    const type   = p.crystalType || p.particleType;
                    const color  = PARTICLE_COLORS[type] || '#888';
                    const active = !showAll && visibleTypes.has(type);
                    return (
                      <button
                        key={type}
                        onClick={() => toggleType(type)}
                        style={{
                          ...styles.filterPill,
                          borderColor: active ? color : '#D8DAD0',
                          background:  active ? `${color}18` : '#fff',
                          color:       active ? color : '#A4AAA4',
                        }}
                      >
                        <span style={{ ...styles.filterDot, background: active ? color : '#D8DAD0' }} />
                        {type}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Detection Summary ── */}
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
                    <div style={styles.groupLabel}>{groupName}</div>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: `repeat(${Math.min(groupParticles.length, 4)}, 1fr)`,
                      gap: '8px',
                    }}>
                      {groupParticles.map((particle, i) => {
                        const type   = particle.crystalType || particle.particleType;
                        const color  = PARTICLE_COLORS[type] || '#888';
                        const rs     = RISK_STYLE[particle.risk] || RISK_STYLE.Low;
                        const active = showAll || visibleTypes.has(type);
                        return (
                          <div
                            key={i}
                            className="ctype-card"
                            onClick={() => hasBboxData && toggleType(type)}
                            style={{
                              opacity:   hasBboxData && !active ? 0.4 : 1,
                              outline:   hasBboxData && !showAll && active ? `2px solid ${color}` : 'none',
                              outlineOffset: '2px',
                              cursor:    hasBboxData ? 'pointer' : 'default',
                              transition: 'opacity 0.2s, outline 0.2s',
                              position: 'relative',
                            }}
                          >
                            {/* Hidden badge when filtered out */}
                            {hasBboxData && !showAll && !active && (
                              <div style={styles.hiddenBadge}>hidden</div>
                            )}
                            <div style={{ ...styles.ctypeDot, background: color }} />
                            <div style={styles.ctypeNum}>{particle.count}</div>
                            <div style={styles.ctypeName}>{type}</div>
                            <div style={{
                              fontSize: '9px', marginTop: '4px', fontWeight: 600,
                              padding: '2px 6px', borderRadius: '8px', display: 'inline-block',
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

              {/* Helper text */}
              {hasBboxData && particles.length > 0 && (
                <div style={styles.helperText}>
                   Click a card to show only its annotations · Click All to toggle all
                </div>
              )}
            </div>

            {/* ── Button Bar ── */}
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
  app:        { display: 'flex', flexDirection: 'column', width: '100%', height: '100vh', background: '#EEF0E8', overflow: 'hidden' },
  body:       { flex: 1, display: 'grid', gridTemplateColumns: '210px 1fr', minHeight: 0, overflow: 'hidden' },
  main:       { display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden', background: '#EEF0E8' },
  pane:       { flex: 1, display: 'flex', flexDirection: 'column', padding: '20px 28px', gap: '14px', minHeight: 0, overflowY: 'auto' },
  card:       { background: '#fff', border: '1px solid #D8DAD0', borderRadius: '14px', padding: '16px 18px', flexShrink: 0 },
  cardTitle:  { fontSize: '13px', fontWeight: 700, color: '#141514', marginBottom: '12px', fontFamily: "'Poppins', sans-serif", display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  scope:      { background: '#1C1E1C', borderRadius: '14px', height: '420px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  groupLabel: { fontSize: '10px', fontWeight: 700, color: '#A4AAA4', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px', fontFamily: "'Poppins', sans-serif" },
  ctypeDot:   { width: '10px', height: '10px', borderRadius: '50%', margin: '0 auto 6px' },
  ctypeNum:   { fontSize: '20px', fontWeight: 800, color: '#141514', fontFamily: "'Poppins', sans-serif" },
  ctypeName:  { fontSize: '10px', color: '#A4AAA4', marginTop: '2px', fontFamily: "'Poppins', sans-serif" },
  bbar:       { flexShrink: 0, padding: '12px 28px', background: '#fff', borderTop: '1px solid #D8DAD0', display: 'flex', justifyContent: 'flex-end', gap: '8px' },

  filterRow:      { display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px', alignItems: 'center' },
  filterLabel:    { fontSize: '11px', fontWeight: 600, color: '#A4AAA4', marginRight: '4px', fontFamily: "'Poppins', sans-serif" },
  filterPill:     { display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 12px', borderRadius: '100px', border: '1.5px solid #D8DAD0', background: '#fff', fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Poppins', sans-serif", color: '#4A5240', transition: 'all 0.18s' },
  filterPillActive: { background: '#1F5330', color: '#fff', borderColor: '#1F5330' },
  filterDot:      { width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0 },
  hiddenBadge:    { position: 'absolute', top: '6px', right: '6px', fontSize: '8px', fontWeight: 700, padding: '1px 5px', borderRadius: '6px', background: '#E0E2D8', color: '#A4AAA4', fontFamily: "'Poppins', sans-serif" },
  helperText:     { fontSize: '11px', color: '#A4AAA4', marginTop: '10px', fontFamily: "'Poppins', sans-serif", textAlign: 'center' },
};