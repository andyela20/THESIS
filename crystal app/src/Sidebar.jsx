import React from 'react';
import './index.css';

const UploadIcon = ({ color }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="17 8 12 3 7 8"></polyline>
    <line x1="12" y1="3" x2="12" y2="15"></line>
  </svg>
);

const ResultsIcon = ({ color }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
    <polyline points="17 6 23 6 23 12"></polyline>
  </svg>
);

const ParticleIcon = ({ color }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <circle cx="12" cy="12" r="8" strokeDasharray="2 2"/>
    <line x1="12" y1="2" x2="12" y2="6"/>
    <line x1="12" y1="18" x2="12" y2="22"/>
    <line x1="2" y1="12" x2="6" y2="12"/>
    <line x1="18" y1="12" x2="22" y2="12"/>
  </svg>
);

const ReportsIcon = ({ color }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
    <polyline points="13 2 13 9 20 9"></polyline>
  </svg>
);

const LibraryIcon = ({ color }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <path d="m21 21-4.35-4.35"></path>
  </svg>
);

const PatientsIcon = ({ color }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
);

export default function Sidebar({
  currentPage,
  goToUpload,
  goToResults,
  goToAnalysis,
  goToExport,
  goToPatients,
  goToLibrary,
  badges = {},
}) {
  const SidebarItem = ({ label, icon, onClick, isActive, badge }) => (
    <div
      onClick={onClick}
      className={`sidebar-item${isActive ? ' sidebar-item--active' : ''}`}
      style={{ color: isActive ? '#fff' : '#4A5240' }}
    >
      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '16px', height: '16px', flexShrink: 0 }}>
        {icon}
      </span>
      {label}
      {badge && (
        <span style={{ marginLeft: 'auto', fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '10px', background: isActive ? 'rgba(255,255,255,0.25)' : '#1FB505', color: '#fff' }}>
          {badge}
        </span>
      )}
    </div>
  );

  return (
    <div style={{ background: '#E8EAE0', borderRight: '1.5px solid #D8DAD0', padding: '14px 10px', display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
      <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#A4AAA4', padding: '10px 10px 4px', fontFamily: "'Poppins', sans-serif" }}>
        Workspace
      </div>
      <SidebarItem
        label="New Analysis"
        icon={<UploadIcon color={currentPage === 'upload' ? '#fff' : '#4A5240'} />}
        onClick={goToUpload}
        isActive={currentPage === 'upload'}
      />
      <SidebarItem
        label="Results"
        icon={<ResultsIcon color={currentPage === 'results' ? '#fff' : '#4A5240'} />}
        onClick={() => goToResults()}
        isActive={currentPage === 'results'}
        badge={badges.results}
      />
      <SidebarItem
        label="Analysis"
        icon={<ParticleIcon color={currentPage === 'analysis' ? '#fff' : '#4A5240'} />}
        onClick={goToAnalysis}
        isActive={currentPage === 'analysis'}
      />
      <SidebarItem
        label="Reports"
        icon={<ReportsIcon color={currentPage === 'export' ? '#fff' : '#4A5240'} />}
        onClick={goToExport}
        isActive={currentPage === 'export'}
        badge={badges.export}
      />

      <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#A4AAA4', padding: '10px 10px 4px', marginTop: '10px', fontFamily: "'Poppins', sans-serif" }}>
        Reference
      </div>
      <SidebarItem
        label="Particle Library"
        icon={<LibraryIcon color={currentPage === 'library' ? '#fff' : '#4A5240'} />}
        onClick={goToLibrary}
        isActive={currentPage === 'library'}
      />
      <SidebarItem
        label="Patients"
        icon={<PatientsIcon color={currentPage === 'patients' ? '#fff' : '#4A5240'} />}
        onClick={goToPatients}
        isActive={currentPage === 'patients'}
        badge={badges.patients}
      />
    </div>
  );
}