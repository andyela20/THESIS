import React, { useEffect } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { PARTICLE_COLORS, RISK_STYLE } from './particleConstants';
import './index.css';

export default function Export({
  goToUpload, goToResults, goToAnalysis, goToPatients, goToLibrary, goToLogin,
  markReportsViewed, badges = {}, analysisData, clearAnalysisData,
}) {
  useEffect(() => {
    if (markReportsViewed) markReportsViewed();
  }, [markReportsViewed]);

  const particles  = analysisData?.results || [];
  const totalCount = particles.reduce((sum, p) => sum + p.count, 0);

  const handleClear = () => {
    if (window.confirm('Clear this report? This cannot be undone.')) {
      if (clearAnalysisData) clearAnalysisData();
    }
  };

  const handleExportPDF = () => {
    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const rows = particles.map(p => {
      const pct     = totalCount > 0 ? Math.round(p.count / totalCount * 100) : 0;
      const color   = PARTICLE_COLORS[p.particleType] || '#888';
      const rs      = RISK_STYLE[p.risk] || RISK_STYLE.Low;
      return `
        <tr>
          <td style="padding:10px 14px;border-bottom:1px solid #EEEFE8;font-size:12px;color:#141514;">
            <span style="width:10px;height:10px;border-radius:50%;background:${color};display:inline-block;margin-right:8px;vertical-align:middle;"></span>
            ${p.particleType}
          </td>
          <td style="padding:10px 14px;border-bottom:1px solid #EEEFE8;font-size:12px;color:#141514;">${p.count}</td>
          <td style="padding:10px 14px;border-bottom:1px solid #EEEFE8;font-size:12px;color:#141514;">${pct}%</td>
          <td style="padding:10px 14px;border-bottom:1px solid #EEEFE8;">
            <span style="font-size:10px;font-weight:600;padding:2px 8px;border-radius:10px;background:${rs.background};color:${rs.color};">
              ${p.risk}
            </span>
          </td>
        </tr>
      `;
    }).join('');

    const html = `
      <html>
      <head>
        <title>MagniTect Urinalysis Report</title>
        <style>
          body { font-family: 'Arial', sans-serif; margin: 0; padding: 32px; background: #fff; color: #141514; }
          h1   { font-size: 22px; font-weight: 800; color: #1F5330; margin-bottom: 4px; }
          .sub { font-size: 12px; color: #A4AAA4; margin-bottom: 24px; }
          .info-row { display: flex; gap: 32px; margin-bottom: 24px; flex-wrap: wrap; }
          .info-box { background: #F5F6F0; border-radius: 10px; padding: 12px 18px; }
          .info-lbl { font-size: 10px; font-weight: 700; color: #A4AAA4; text-transform: uppercase; margin-bottom: 4px; }
          .info-val { font-size: 15px; font-weight: 800; color: #141514; }
          table  { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #D8DAD0; border-radius: 12px; overflow: hidden; }
          thead  { background: #1F5330; }
          th     { padding: 10px 14px; font-size: 10px; font-weight: 700; color: #9FC8A8; text-align: left; text-transform: uppercase; letter-spacing: 0.06em; }
          @media print { body { padding: 16px; } }
        </style>
      </head>
      <body>
        <h1>MagniTect Urinalysis Report</h1>
        <div class="sub">Generated on ${date}</div>
        <div class="info-row">
          <div class="info-box"><div class="info-lbl">Patient</div><div class="info-val">${analysisData?.patientName || '—'}</div></div>
          <div class="info-box"><div class="info-lbl">Patient ID</div><div class="info-val">${analysisData?.patientId || '—'}</div></div>
          <div class="info-box"><div class="info-lbl">Sample ID</div><div class="info-val">${analysisData?.sampleId || '—'}</div></div>
          <div class="info-box"><div class="info-lbl">Total Particles</div><div class="info-val">${totalCount}</div></div>
        </div>
        <table>
          <thead>
            <tr><th>Particle Type</th><th>Count</th><th>Distribution</th><th>Risk</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </body>
      </html>
    `;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 500);
  };

  return (
    <div style={styles.app}>
      <Topbar goToLogin={goToLogin} />
      <div style={styles.body}>
        <Sidebar
          currentPage="export"
          goToUpload={goToUpload}
          goToResults={() => goToResults()}
          goToAnalysis={goToAnalysis}
          goToExport={() => {}}
          goToPatients={goToPatients}
          goToLibrary={goToLibrary}
          badges={badges}
        />
        <div style={styles.main}>
          <div style={styles.pane}>

            {/* Header */}
            <div style={styles.header}>
              <div>
                {particles.length > 0 ? (
                  <>
                    <div style={styles.expTitle}>Detected Particles ({totalCount})</div>
                    {analysisData?.patientName && (
                      <div style={styles.expSub}>
                        {analysisData.patientName} · {analysisData.patientId} · {analysisData.sampleId}
                      </div>
                    )}
                  </>
                ) : (
                  <div style={styles.expTitle}>Reports</div>
                )}
              </div>
              <button onClick={goToLibrary} style={styles.libraryLink}>
                View past reports in Library →
              </button>
            </div>

            {particles.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={{ fontSize: '40px' }}>📄</div>
                <div style={{ fontSize: '14px', fontWeight: 500, color: '#A4AAA4', fontFamily: "'Poppins', sans-serif" }}>No report yet</div>
                <div style={{ fontSize: '12px', color: '#C9CAC0', fontFamily: "'Poppins', sans-serif" }}>Analyze an image first, then come back to export</div>
              </div>
            ) : (
              <>
                <div style={styles.expTable}>
                  <div style={styles.expThead}>
                    <div style={styles.eth}>Particle Type</div>
                    <div style={styles.eth}>Count</div>
                    <div style={styles.eth}>Distribution</div>
                    <div style={styles.eth}>Risk</div>
                  </div>
                  <div style={styles.expBody}>
                    {particles.map((particle, i) => {
                      const pct     = totalCount > 0 ? Math.round(particle.count / totalCount * 100) : 0;
                      const color   = PARTICLE_COLORS[particle.particleType] || '#888';
                      const rs      = RISK_STYLE[particle.risk] || RISK_STYLE.Low;
                      return (
                        <div key={i} style={styles.erow}>
                          <div style={styles.etd}>
                            <div style={{ ...styles.ddot, background: color }} />
                            {particle.particleType}
                          </div>
                          <div style={styles.etd}>{particle.count}</div>
                          <div style={styles.etd}>
                            <div style={styles.ebar}>
                              <div style={{ ...styles.efill, width: `${pct}%`, background: color }} />
                            </div>
                            {pct}%
                          </div>
                          <div style={styles.etd}>
                            <span style={{ ...styles.riskBadge, ...rs }}>{particle.risk}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={styles.bbar}>
                  <button onClick={handleClear} style={styles.btnClear}>🗑 Clear report</button>
                  <div style={{ flex: 1 }} />
                  <button onClick={handleExportPDF} className="btn-export" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Export PDF
                  </button>
                  <button onClick={goToUpload} className="btn-solid">Analyze another</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  app:         { display: 'flex', flexDirection: 'column', width: '100%', height: '100vh', background: '#EEF0E8', overflow: 'hidden' },
  body:        { flex: 1, display: 'grid', gridTemplateColumns: '210px 1fr', minHeight: 0, overflow: 'hidden' },
  main:        { display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden', background: '#EEF0E8' },
  pane:        { flex: 1, display: 'flex', flexDirection: 'column', padding: '20px 28px', gap: '14px', minHeight: 0, overflowY: 'auto' },
  header:      { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 },
  expTitle:    { fontSize: '14px', fontWeight: 700, color: '#141514', fontFamily: "'Poppins', sans-serif" },
  expSub:      { fontSize: '11px', color: '#A4AAA4', marginTop: '2px', fontFamily: "'Poppins', sans-serif" },
  libraryLink: { fontSize: '11px', color: '#1F5330', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Poppins', sans-serif", textDecoration: 'underline', flexShrink: 0 },
  expTable:    { flex: 1, background: '#fff', border: '1px solid #D8DAD0', borderRadius: '14px', overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 },
  expThead:    { display: 'grid', gridTemplateColumns: '2.2fr 1fr 2.5fr 1fr', background: '#1F5330', flexShrink: 0 },
  eth:         { padding: '10px 16px', fontSize: '10px', fontWeight: 700, color: '#9FC8A8', letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: "'Poppins', sans-serif" },
  expBody:     { flex: 1, overflowY: 'auto' },
  erow:        { display: 'grid', gridTemplateColumns: '2.2fr 1fr 2.5fr 1fr', borderBottom: '1px solid #EEEFE8', alignItems: 'center' },
  etd:         { padding: '10px 16px', fontSize: '12px', color: '#141514', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: "'Poppins', sans-serif" },
  ddot:        { width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0 },
  ebar:        { flex: 1, height: '6px', background: '#D8DAD0', borderRadius: '3px', margin: '0 6px' },
  efill:       { height: '100%', borderRadius: '3px' },
  riskBadge:   { fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '10px', fontFamily: "'Poppins', sans-serif" },
  bbar:        { flexShrink: 0, padding: '12px 28px', background: '#fff', borderTop: '1px solid #D8DAD0', display: 'flex', alignItems: 'center', gap: '8px' },
  btnClear:    { padding: '7px 14px', borderRadius: '8px', border: '1px solid #F5C9C9', background: '#fff', fontSize: '11px', fontWeight: 600, color: '#E24B4A', cursor: 'pointer', fontFamily: "'Poppins', sans-serif" },
  emptyState:  { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '8px' },
};