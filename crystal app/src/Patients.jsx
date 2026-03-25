import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { getPatients, updatePatient, deletePatient } from './api';
import './index.css';

const styles = {
  app: { display: 'flex', flexDirection: 'column', width: '100%', height: '100vh', background: '#EEF0E8', overflow: 'hidden' },
  body: { flex: 1, display: 'grid', gridTemplateColumns: '210px 1fr', minHeight: 0, overflow: 'hidden' },
  main: { display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden', background: '#EEF0E8' },
  pane: { flex: 1, display: 'flex', flexDirection: 'column', padding: '20px 28px', gap: '14px', minHeight: 0, overflowY: 'auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  pageTitle: { fontSize: '18px', fontWeight: 700, color: '#141514', fontFamily: "'Poppins', sans-serif" },
  btnAdd: { background: '#1F5330', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 18px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Poppins', sans-serif" },
  filterBar: { display: 'flex', gap: '12px', marginBottom: '12px', alignItems: 'center' },
  searchInput: { flex: 1, padding: '8px 14px', border: '1px solid #D8DAD0', borderRadius: '8px', fontSize: '12px', fontFamily: "'Poppins', sans-serif", background: '#fff', color: '#141514' },
  filterSelect: { padding: '8px 12px', border: '1px solid #D8DAD0', borderRadius: '8px', fontSize: '12px', fontFamily: "'Poppins', sans-serif", background: '#fff', color: '#141514' },
  tableContainer: { flex: 1, background: '#fff', border: '1px solid #D8DAD0', borderRadius: '14px', overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 },
  tableHead: { display: 'grid', gridTemplateColumns: '1.2fr 1fr 0.8fr 1fr 1.2fr 1fr 1.2fr', background: '#1F5330', flexShrink: 0 },
  th: { padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#9FC8A8', letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: "'Poppins', sans-serif" },
  tableBody: { flex: 1, overflow: 'hidden', overflowY: 'auto' },
  tr: { display: 'grid', gridTemplateColumns: '1.2fr 1fr 0.8fr 1fr 1.2fr 1fr 1.2fr', borderBottom: '1px solid #EEEFE8', alignItems: 'center', transition: 'background 0.12s' },
  trHover: { background: '#F5F6F0' },
  td: { padding: '12px 16px', fontSize: '12px', color: '#141514', fontFamily: "'Poppins', sans-serif" },
  tdMuted: { color: '#A4AAA4', fontSize: '11px' },
  badge: { display: 'inline-block', padding: '3px 10px', borderRadius: '12px', fontSize: '10px', fontWeight: 600, fontFamily: "'Poppins', sans-serif" },
  badgeActive: { background: '#E8F5E8', color: '#1FB505' },
  badgeInactive: { background: '#F5F5F5', color: '#A4AAA4' },
  actionBtns: { display: 'flex', gap: '6px', alignItems: 'center' },
  btnSmall: { padding: '5px 10px', borderRadius: '6px', border: '1px solid #D8DAD0', background: '#fff', fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Poppins', sans-serif", transition: 'all 0.12s' },
  btnEdit: { color: '#1F5330', borderColor: '#B8E0AF' },
  btnDelete: { color: '#E24B4A', borderColor: '#F5C9C9' },
  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', color: '#A4AAA4', fontFamily: "'Poppins', sans-serif" },
  emptyIcon: { fontSize: '48px', marginBottom: '12px' },
  emptyText: { fontSize: '14px', fontWeight: 500 },
  statsBar: { display: 'flex', gap: '20px', padding: '12px 16px', background: '#F5F6F0', borderBottom: '1px solid #D8DAD0', fontSize: '12px', fontFamily: "'Poppins', sans-serif" },
  statItem: { display: 'flex', gap: '6px', alignItems: 'center' },
  statLabel: { color: '#A4AAA4', fontWeight: 500 },
  statValue: { color: '#141514', fontWeight: 700 },
  loadingWrap: { display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: '#A4AAA4', fontFamily: "'Poppins', sans-serif", fontSize: '14px' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '620px', overflow: 'hidden', margin: '20px' },
  mHead: { background: '#1F5330', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px' },
  mAvatar: { width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: '#fff', flexShrink: 0, fontFamily: "'Poppins', sans-serif" },
  mName: { fontSize: '14px', fontWeight: 700, color: '#fff', fontFamily: "'Poppins', sans-serif" },
  mId: { fontSize: '11px', color: 'rgba(255,255,255,0.65)', marginTop: '2px', fontFamily: "'Poppins', sans-serif" },
  mBadge: { marginLeft: 'auto', fontSize: '10px', fontWeight: 600, padding: '3px 10px', borderRadius: '10px', background: 'rgba(255,255,255,0.2)', color: '#fff', fontFamily: "'Poppins', sans-serif" },
  mBody: { padding: '20px' },
  mGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 24px' },
  mField: { display: 'flex', flexDirection: 'column', gap: '4px' },
  mFieldFull: { display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: '1 / -1' },
  mLabel: { fontSize: '10px', fontWeight: 700, color: '#A4AAA4', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: "'Poppins', sans-serif" },
  mInput: { padding: '8px 10px', border: '1px solid #D8DAD0', borderRadius: '8px', fontSize: '12px', color: '#141514', background: '#F5F6F0', width: '100%', fontFamily: "'Poppins', sans-serif" },
  mInputReadOnly: { padding: '8px 10px', border: '1px solid #D8DAD0', borderRadius: '8px', fontSize: '12px', color: '#1F5330', fontWeight: 600, background: '#F5F6F0', width: '100%', fontFamily: "'Poppins', sans-serif" },
  mDivider: { borderTop: '1px solid #EEEFE8', margin: '16px 0' },
  mStatusRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  mStatusLabel: { fontSize: '12px', color: '#141514', fontWeight: 500, fontFamily: "'Poppins', sans-serif" },
  mToggle: { display: 'flex', gap: '6px' },
  mFoot: { padding: '14px 20px', borderTop: '1px solid #EEEFE8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  btnDel: { padding: '7px 14px', borderRadius: '8px', border: '1px solid #F5C9C9', background: '#fff', fontSize: '11px', fontWeight: 600, color: '#E24B4A', cursor: 'pointer', fontFamily: "'Poppins', sans-serif" },
  btnCancel: { padding: '7px 16px', borderRadius: '8px', border: '1px solid #D8DAD0', background: '#fff', fontSize: '12px', fontWeight: 600, color: '#4A5240', cursor: 'pointer', fontFamily: "'Poppins', sans-serif" },
  btnSave: { padding: '7px 16px', borderRadius: '8px', border: 'none', background: '#1F5330', fontSize: '12px', fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: "'Poppins', sans-serif" },
};

const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??';

export default function Patients({
  goToLogin, goToUpload, goToResults, goToAnalysis, goToExport, goToPatients, goToLibrary,
  crystalRecords,
  badges = {},
}) {
  const [patients, setPatients]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [searchTerm, setSearchTerm]     = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [hoveredRow, setHoveredRow]     = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [editForm, setEditForm]               = useState({});
  const [saving, setSaving]                   = useState(false);

  useEffect(() => { fetchPatients(); }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const data = await getPatients();
      setPatients(data);
    } catch (err) {
      console.error('Error fetching patients:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.patientId?.includes(searchTerm);
    const matchesStatus = filterStatus === 'All' || patient.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleOpenModal = (patient) => {
    setSelectedPatient(patient);
    setEditForm({
      name:    patient.name,
      age:     patient.age,
      sex:     patient.sex,
      dob:     patient.dob ? patient.dob.split('T')[0] : '',
      address: patient.address,
      status:  patient.status,
    });
  };

  const handleCloseModal = () => { setSelectedPatient(null); setEditForm({}); };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updatePatient(selectedPatient.patientId, editForm);
      setPatients(patients.map(p => p.patientId === selectedPatient.patientId ? { ...p, ...editForm } : p));
      handleCloseModal();
    } catch {
      alert('Error updating patient.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this patient record?')) {
      try {
        await deletePatient(selectedPatient.patientId);
        setPatients(patients.filter(p => p.patientId !== selectedPatient.patientId));
        handleCloseModal();
      } catch {
        alert('Error deleting patient.');
      }
    }
  };

  return (
    <div style={styles.app}>
      <Topbar goToLogin={goToLogin} />
      <div style={styles.body}>
        <Sidebar
          currentPage="patients"
          goToUpload={goToUpload}
          goToResults={() => goToResults()}
          goToAnalysis={goToAnalysis}
          goToExport={goToExport}
          goToPatients={goToPatients}
          goToLibrary={goToLibrary}
          badges={badges}
        />
        <div style={styles.main}>
          <div style={styles.pane}>
            <div style={styles.header}>
              <div style={styles.pageTitle}>Patient Directory</div>
              <button style={styles.btnAdd}>+ Add Patient</button>
            </div>
            <div style={styles.filterBar}>
              <input
                type="text"
                placeholder="Search by name or patient ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
              />
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={styles.filterSelect}>
                <option>All</option>
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>

            {loading ? (
              <div style={styles.loadingWrap}>Loading patients...</div>
            ) : filteredPatients.length > 0 ? (
              <div style={styles.tableContainer}>
                <div style={styles.statsBar}>
                  <div style={styles.statItem}><span style={styles.statLabel}>Total:</span><span style={styles.statValue}>{filteredPatients.length}</span></div>
                  <div style={styles.statItem}><span style={styles.statLabel}>Active:</span><span style={styles.statValue}>{filteredPatients.filter(p => p.status === 'Active').length}</span></div>
                  <div style={styles.statItem}><span style={styles.statLabel}>Inactive:</span><span style={styles.statValue}>{filteredPatients.filter(p => p.status === 'Inactive').length}</span></div>
                </div>
                <div style={styles.tableHead}>
                  <div style={styles.th}>Patient ID</div>
                  <div style={styles.th}>Full Name</div>
                  <div style={styles.th}>Age</div>
                  <div style={styles.th}>Gender</div>
                  <div style={styles.th}>Date of Birth</div>
                  <div style={styles.th}>Status</div>
                  <div style={styles.th}>Actions</div>
                </div>
                <div style={styles.tableBody}>
                  {filteredPatients.map((patient) => (
                    <div
                      key={patient._id}
                      style={{ ...styles.tr, ...(hoveredRow === patient._id ? styles.trHover : {}) }}
                      onMouseEnter={() => setHoveredRow(patient._id)}
                      onMouseLeave={() => setHoveredRow(null)}
                    >
                      <div style={styles.td}><span style={{ fontWeight: 600, color: '#1F5330' }}>{patient.patientId}</span></div>
                      <div style={styles.td}>{patient.name}</div>
                      <div style={styles.td}>{patient.age}</div>
                      <div style={styles.td}>{patient.sex}</div>
                      <div style={styles.td}>
                        <span style={styles.tdMuted}>
                          {patient.dob ? new Date(patient.dob).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                        </span>
                      </div>
                      <div style={styles.td}>
                        <span style={{ ...styles.badge, ...(patient.status === 'Active' ? styles.badgeActive : styles.badgeInactive) }}>
                          {patient.status}
                        </span>
                      </div>
                      <div style={styles.td}>
                        <div style={styles.actionBtns}>
                          <button onClick={() => handleOpenModal(patient)} style={{ ...styles.btnSmall, ...styles.btnEdit }}>✎ Edit</button>
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

      {selectedPatient && (
        <div style={styles.overlay} onClick={handleCloseModal}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.mHead}>
              <div style={styles.mAvatar}>{getInitials(selectedPatient.name)}</div>
              <div>
                <div style={styles.mName}>{selectedPatient.name}</div>
                <div style={styles.mId}>{selectedPatient.patientId}</div>
              </div>
              <div style={styles.mBadge}>{editForm.status}</div>
            </div>
            <div style={styles.mBody}>
              <div style={styles.mGrid}>
                <div style={styles.mFieldFull}>
                  <label style={styles.mLabel}>Full Name</label>
                  <input style={styles.mInput} value={editForm.name || ''} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                </div>
                <div style={styles.mField}>
                  <label style={styles.mLabel}>Age</label>
                  <input style={styles.mInput} type="number" value={editForm.age || ''} onChange={(e) => setEditForm({ ...editForm, age: e.target.value })} />
                </div>
                <div style={styles.mField}>
                  <label style={styles.mLabel}>Sex</label>
                  <select style={styles.mInput} value={editForm.sex || ''} onChange={(e) => setEditForm({ ...editForm, sex: e.target.value })}>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
                <div style={styles.mField}>
                  <label style={styles.mLabel}>Date of Birth</label>
                  <input style={styles.mInput} type="date" value={editForm.dob || ''} onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })} />
                </div>
                <div style={styles.mField}>
                  <label style={styles.mLabel}>Patient ID</label>
                  <input style={styles.mInputReadOnly} value={selectedPatient.patientId} readOnly />
                </div>
                <div style={styles.mFieldFull}>
                  <label style={styles.mLabel}>Address</label>
                  <input style={styles.mInput} value={editForm.address || ''} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} />
                </div>
              </div>
              <div style={styles.mDivider} />
              <div style={styles.mStatusRow}>
                <div style={styles.mStatusLabel}>Patient Status</div>
                <div style={styles.mToggle}>
                  <button
                    onClick={() => setEditForm({ ...editForm, status: 'Active' })}
                    style={{ ...styles.btnSmall, ...(editForm.status === 'Active' ? { background: '#E8F5E8', borderColor: '#1FB505', color: '#1FB505' } : { color: '#A4AAA4' }) }}
                  >Active</button>
                  <button
                    onClick={() => setEditForm({ ...editForm, status: 'Inactive' })}
                    style={{ ...styles.btnSmall, ...(editForm.status === 'Inactive' ? { background: '#FFF0ED', borderColor: '#E24B4A', color: '#E24B4A' } : { color: '#A4AAA4' }) }}
                  >Inactive</button>
                </div>
              </div>
            </div>
            <div style={styles.mFoot}>
              <button onClick={handleDelete} style={styles.btnDel}>🗑 Delete Patient</button>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={handleCloseModal} style={styles.btnCancel}>Cancel</button>
                <button onClick={handleSave} style={styles.btnSave} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}