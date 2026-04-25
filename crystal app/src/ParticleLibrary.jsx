import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { getAnalyses, deleteAnalysis } from './api';
import { PARTICLE_TYPES, PARTICLE_COLORS, PARTICLE_GROUPS, RISK_STYLE } from './particleConstants';
import './index.css';

const getInitials = (name) => (name || '??').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
const AVATAR_COLORS = ['#1F5330', '#306A33', '#4A7A50', '#2D6A4F', '#1B4332', '#40916C'];
const getAvatarColor = (name) => AVATAR_COLORS[(name || '').charCodeAt(0) % AVATAR_COLORS.length];

export default function ParticleLibrary({
  goToLogin, goToUpload, goToResults, goToAnalysis, goToExport, goToPatients, goToLibrary,
  badges = {},
}) {
  const [activeFilter, setActiveFilter]       = useState('All');
  const [activeGroup, setActiveGroup]         = useState('All');
  const [particleRecords, setParticleRecords] = useState([]);
  const [loading, setLoading]                 = useState(true);

  useEffect(() => { fetchAnalyses(); }, []);

  const fetchAnalyses = async () => {
    try {
      setLoading(true);
      const data = await getAnalyses();
      setParticleRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching analyses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroup = async (group) => {
    if (!window.confirm(`Delete all records for ${group.patientName} (${group.patientId})?`)) return;
    try {
      await Promise.all(group.particles.map(c => deleteAnalysis(c._id)));
      setParticleRecords(prev => prev.filter(r => r.patientId !== group.patientId));
    } catch {
      alert('Error deleting records.');
    }
  };

  // Normalize: support both crystalType and particleType field names
  const normalize = (r) => ({
    ...r,
    particleType: r.particleType || r.crystalType || '',
  });

  const normalized = particleRecords.map(normalize);

  // Filter by group first, then by particle type
  const filtered = normalized.filter(r => {
    const typeLabel = r.particleType;
    const matchGroup = activeGroup === 'All' ||
      PARTICLE_TYPES.find(p => p.label === typeLabel)?.group === activeGroup;
    const matchType  = activeFilter === 'All' || typeLabel === activeFilter;
    return matchGroup && matchType;
  });

  // Group by patient
  const grouped = filtered.reduce((acc, record) => {
    const key = record.patientId;
    if (!acc[key]) {
      acc[key] = {
        patientId:   record.patientId,
        patientName: record.patientName,
        sampleId:    record.sampleId,
        date:        record.date,
        particles:   [],
      };
    }
    acc[key].particles.push(record);
    return acc;
  }, {});

  const groupList    = Object.values(grouped);
  const totalEntries = filtered.length;

  // Types available for current group filter
  const availableTypes = ['All', ...PARTICLE_TYPES
    .filter(p => activeGroup === 'All' || p.group === activeGroup)
    .map(p => p.label)];

  const getGridCols = (count) => {
    if (count <= 2) return `repeat(${count}, 1fr)`;
    if (count <= 4) return 'repeat(4, 1fr)';
    return 'repeat(4, 1fr)';
  };

  const handleExportPDF = (group) => {
    const date = new Date(group.date).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
    const total = group.particles.reduce((sum, c) => sum + c.count, 0);

    const rows = group.particles.map(c => {
      const pct = total > 0 ? Math.round(c.count / total * 100) : 0;
      const rs  = RISK_STYLE[c.risk] || RISK_STYLE.Low;
      const color = PARTICLE_COLORS[c.particleType] || '#888';
      return `
        <tr>
          <td style="padding:10px 14px;border-bottom:1px solid #EEEFE8;font-size:12px;color:#141514;">
            <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${color};margin-right:8px;vertical-align:middle;"></span>
            ${c.particleType}
          </td>
          <td style="padding:10px 14px;border-bottom:1px solid #EEEFE8;font-size:12px;">${c.count}</td>
          <td style="padding:10px 14px;border-bottom:1px solid #EEEFE8;font-size:12px;">${pct}%</td>
          <td style="padding:10px 14px;border-bottom:1px solid #EEEFE8;">
            <span style="font-size:10px;font-weight:600;padding:2px 8px;border-radius:10px;background:${rs.background};color:${rs.color};">${c.risk}</span>
          </td>
        </tr>
      `;
    }).join('');

    const html = `
      <html>
      <head>
        <title>MagniTect Report — ${group.patientName}</title>
        <style>
          body  { font-family: Arial, sans-serif; margin: 0; padding: 32px; background: #fff; color: #141514; }
          h1    { font-size: 22px; font-weight: 800; color: #1F5330; margin-bottom: 4px; }
          .sub  { font-size: 12px; color: #A4AAA4; margin-bottom: 24px; }
          .info { display: flex; gap: 20px; margin-bottom: 24px; flex-wrap: wrap; }
          .box  { background: #F5F6F0; border-radius: 10px; padding: 10px 16px; }
          .lbl  { font-size: 10px; font-weight: 700; color: #A4AAA4; text-transform: uppercase; margin-bottom: 4px; }
          .val  { font-size: 15px; font-weight: 800; color: #141514; }
          table { width: 100%; border-collapse: collapse; border: 1px solid #D8DAD0; border-radius: 12px; overflow: hidden; }
          thead { background: #1F5330; }
          th    { padding: 10px 14px; font-size: 10px; font-weight: 700; color: #9FC8A8; text-align: left; text-transform: uppercase; letter-spacing: 0.06em; }
          @media print { body { padding: 16px; } }
        </style>
      </head>
      <body>
        <h1>MagniTect Urinalysis Report</h1>
        <div class="sub">Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
        <div class="info">
          <div class="box"><div class="lbl">Patient</div><div class="val">${group.patientName}</div></div>
          <div class="box"><div class="lbl">Patient ID</div><div class="val">${group.patientId}</div></div>
          <div class="box"><div class="lbl">Sample ID</div><div class="val">${group.sampleId}</div></div>
          <div class="box"><div class="lbl">Date</div><div class="val">${date}</div></div>
          <div class="box"><div class="lbl">Total Particles</div><div class="val">${total}</div></div>
        </div>
        <table>
          <thead><tr><th>Particle Type</th><th>Count</th><th>Distribution</th><th>Risk</th></tr></thead>
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
          currentPage="library"
          goToUpload={goToUpload}
          goToResults={goToResults}
          goToAnalysis={goToAnalysis}
          goToExport={goToExport}
          goToPatients={goToPatients}
          goToLibrary={goToLibrary}
          badges={badges}
        />
        <div style={styles.main}>
          <div style={styles.pane}>

            {/* Header */}
            <div style={styles.header}>
              <div style={styles.pageTitle}>Particle Library</div>
              <div style={styles.entryCount}>
                {groupList.length} {groupList.length === 1 ? 'patient' : 'patients'} · {totalEntries} {totalEntries === 1 ? 'entry' : 'entries'}
              </div>
            </div>

            {/* Group Filter */}
            <div style={styles.filters}>
              {PARTICLE_GROUPS.map(group => (
                <button
                  key={group}
                  style={{ ...styles.pill, ...(activeGroup === group ? styles.pillActive : {}) }}
                  onClick={() => { setActiveGroup(group); setActiveFilter('All'); }}
                >
                  {group}
                </button>
              ))}
            </div>

            {/* Type Filter — only shows when group is selected */}
            {activeGroup !== 'All' && (
              <div style={styles.subFilters}>
                {availableTypes.map(type => (
                  <button
                    key={type}
                    style={{ ...styles.subPill, ...(activeFilter === type ? styles.subPillActive : {}) }}
                    onClick={() => setActiveFilter(type)}
                  >
                    {type}
                  </button>
                ))}
              </div>
            )}

            {loading ? (
              <div style={styles.loadingWrap}>Loading particle library...</div>
            ) : groupList.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#C9CAC0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 3h6v8l3.5 6A2 2 0 0 1 16.76 20H7.24a2 2 0 0 1-1.74-3L9 11V3z"/>
                    <path d="M6.5 14h11"/>
                  </svg>
                </div>
                <div style={styles.emptyText}>No particles found</div>
                <div style={styles.emptyHint}>
                  {activeFilter === 'All' && activeGroup === 'All'
                    ? 'Analyze a sample to start building your library'
                    : `No ${activeFilter === 'All' ? activeGroup : activeFilter} particles detected yet`}
                </div>
              </div>
            ) : (
              groupList.map((group) => (
                <div key={group.patientId} style={styles.group}>

                  {/* Patient Header */}
                  <div style={styles.groupHeader}>
                    <div style={{ ...styles.avatar, background: getAvatarColor(group.patientName) }}>
                      {getInitials(group.patientName)}
                    </div>
                    <div>
                      <div style={styles.groupName}>{group.patientName}</div>
                      <div style={styles.groupMeta}>
                        {group.patientId} · {group.sampleId} · {new Date(group.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                    <div style={styles.groupRight}>
                      <div style={styles.groupBadge}>
                        {group.particles.length} {group.particles.length === 1 ? 'particle type' : 'particle types'}
                      </div>
                      <button style={styles.exportBtn} onClick={() => handleExportPDF(group)}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="7 10 12 15 17 10"/>
                          <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                        Export PDF
                      </button>
                      <button style={styles.deleteBtn} onClick={() => handleDeleteGroup(group)}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                          <path d="M10 11v6M14 11v6"/>
                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                        </svg>
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Particle Grid */}
                  <div style={{ ...styles.particleGrid, gridTemplateColumns: getGridCols(group.particles.length) }}>
                    {group.particles.map((particle, i) => {
                      const color = PARTICLE_COLORS[particle.particleType] || '#888';
                      const rs    = RISK_STYLE[particle.risk] || RISK_STYLE.Low;
                      const ptype = PARTICLE_TYPES.find(p => p.label === particle.particleType);
                      return (
                        <div key={i} style={styles.particleCell}>
                          <div style={styles.cellTop}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <div style={{ ...styles.cellDot, background: color }} />
                              <span style={styles.cellType}>{particle.particleType}</span>
                            </div>
                            <span style={{ ...styles.riskBadge, ...rs }}>{particle.risk}</span>
                          </div>
                          {ptype && (
                            <div style={styles.cellGroup}>{ptype.group}</div>
                          )}
                          <div style={styles.cellCount}>{particle.count}</div>
                          <div style={styles.cellLabel}>particles detected</div>
                        </div>
                      );
                    })}
                  </div>

                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  app:          { display: 'flex', flexDirection: 'column', width: '100%', height: '100vh', background: '#EEF0E8', overflow: 'hidden' },
  body:         { flex: 1, display: 'grid', gridTemplateColumns: '210px 1fr', minHeight: 0, overflow: 'hidden' },
  main:         { display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden', background: '#EEF0E8' },
  pane:         { flex: 1, display: 'flex', flexDirection: 'column', padding: '20px 28px', gap: '14px', minHeight: 0, overflowY: 'auto' },
  header:       { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 },
  pageTitle:    { fontSize: '18px', fontWeight: 700, color: '#141514', fontFamily: "'Poppins', sans-serif" },
  entryCount:   { fontSize: '12px', color: '#A4AAA4', fontFamily: "'Poppins', sans-serif" },
  filters:      { display: 'flex', gap: '8px', flexWrap: 'wrap', flexShrink: 0 },
  pill:         { padding: '6px 16px', borderRadius: '100px', border: '1.5px solid #D8DAD0', background: '#fff', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: "'Poppins', sans-serif", color: '#4A5240' },
  pillActive:   { background: '#1F5330', color: '#fff', borderColor: '#1F5330' },
  subFilters:   { display: 'flex', gap: '6px', flexWrap: 'wrap', flexShrink: 0, paddingLeft: '4px' },
  subPill:      { padding: '4px 12px', borderRadius: '100px', border: '1px solid #D8DAD0', background: '#F5F6F0', fontSize: '11px', fontWeight: 500, cursor: 'pointer', fontFamily: "'Poppins', sans-serif", color: '#4A5240' },
  subPillActive: { background: '#E8F5E8', color: '#1F5330', borderColor: '#1F5330' },
  group:        { background: '#fff', border: '1px solid #D8DAD0', borderRadius: '14px', overflow: 'hidden', flexShrink: 0 },
  groupHeader:  { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: '#F5F6F0', borderBottom: '1px solid #EEEFE8' },
  avatar:       { width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: '#fff', flexShrink: 0 },
  groupName:    { fontSize: '13px', fontWeight: 700, color: '#141514', fontFamily: "'Poppins', sans-serif" },
  groupMeta:    { fontSize: '11px', color: '#A4AAA4', marginTop: '2px', fontFamily: "'Poppins', sans-serif" },
  groupRight:   { marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' },
  groupBadge:   { fontSize: '10px', fontWeight: 600, padding: '3px 10px', borderRadius: '10px', background: '#E8F5E8', color: '#1F5330', fontFamily: "'Poppins', sans-serif" },
  exportBtn:    { fontSize: '11px', fontWeight: 600, padding: '5px 12px', borderRadius: '8px', border: '1px solid #D8DAD0', background: '#fff', color: '#1F5330', cursor: 'pointer', fontFamily: "'Poppins', sans-serif", display: 'flex', alignItems: 'center', gap: '5px' },
  deleteBtn:    { fontSize: '11px', fontWeight: 600, padding: '5px 12px', borderRadius: '8px', border: '1px solid #F5C9C9', background: '#fff', color: '#E24B4A', cursor: 'pointer', fontFamily: "'Poppins', sans-serif", display: 'flex', alignItems: 'center', gap: '5px' },
  particleGrid: { display: 'grid', gap: '1px', background: '#EEEFE8' },
  particleCell: { background: '#fff', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '4px' },
  cellTop:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' },
  cellType:     { fontSize: '11px', fontWeight: 700, color: '#141514', fontFamily: "'Poppins', sans-serif" },
  cellGroup:    { fontSize: '10px', color: '#A4AAA4', fontFamily: "'Poppins', sans-serif" },
  riskBadge:    { fontSize: '9px', fontWeight: 600, padding: '2px 7px', borderRadius: '8px', fontFamily: "'Poppins', sans-serif" },
  cellCount:    { fontSize: '28px', fontWeight: 800, color: '#1F5330', fontFamily: "'Poppins', sans-serif" },
  cellLabel:    { fontSize: '10px', color: '#A4AAA4', fontFamily: "'Poppins', sans-serif" },
  cellDot:      { width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0 },
  emptyState:   { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '8px' },
  emptyIcon:    { display: 'flex', alignItems: 'center', justifyContent: 'center' },
  emptyText:    { fontSize: '14px', fontWeight: 500, color: '#A4AAA4', fontFamily: "'Poppins', sans-serif" },
  emptyHint:    { fontSize: '12px', color: '#C9CAC0', fontFamily: "'Poppins', sans-serif" },
  loadingWrap:  { display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: '#A4AAA4', fontFamily: "'Poppins', sans-serif", fontSize: '14px' },
};