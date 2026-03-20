import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import './index.css';

const CRYSTAL_TYPES = ['All', 'Calcium Oxalate', 'Uric Acid', 'Struvite', 'Ca Phosphate', 'Cystine'];

const CRYSTAL_COLORS = {
  'Calcium Oxalate': '#E24B4A',
  'Uric Acid':       '#F5A623',
  'Struvite':        '#1FB505',
  'Ca Phosphate':    '#6D9922',
  'Cystine':         '#9B59B6',
};

const RISK_STYLE = {
  High:     { background: '#FFF0ED', color: '#A32D2D' },
  Moderate: { background: '#FFF8ED', color: '#C07320' },
  Low:      { background: '#E8F5E8', color: '#1F5330' },
};

const getInitials = (name) => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

const AVATAR_COLORS = ['#1F5330', '#306A33', '#4A7A50', '#2D6A4F', '#1B4332', '#40916C'];
const getAvatarColor = (name) => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

const styles = {
  app:         { display: 'flex', flexDirection: 'column', width: '100%', height: '100vh', background: '#EEF0E8', overflow: 'hidden' },
  body:        { flex: 1, display: 'grid', gridTemplateColumns: '210px 1fr', minHeight: 0, overflow: 'hidden' },
  main:        { display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden', background: '#EEF0E8' },
  pane:        { flex: 1, display: 'flex', flexDirection: 'column', padding: '20px 28px', gap: '14px', minHeight: 0, overflowY: 'auto' },
  header:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  pageTitle:   { fontSize: '18px', fontWeight: 700, color: '#141514', fontFamily: "'Poppins', sans-serif" },
  entryCount:  { fontSize: '12px', color: '#A4AAA4', fontFamily: "'Poppins', sans-serif" },
  filters:     { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  pill:        { padding: '6px 16px', borderRadius: '100px', border: '1.5px solid #D8DAD0', background: '#fff', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: "'Poppins', sans-serif", transition: 'all 0.15s' },
  pillActive:  { background: '#1F5330', color: '#fff', borderColor: '#1F5330' },

  // Patient group
  group:       { background: '#fff', border: '1px solid #D8DAD0', borderRadius: '14px', overflow: 'hidden' },
  groupHeader: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: '#F5F6F0', borderBottom: '1px solid #EEEFE8' },
  avatar:      { width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: '#fff', flexShrink: 0 },
  groupName:   { fontSize: '13px', fontWeight: 700, color: '#141514', fontFamily: "'Poppins', sans-serif" },
  groupMeta:   { fontSize: '11px', color: '#A4AAA4', marginTop: '2px', fontFamily: "'Poppins', sans-serif" },
  groupBadge:  { marginLeft: 'auto', fontSize: '10px', fontWeight: 600, padding: '3px 10px', borderRadius: '10px', background: '#E8F5E8', color: '#1F5330', fontFamily: "'Poppins', sans-serif" },

  // Crystal row inside group
  crystalGrid: { display: 'grid', gap: '1px', background: '#EEEFE8' },
  crystalCell: { background: '#fff', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '4px' },
  cellTop:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  cellType:    { fontSize: '11px', fontWeight: 700, color: '#141514', fontFamily: "'Poppins', sans-serif" },
  riskBadge:   { fontSize: '9px', fontWeight: 600, padding: '2px 7px', borderRadius: '10px', fontFamily: "'Poppins', sans-serif" },
  cellCount:   { fontSize: '22px', fontWeight: 800, color: '#1F5330', fontFamily: "'Poppins', sans-serif" },
  cellLabel:   { fontSize: '10px', color: '#A4AAA4', fontFamily: "'Poppins', sans-serif" },
  cellDot:     { width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0 },

  // Empty state
  emptyState:  { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '8px', color: '#A4AAA4', fontFamily: "'Poppins', sans-serif" },
  emptyIcon:   { fontSize: '40px' },
  emptyText:   { fontSize: '14px', fontWeight: 500 },
  emptyHint:   { fontSize: '12px', color: '#C9CAC0' },
};

export default function CrystalLibrary({ goToLogin, goToUpload, goToResults, goToAnalysis, goToExport, goToPatients, goToLibrary, crystalRecords = [] }) {
  const [activeFilter, setActiveFilter] = useState('All');

  // Filter records by crystal type
  const filtered = activeFilter === 'All'
    ? crystalRecords
    : crystalRecords.filter(c => c.crystalType === activeFilter);

  // Group filtered records by patientId
  const grouped = filtered.reduce((acc, record) => {
    const key = record.patientId;
    if (!acc[key]) {
      acc[key] = {
        patientId:   record.patientId,
        patientName: record.patientName,
        sampleId:    record.sampleId,
        date:        record.date,
        crystals:    [],
      };
    }
    acc[key].crystals.push(record);
    return acc;
  }, {});

  const groupList = Object.values(grouped);
  const totalEntries = filtered.length;
  const totalPatients = groupList.length;

  // Dynamic grid columns based on crystal count
  const getGridCols = (count) => {
    if (count === 1) return '1fr';
    if (count === 2) return 'repeat(2, 1fr)';
    if (count === 3) return 'repeat(3, 1fr)';
    return 'repeat(4, 1fr)';
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
        />
        <div style={styles.main}>
          <div style={styles.pane}>

            {/* Header */}
            <div style={styles.header}>
              <div style={styles.pageTitle}>Crystal Library</div>
              <div style={styles.entryCount}>
                {totalPatients} {totalPatients === 1 ? 'patient' : 'patients'} · {totalEntries} {totalEntries === 1 ? 'entry' : 'entries'}
              </div>
            </div>

            {/* Filter Pills */}
            <div style={styles.filters}>
              {CRYSTAL_TYPES.map(type => (
                <button
                  key={type}
                  style={{ ...styles.pill, ...(activeFilter === type ? styles.pillActive : {}) }}
                  onClick={() => setActiveFilter(type)}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* Empty State */}
            {groupList.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>🔬</div>
                <div style={styles.emptyText}>No crystals found</div>
                <div style={styles.emptyHint}>
                  {activeFilter === 'All'
                    ? 'Analyze a sample to start building your library'
                    : `No ${activeFilter} crystals detected yet`}
                </div>
              </div>
            ) : (
              /* Patient Groups */
              groupList.map((group) => (
                <div key={group.patientId} style={styles.group}>

                  {/* Group Header */}
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
                    <div style={styles.groupBadge}>
                      {group.crystals.length} {group.crystals.length === 1 ? 'crystal type' : 'crystal types'}
                    </div>
                  </div>

                  {/* Crystal Cells */}
                  <div style={{ ...styles.crystalGrid, gridTemplateColumns: getGridCols(group.crystals.length) }}>
                    {group.crystals.map((crystal, i) => (
                      <div key={i} style={styles.crystalCell}>
                        <div style={styles.cellTop}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ ...styles.cellDot, background: CRYSTAL_COLORS[crystal.crystalType] || '#888' }} />
                            <span style={styles.cellType}>{crystal.crystalType}</span>
                          </div>
                          <span style={{ ...styles.riskBadge, ...RISK_STYLE[crystal.risk] }}>
                            {crystal.risk}
                          </span>
                        </div>
                        <div style={styles.cellCount}>{crystal.count}</div>
                        <div style={styles.cellLabel}>crystals detected</div>
                      </div>
                    ))}
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