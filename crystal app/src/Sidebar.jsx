import React from 'react';

export default function Sidebar({ currentPage, goToUpload, goToResults, goToAnalysis, goToExport }) {
  const SidebarItem = ({ label, icon, onClick, isActive, badge }) => (
    <div
      onClick={onClick}
      className={`sidebar-item${isActive ? ' sidebar-item--active' : ''}`}
      style={{
        color: isActive ? '#fff' : '#4A5240',
      }}
    >
      <span style={{ fontSize: '14px' }}>{icon}</span>
      {label}
      {badge && (
        <span style={{
          marginLeft: 'auto',
          fontSize: '9px',
          fontWeight: 700,
          padding: '2px 6px',
          borderRadius: '10px',
          background: isActive ? 'rgba(255,255,255,0.25)' : '#1FB505',
          color: '#fff',
        }}>
          {badge}
        </span>
      )}
    </div>
  );

  return (
    <div style={{
      background: '#E8EAE0',
      borderRight: '1.5px solid #D8DAD0',
      padding: '14px 10px',
      display: 'flex',
      flexDirection: 'column',
      gap: '2px',
      overflow: 'hidden',
    }}>
      <div style={{
        fontSize: '9px',
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: '#A4AAA4',
        padding: '10px 10px 4px',
      }}>
        Workspace
      </div>

      <SidebarItem label="New analysis"   icon="📤" onClick={goToUpload}   isActive={currentPage === 'upload'} />
      <SidebarItem label="Results"        icon="📊" onClick={goToResults}  isActive={currentPage === 'results'}  badge="1" />
      <SidebarItem label="Analysis"       icon="📈" onClick={goToAnalysis} isActive={currentPage === 'analysis'} />
      <SidebarItem label="Reports"        icon="📁" onClick={goToExport}   isActive={currentPage === 'export'}   badge="3" />

      <div style={{
        fontSize: '9px',
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: '#A4AAA4',
        padding: '10px 10px 4px',
        marginTop: '10px',
      }}>
        Reference
      </div>
      <SidebarItem label="Crystal library" icon="🔍" onClick={() => {}} />
      <SidebarItem label="Patients"         icon="👥" onClick={() => {}} />
    </div>
  );
}