import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import './index.css';

const styles = {
  app: { display: 'flex', flexDirection: 'column', width: '100%', height: '100vh', background: '#EEF0E8', overflow: 'hidden' },
  body: { flex: 1, display: 'grid', gridTemplateColumns: '210px 1fr', minHeight: 0, overflow: 'hidden' },
  main: { display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden', background: '#EEF0E8' },
  pane: { flex: 1, display: 'flex', flexDirection: 'column', padding: '20px 28px', gap: '14px', minHeight: 0, overflowY: 'auto' },
  
  // Header Section
  header: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: '8px' 
  },
  pageTitle: { 
    fontSize: '18px', 
    fontWeight: 700, 
    color: '#141514', 
    fontFamily: "'Poppins', sans-serif" 
  },
  btnAdd: { 
    background: '#1F5330', 
    color: '#fff', 
    border: 'none', 
    borderRadius: '8px', 
    padding: '8px 18px', 
    fontSize: '12px', 
    fontWeight: 600, 
    cursor: 'pointer', 
    fontFamily: "'Poppins', sans-serif" 
  },

  // Search & Filter Section
  filterBar: { 
    display: 'flex', 
    gap: '12px', 
    marginBottom: '12px', 
    alignItems: 'center' 
  },
  searchInput: { 
    flex: 1, 
    padding: '8px 14px', 
    border: '1px solid #D8DAD0', 
    borderRadius: '8px', 
    fontSize: '12px', 
    fontFamily: "'Poppins', sans-serif",
    background: '#fff',
    color: '#141514'
  },
  filterSelect: { 
    padding: '8px 12px', 
    border: '1px solid #D8DAD0', 
    borderRadius: '8px', 
    fontSize: '12px', 
    fontFamily: "'Poppins', sans-serif",
    background: '#fff',
    color: '#141514'
  },

  // Table Styles
  tableContainer: { 
    flex: 1, 
    background: '#fff', 
    border: '1px solid #D8DAD0', 
    borderRadius: '14px', 
    overflow: 'hidden', 
    display: 'flex', 
    flexDirection: 'column', 
    minHeight: 0 
  },
  tableHead: { 
    display: 'grid', 
    gridTemplateColumns: '1.2fr 1fr 0.8fr 1fr 1.2fr 1fr 1.2fr',
    background: '#1F5330', 
    flexShrink: 0 
  },
  th: { 
    padding: '12px 16px', 
    fontSize: '11px', 
    fontWeight: 700, 
    color: '#9FC8A8', 
    letterSpacing: '0.06em', 
    textTransform: 'uppercase',
    fontFamily: "'Poppins', sans-serif"
  },
  tableBody: { 
    flex: 1, 
    overflow: 'hidden', 
    overflowY: 'auto' 
  },
  tr: { 
    display: 'grid', 
    gridTemplateColumns: '1.2fr 1fr 0.8fr 1fr 1.2fr 1fr 1.2fr',
    borderBottom: '1px solid #EEEFE8', 
    alignItems: 'center',
    transition: 'background 0.12s'
  },
  trHover: { 
    background: '#F5F6F0' 
  },
  td: { 
    padding: '12px 16px', 
    fontSize: '12px', 
    color: '#141514',
    fontFamily: "'Poppins', sans-serif"
  },
  tdMuted: { 
    color: '#A4AAA4', 
    fontSize: '11px' 
  },

  // Status Badge
  badge: { 
    display: 'inline-block',
    padding: '3px 10px', 
    borderRadius: '12px', 
    fontSize: '10px', 
    fontWeight: 600,
    fontFamily: "'Poppins', sans-serif"
  },
  badgeActive: { 
    background: '#E8F5E8', 
    color: '#1FB505' 
  },
  badgeInactive: { 
    background: '#F5F5F5', 
    color: '#A4AAA4' 
  },

  // Action Buttons
  actionBtns: { 
    display: 'flex', 
    gap: '6px', 
    alignItems: 'center' 
  },
  btnSmall: { 
    padding: '5px 10px', 
    borderRadius: '6px', 
    border: '1px solid #D8DAD0', 
    background: '#fff', 
    fontSize: '11px', 
    fontWeight: 600, 
    cursor: 'pointer',
    fontFamily: "'Poppins', sans-serif",
    transition: 'all 0.12s'
  },
  btnView: { 
    color: '#306A33', 
    borderColor: '#B8E0AF' 
  },
  btnEdit: { 
    color: '#1F5330', 
    borderColor: '#B8E0AF' 
  },
  btnDelete: { 
    color: '#E24B4A', 
    borderColor: '#F5C9C9' 
  },

  // Empty State
  emptyState: { 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    justifyContent: 'center', 
    height: '300px', 
    color: '#A4AAA4',
    fontFamily: "'Poppins', sans-serif"
  },
  emptyIcon: { 
    fontSize: '48px', 
    marginBottom: '12px' 
  },
  emptyText: { 
    fontSize: '14px', 
    fontWeight: 500 
  },

  // Stats Bar
  statsBar: {
    display: 'flex',
    gap: '20px',
    padding: '12px 16px',
    background: '#F5F6F0',
    borderBottom: '1px solid #D8DAD0',
    fontSize: '12px',
    fontFamily: "'Poppins', sans-serif"
  },
  statItem: {
    display: 'flex',
    gap: '6px',
    alignItems: 'center'
  },
  statLabel: {
    color: '#A4AAA4',
    fontWeight: 500
  },
  statValue: {
    color: '#141514',
    fontWeight: 700
  }
};

export default function Patients({ goToLogin }) {
  // Sample patient data - in production, this would come from a backend
  const [patients, setPatients] = useState([
    {
      id: 'PT-2025-001',
      name: 'Juan dela Cruz',
      age: 67,
      sex: 'Male',
      dob: '1957-08-15',
      address: '123 Manila St, Metro Manila',
      status: 'Active'
    },
    {
      id: 'PT-2025-002',
      name: 'Maria Santos',
      age: 54,
      sex: 'Female',
      dob: '1970-12-22',
      address: '456 Quezon Ave, Quezon City',
      status: 'Active'
    },
    {
      id: 'PT-2025-003',
      name: 'Roberto Reyes',
      age: 72,
      sex: 'Male',
      dob: '1952-03-10',
      address: '789 Rizal St, Makati',
      status: 'Active'
    },
    {
      id: 'PT-2025-004',
      name: 'Angela Gomez',
      age: 48,
      sex: 'Female',
      dob: '1976-06-05',
      address: '321 Pasay Rd, Pasay City',
      status: 'Inactive'
    },
    {
      id: 'PT-2025-005',
      name: 'Carlos Morales',
      age: 63,
      sex: 'Male',
      dob: '1961-11-18',
      address: '654 Bonifacio Ave, BGC',
      status: 'Active'
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [hoveredRow, setHoveredRow] = useState(null);

  // Filter patients based on search and status
  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.id.includes(searchTerm);
    const matchesStatus = filterStatus === 'All' || patient.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this patient record?')) {
      setPatients(patients.filter(p => p.id !== id));
    }
  };

  const handleEdit = (id) => {
    alert(`Edit patient: ${id}`);
  };

  const handleView = (id) => {
    alert(`View patient: ${id}`);
  };

  return (
    <div style={styles.app}>
      <Topbar goToLogin={goToLogin} />

      <div style={styles.body}>
        <Sidebar 
          currentPage="patients" 
          goToUpload={() => {}} 
          goToResults={() => {}} 
          goToAnalysis={() => {}} 
          goToExport={() => {}} 
          goToPatients={() => {}} 
        />

        <div style={styles.main}>
          <div style={styles.pane}>
            {/* Page Header */}
            <div style={styles.header}>
              <div style={styles.pageTitle}>Patient Directory</div>
              <button style={styles.btnAdd}>+ Add Patient</button>
            </div>

            {/* Search & Filter Bar */}
            <div style={styles.filterBar}>
              <input 
                type="text" 
                placeholder="Search by name or patient ID..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
              />
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={styles.filterSelect}
              >
                <option>All</option>
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>

            {/* Table Container */}
            {filteredPatients.length > 0 ? (
              <div style={styles.tableContainer}>
                {/* Stats Bar */}
                <div style={styles.statsBar}>
                  <div style={styles.statItem}>
                    <span style={styles.statLabel}>Total:</span>
                    <span style={styles.statValue}>{filteredPatients.length}</span>
                  </div>
                  <div style={styles.statItem}>
                    <span style={styles.statLabel}>Active:</span>
                    <span style={styles.statValue}>{filteredPatients.filter(p => p.status === 'Active').length}</span>
                  </div>
                  <div style={styles.statItem}>
                    <span style={styles.statLabel}>Inactive:</span>
                    <span style={styles.statValue}>{filteredPatients.filter(p => p.status === 'Inactive').length}</span>
                  </div>
                </div>

                {/* Table Head */}
                <div style={styles.tableHead}>
                  <div style={styles.th}>Patient ID</div>
                  <div style={styles.th}>Full Name</div>
                  <div style={styles.th}>Age</div>
                  <div style={styles.th}>Gender</div>
                  <div style={styles.th}>Date of Birth</div>
                  <div style={styles.th}>Status</div>
                  <div style={styles.th}>Actions</div>
                </div>

                {/* Table Body */}
                <div style={styles.tableBody}>
                  {filteredPatients.map((patient) => (
                    <div 
                      key={patient.id}
                      style={{
                        ...styles.tr,
                        ...(hoveredRow === patient.id ? styles.trHover : {})
                      }}
                      onMouseEnter={() => setHoveredRow(patient.id)}
                      onMouseLeave={() => setHoveredRow(null)}
                    >
                      <div style={styles.td}>
                        <span style={{ fontWeight: 600, color: '#1F5330' }}>{patient.id}</span>
                      </div>
                      <div style={styles.td}>
                        {patient.name}
                      </div>
                      <div style={styles.td}>
                        {patient.age}
                      </div>
                      <div style={styles.td}>
                        {patient.sex}
                      </div>
                      <div style={styles.td}>
                        <span style={styles.tdMuted}>
                          {new Date(patient.dob).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <div style={styles.td}>
                        <span style={{
                          ...styles.badge,
                          ...(patient.status === 'Active' ? styles.badgeActive : styles.badgeInactive)
                        }}>
                          {patient.status}
                        </span>
                      </div>
                      <div style={styles.td}>
                        <div style={styles.actionBtns}>
                          <button 
                            onClick={() => handleView(patient.id)}
                            style={{...styles.btnSmall, ...styles.btnView}}
                            title="View patient"
                          >
                            👁 View
                          </button>
                          <button 
                            onClick={() => handleEdit(patient.id)}
                            style={{...styles.btnSmall, ...styles.btnEdit}}
                            title="Edit patient"
                          >
                            ✎ Edit
                          </button>
                          <button 
                            onClick={() => handleDelete(patient.id)}
                            style={{...styles.btnSmall, ...styles.btnDelete}}
                            title="Delete patient"
                          >
                            🗑 Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>📋</div>
                <div style={styles.emptyText}>No patients found</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}