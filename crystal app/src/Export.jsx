import React, { useEffect } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
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

const RISK_STYLE = {
  High:     { background: '#FFF0ED', color: '#A32D2D' },
  Moderate: { background: '#FFF8ED', color: '#C07320' },
  Low:      { background: '#E8F5E8', color: '#1F5330' },
};

export default function Export({
  goToUpload, goToResults, goToAnalysis, goToPatients, goToLibrary, goToLogin,
  markReportsViewed, badges = {}, analysisData, clearAnalysisData,
}) {
  useEffect(() => {
    if (markReportsViewed) markReportsViewed();
  }, [markReportsViewed]);

  const crystals = analysisData?.results || [];
  const totalCrystals = crystals.reduce((sum, c) => sum + c.count, 0);

  const handleClear = () => {
    if (window.confirm('Clear this report? This cannot be undone.')) {
      if (clearAnalysisData) clearAnalysisData();
    }
  };

  const handleExportPDF = () => {
    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const rows = crystals.map(c => {
      const pct = totalCrystals > 0 ? Math.round(c.count / totalCrystals * 100) : 0;
      const riskStyle = RISK_STYLE[c.risk] || RISK_STYLE.Low;
      return `
        <tr>
          <td style="padding:10px 14px;border-bottom:1px solid #EEEFE8;font-size:12px;color:#141514;">
            <span style="width:10px;height:10px;border-radius:50%;background:${CRYSTAL_COLORS[c.crystalType] || '#888'};display:inline-block;margin-right:8px;vertical-align:middle;"></span>
            ${c.crystalType}
          </td>
          <td style="padding:10px 14px;border-bottom:1px solid #EEEFE8;font-size:12px;color:#141514;">${c.count}</td>
          <td style="padding:10px 14px;border-bottom:1px solid #EEEFE8;font-size:12px;color:#141514;">${pct}%</td>
          <td style="padding:10px 14px;border-bottom:1px solid #EEEFE8;">
            <span style="font-size:10px;font-weight:600;padding:2px 8px;border-radius:10px;background:${riskStyle.background};color:${riskStyle.color};">
              ${c.risk}
            </span>
          </td>
        </tr>
      `;
    }).join('');

    const html = `
      <html>
      <head>
        <title>CrystalScope Report</title>
        <style>
          body { font-family: 'Poppins', sans-serif; margin: 0; padding: 32px; background: #fff; color: #141514; }
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
        <h1>CrystalScope Report</h1>
        <div class="sub">Generated on ${date}</div>
        <div class="info-row">
          <div class="info-box"><div class="info-lbl">Patient</div><div class="info-val">${analysisData?.patientName || '—'}</div></div>
          <div class="info-box"><div class="info-lbl">Patient ID</div><div class="info-val">${analysisData?.patientId || '—'}</div></div>
          <div class="info-box"><div class="info-lbl">Sample ID</div><div class="info-val">${analysisData?.sampleId || '—'}</div></div>
          <div class="info-box"><div class="info-lbl">Total crystals</div><div class="info-val">${totalCrystals}</div></div>
        </div>
        <table>
          <thead>
            <tr><th>Crystal Type</th><th>Count</th><th>Distribution</th><th>Risk</th></tr>
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

            {/* Header — always visible */}
            <div style={styles.header}>
              <div>
                {crystals.length > 0 ? (
                  <>
                    <div style={styles.expTitle}>Detected crystals ({totalCrystals})</div>
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
              {/* View past reports — always visible, repositioned to top-right */}
              <button onClick={goToLibrary} style={styles.libraryLink}>
                View past reports in Library →
              </button>
            </div>

            {crystals.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={{ fontSize: '40px' }}>📄</div>
                <div style={{ fontSize: '14px', fontWeight: 500, color: '#A4AAA4', fontFamily: "'Poppins', sans-serif" }}>No report yet</div>
                <div style={{ fontSize: '12px', color: '#C9CAC0', fontFamily: "'Poppins', sans-serif" }}>Analyze an image first, then come back to export</div>
              </div>
            ) : (
              <>
                <div style={styles.expTable}>
                  <div style={styles.expThead}>
                    <div style={styles.eth}>Type</div>
                    <div style={styles.eth}>Count</div>
                    <div style={styles.eth}>Distribution</div>
                    <div style={styles.eth}>Risk</div>
                  </div>
                  <div style={styles.expBody}>
                    {crystals.map((crystal, i) => {
                      const pct = totalCrystals > 0 ? Math.round(crystal.count / totalCrystals * 100) : 0;
                      const color = CRYSTAL_COLORS[crystal.crystalType] || '#888';
                      const riskStyle = RISK_STYLE[crystal.risk] || RISK_STYLE.Low;
                      return (
                        <div key={i} style={styles.erow}>
                          <div style={styles.etd}>
                            <div style={{ ...styles.ddot, background: color }}></div>
                            {crystal.crystalType}
                          </div>
                          <div style={styles.etd}>{crystal.count}</div>
                          <div style={styles.etd}>
                            <div style={styles.ebar}>
                              <div style={{ ...styles.efill, width: `${pct}%`, background: color }}></div>
                            </div>
                            {pct}%
                          </div>
                          <div style={styles.etd}>
                            <span style={{ ...styles.riskBadge, ...riskStyle }}>{crystal.risk}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={styles.bbar}>
                  {/* Clear button — left side */}
                  <button onClick={handleClear} style={styles.btnClear}>🗑 Clear report</button>
                  <div style={{ flex: 1 }} />
                  <button onClick={handleExportPDF} className="btn-export">📥 Export PDF</button>
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