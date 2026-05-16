import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { getPatients, createPatient, updatePatient, deletePatient } from './api';
import './index.css';

const styles = {
  app: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '100vh',
    background: '#EEF0E8',
    overflow: 'hidden',
  },

  body: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: '210px 1fr',
    minHeight: 0,
    overflow: 'hidden',
  },

  main: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
    overflow: 'hidden',
    background: '#EEF0E8',
  },

  pane: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: '20px 28px',
    gap: '14px',
    minHeight: 0,
    overflowY: 'auto',
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },

  pageTitle: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#141514',
    fontFamily: "'Poppins', sans-serif",
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
    fontFamily: "'Poppins', sans-serif",
  },

  filterBar: {
    display: 'flex',
    gap: '12px',
    marginBottom: '4px',
    alignItems: 'center',
  },

  searchInput: {
    flex: 1,
    padding: '8px 14px',
    border: '1px solid #D8DAD0',
    borderRadius: '8px',
    fontSize: '12px',
    fontFamily: "'Poppins', sans-serif",
    background: '#fff',
    color: '#141514',
    outline: 'none',
  },

  filterSelect: {
    padding: '8px 12px',
    border: '1px solid #D8DAD0',
    borderRadius: '8px',
    fontSize: '12px',
    fontFamily: "'Poppins', sans-serif",
    background: '#fff',
    color: '#141514',
    outline: 'none',
    cursor: 'pointer',
  },

  tableContainer: {
    flex: 1,
    background: '#fff',
    border: '1px solid #D8DAD0',
    borderRadius: '14px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
  },

  tableHead: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr 0.8fr 1fr 1.2fr 1fr 1.2fr',
    background: '#1F5330',
    flexShrink: 0,
  },

  th: {
    padding: '12px 16px',
    fontSize: '11px',
    fontWeight: 700,
    color: '#9FC8A8',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    fontFamily: "'Poppins', sans-serif",
  },

  tableBody: {
    flex: 1,
    overflow: 'hidden',
    overflowY: 'auto',
  },

  tr: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr 0.8fr 1fr 1.2fr 1fr 1.2fr',
    borderBottom: '1px solid #EEEFE8',
    alignItems: 'center',
    transition: 'background 0.12s',
  },

  trHover: {
    background: '#F5F6F0',
  },

  td: {
    padding: '12px 16px',
    fontSize: '12px',
    color: '#141514',
    fontFamily: "'Poppins', sans-serif",
  },

  tdMuted: {
    color: '#A4AAA4',
    fontSize: '11px',
  },

  badge: {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: '12px',
    fontSize: '10px',
    fontWeight: 600,
    fontFamily: "'Poppins', sans-serif",
  },

  badgeActive: {
    background: '#E8F5E8',
    color: '#1FB505',
  },

  badgeInactive: {
    background: '#F5F5F5',
    color: '#A4AAA4',
  },

  actionBtns: {
    display: 'flex',
    gap: '6px',
    alignItems: 'center',
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
    transition: 'all 0.12s',
  },

  btnEdit: {
    color: '#1F5330',
    borderColor: '#B8E0AF',
  },

  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '300px',
    color: '#A4AAA4',
    fontFamily: "'Poppins', sans-serif",
  },

  emptyIcon: {
    fontSize: '48px',
    marginBottom: '12px',
  },

  emptyText: {
    fontSize: '14px',
    fontWeight: 500,
  },

  statsBar: {
    display: 'flex',
    gap: '20px',
    padding: '10px 16px',
    background: '#F5F6F0',
    borderBottom: '1px solid #D8DAD0',
    fontSize: '12px',
    fontFamily: "'Poppins', sans-serif",
  },

  statItem: {
    display: 'flex',
    gap: '6px',
    alignItems: 'center',
  },

  statLabel: {
    color: '#A4AAA4',
    fontWeight: 500,
  },

  statValue: {
    color: '#141514',
    fontWeight: 700,
  },

  loadingWrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    color: '#A4AAA4',
    fontFamily: "'Poppins', sans-serif",
    fontSize: '14px',
  },

  // ── Shared overlay ──────────────────────────────────────
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(8, 18, 10, 0.62)',
    backdropFilter: 'blur(6px)',
    WebkitBackdropFilter: 'blur(6px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
  },

  // ── Add Patient modal ───────────────────────────────────
  addModal: {
    width: '560px',
    maxWidth: '94vw',
    maxHeight: '90vh',
    background: '#F8F9F5',
    borderRadius: '18px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 28px 72px rgba(0,0,0,0.32)',
    fontFamily: "'Poppins', sans-serif",
  },

  // ── Edit Patient modal ──────────────────────────────────
  editModal: {
    width: '560px',
    maxWidth: '94vw',
    maxHeight: '90vh',
    background: '#F8F9F5',
    borderRadius: '18px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 28px 72px rgba(0,0,0,0.32)',
    fontFamily: "'Poppins', sans-serif",
  },

  // ── Shared modal header ─────────────────────────────────
  modalHeader: {
    background: '#1F5330',
    padding: '14px 18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
  },

  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },

  headerIcon: {
    width: '30px',
    height: '30px',
    borderRadius: '8px',
    background: 'rgba(255,255,255,0.14)',
    border: '1px solid rgba(255,255,255,0.18)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  modalTitle: {
    fontSize: '14px',
    fontWeight: 800,
    color: '#fff',
  },

  modalSub: {
    fontSize: '10px',
    color: 'rgba(255,255,255,0.62)',
    marginTop: '1px',
  },

  windowControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
  },

  windowClose: {
    width: '27px',
    height: '27px',
    borderRadius: '7px',
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(226,75,74,0.55)',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 700,
    lineHeight: '27px',
    textAlign: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Modal body ──────────────────────────────────────────
  modalBody: {
    flex: 1,
    overflowY: 'auto',
    padding: '22px 24px',
    background: '#F8F9F5',
  },

  sectionTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '10px',
    fontWeight: 800,
    color: '#7A847A',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    marginBottom: '16px',
  },

  sectionNumber: {
    color: '#1F5330',
  },

  formGridThree: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 0.5fr',
    gap: '12px',
    marginBottom: '14px',
  },

  formGridTwo: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginBottom: '14px',
  },

  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },

  formGroupFull: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
    marginBottom: '4px',
  },

  formLabel: {
    fontSize: '10px',
    fontWeight: 700,
    color: '#7A847A',
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
  },

  formInput: {
    height: '38px',
    padding: '0 12px',
    border: '1px solid #D8DAD0',
    borderRadius: '8px',
    fontSize: '12px',
    color: '#141514',
    background: '#fff',
    outline: 'none',
    fontFamily: "'Poppins', sans-serif",
    boxSizing: 'border-box',
    width: '100%',
  },

  formInputReadOnly: {
    height: '38px',
    padding: '0 12px',
    border: '1px solid #D8DAD0',
    borderRadius: '8px',
    fontSize: '12px',
    color: '#1F5330',
    fontWeight: 700,
    background: '#EEF0E8',
    outline: 'none',
    fontFamily: "'Poppins', sans-serif",
    boxSizing: 'border-box',
    width: '100%',
  },

  // ── Modal footer ────────────────────────────────────────
  modalFooter: {
    padding: '14px 24px',
    borderTop: '1px solid #E3E5DC',
    background: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
  },

  footerHint: {
    fontSize: '11px',
    color: '#B36B00',
    fontWeight: 600,
    fontFamily: "'Poppins', sans-serif",
  },

  footerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },

  btnCancel: {
    padding: '9px 18px',
    borderRadius: '8px',
    border: '1px solid #D8DAD0',
    background: '#fff',
    fontSize: '12px',
    fontWeight: 600,
    color: '#4A5240',
    cursor: 'pointer',
    fontFamily: "'Poppins', sans-serif",
  },

  btnPrimary: {
    padding: '9px 20px',
    borderRadius: '8px',
    border: 'none',
    background: '#1F5330',
    color: '#fff',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: "'Poppins', sans-serif",
  },

  btnDel: {
    padding: '9px 14px',
    borderRadius: '8px',
    border: '1px solid #F5C9C9',
    background: '#fff',
    fontSize: '11px',
    fontWeight: 600,
    color: '#E24B4A',
    cursor: 'pointer',
    fontFamily: "'Poppins', sans-serif",
  },
};

const calculateAge = (dob) => {
  if (!dob) return '';
  const birthDate = new Date(dob);
  const today = new Date();
  if (Number.isNaN(birthDate.getTime())) return '';
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= 0 ? age : '';
};

const buildFullName = ({ surname, firstName, middleInitial }) => {
  const mi = middleInitial?.trim()
    ? `${middleInitial.trim().replace('.', '')}.`
    : '';
  return [firstName?.trim(), mi, surname?.trim()].filter(Boolean).join(' ');
};

const splitNameFallback = (name = '') => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return { firstName: '', middleInitial: '', surname: '' };
  if (parts.length === 1) return { firstName: parts[0], middleInitial: '', surname: '' };
  if (parts.length === 2) return { firstName: parts[0], middleInitial: '', surname: parts[1] };
  return { firstName: parts[0], middleInitial: parts[1]?.replace('.', '') || '', surname: parts.slice(2).join(' ') };
};

const emptyAddForm = {
  surname: '',
  firstName: '',
  middleInitial: '',
  age: '',
  sex: '',
  dob: '',
  address: '',
  contactNumber: '',
  status: 'Active',
};

export default function Patients({
  goToLogin,
  goToUpload,
  goToResults,
  goToAnalysis,
  goToExport,
  goToPatients,
  goToLibrary,
  crystalRecords,
  badges = {},
}) {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [hoveredRow, setHoveredRow] = useState(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState(emptyAddForm);
  const [adding, setAdding] = useState(false);

  const [selectedPatient, setSelectedPatient] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const data = await getPatients();
      setPatients(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching patients:', err);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter((patient) => {
    const name = patient.name || '';
    const patientId = patient.patientId || '';
    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patientId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || patient.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleOpenAddModal = () => {
    setAddForm(emptyAddForm);
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
    setAddForm(emptyAddForm);
  };

  const handleAddDobChange = (dob) => {
    setAddForm((prev) => ({ ...prev, dob, age: calculateAge(dob) }));
  };

  const handleEditDobChange = (dob) => {
    setEditForm((prev) => ({ ...prev, dob, age: calculateAge(dob) }));
  };

  const handleAddPatient = async () => {
    if (!addForm.surname.trim()) return alert('Please enter the surname.');
    if (!addForm.firstName.trim()) return alert('Please enter the first name.');
    if (!addForm.dob) return alert('Please enter the date of birth.');
    if (!addForm.sex) return alert('Please select sex.');
    if (!addForm.address.trim()) return alert('Please enter the address.');
    if (!addForm.contactNumber.trim()) return alert('Please enter the contact number.');

    const fullName = buildFullName(addForm);
    const generatedAge = calculateAge(addForm.dob);
    setAdding(true);

    try {
      const payload = {
  patientId: `PT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
  surname: addForm.surname.trim(),
  firstName: addForm.firstName.trim(),
  middleInitial: addForm.middleInitial.trim(),
  name: fullName,
  age: generatedAge,
  sex: addForm.sex,
  dob: addForm.dob,
  address: addForm.address.trim(),
  contactNumber: addForm.contactNumber.trim(),
  contact: addForm.contactNumber.trim(),
  status: addForm.status,
};

      const newPatient = await createPatient(payload);

      if (newPatient && (newPatient.patientId || newPatient._id)) {
        setPatients((prev) => [newPatient, ...prev]);
      } else {
        await fetchPatients();
      }

      handleCloseAddModal();
    }  catch (err) {
  console.error('Error adding patient:', err);
  alert(`Error: ${err?.message || JSON.stringify(err)}`);
} finally {
      setAdding(false);
    }
  };

  const handleOpenModal = (patient) => {
    const fallback = splitNameFallback(patient.name || '');
    setSelectedPatient(patient);
    setEditForm({
      surname: patient.surname || fallback.surname || '',
      firstName: patient.firstName || fallback.firstName || '',
      middleInitial: patient.middleInitial || fallback.middleInitial || '',
      name: patient.name || '',
      age: patient.age || '',
      sex: patient.sex || '',
      dob: patient.dob ? patient.dob.split('T')[0] : '',
      address: patient.address || '',
      contactNumber: patient.contactNumber || patient.contact || '',
      status: patient.status || 'Active',
    });
  };

  const handleCloseModal = () => {
    setSelectedPatient(null);
    setEditForm({});
  };

  const handleSave = async () => {
    if (!selectedPatient) return;
    if (!editForm.firstName?.trim() || !editForm.surname?.trim()) {
      return alert('Please complete the patient name.');
    }

    const fullName = buildFullName(editForm);
    setSaving(true);

    try {
      const payload = {
        ...editForm,
        name: fullName,
        age: calculateAge(editForm.dob) || editForm.age,
        contact: editForm.contactNumber,
      };

      await updatePatient(selectedPatient.patientId, payload);

      setPatients((prev) =>
        prev.map((p) => (p.patientId === selectedPatient.patientId ? { ...p, ...payload } : p))
      );

      handleCloseModal();
    } catch (err) {
      console.error('Error updating patient:', err);
      alert('Error updating patient.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPatient) return;
    if (window.confirm('Are you sure you want to delete this patient record?')) {
      try {
        await deletePatient(selectedPatient.patientId);
        setPatients((prev) => prev.filter((p) => p.patientId !== selectedPatient.patientId));
        handleCloseModal();
      } catch (err) {
        console.error('Error deleting patient:', err);
        alert('Error deleting patient.');
      }
    }
  };

  const isAddFormIncomplete =
    !addForm.surname ||
    !addForm.firstName ||
    !addForm.dob ||
    !addForm.sex ||
    !addForm.address ||
    !addForm.contactNumber;

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
              <button style={styles.btnAdd} onClick={handleOpenAddModal}>
                + Add Patient
              </button>
            </div>

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

            {loading ? (
              <div style={styles.loadingWrap}>Loading patients...</div>
            ) : filteredPatients.length > 0 ? (
              <div style={styles.tableContainer}>
                <div style={styles.statsBar}>
                  <div style={styles.statItem}>
                    <span style={styles.statLabel}>Total:</span>
                    <span style={styles.statValue}>{filteredPatients.length}</span>
                  </div>
                  <div style={styles.statItem}>
                    <span style={styles.statLabel}>Active:</span>
                    <span style={styles.statValue}>
                      {filteredPatients.filter((p) => p.status === 'Active').length}
                    </span>
                  </div>
                  <div style={styles.statItem}>
                    <span style={styles.statLabel}>Inactive:</span>
                    <span style={styles.statValue}>
                      {filteredPatients.filter((p) => p.status === 'Inactive').length}
                    </span>
                  </div>
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
                      key={patient._id || patient.patientId}
                      style={{
                        ...styles.tr,
                        ...(hoveredRow === (patient._id || patient.patientId) ? styles.trHover : {}),
                      }}
                      onMouseEnter={() => setHoveredRow(patient._id || patient.patientId)}
                      onMouseLeave={() => setHoveredRow(null)}
                    >
                      <div style={styles.td}>
                        <span style={{ fontWeight: 600, color: '#1F5330' }}>
                          {patient.patientId || 'Pending'}
                        </span>
                      </div>
                      <div style={styles.td}>{patient.name || '—'}</div>
                      <div style={styles.td}>{patient.age || '—'}</div>
                      <div style={styles.td}>{patient.sex || '—'}</div>
                      <div style={styles.td}>
                        <span style={styles.tdMuted}>
                          {patient.dob
                            ? new Date(patient.dob).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })
                            : '—'}
                        </span>
                      </div>
                      <div style={styles.td}>
                        <span
                          style={{
                            ...styles.badge,
                            ...(patient.status === 'Active' ? styles.badgeActive : styles.badgeInactive),
                          }}
                        >
                          {patient.status || 'Active'}
                        </span>
                      </div>
                      <div style={styles.td}>
                        <div style={styles.actionBtns}>
                          <button
                            onClick={() => handleOpenModal(patient)}
                            style={{ ...styles.btnSmall, ...styles.btnEdit }}
                          >
                            ✎ Edit
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

      {/* ── Add Patient Modal ───────────────────────────────── */}
      {isAddModalOpen && (
        <div style={styles.overlay} onClick={handleCloseAddModal}>
          <div style={styles.addModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={styles.headerLeft}>
                <div style={styles.headerIcon}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                    stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14" /><path d="M5 12h14" />
                  </svg>
                </div>
                <div>
                  <div style={styles.modalTitle}>New Patient</div>
                  <div style={styles.modalSub}>Create a new patient record</div>
                </div>
              </div>
              <div style={styles.windowControls}>
                <button type="button" onClick={handleCloseAddModal} style={styles.windowClose}>×</button>
              </div>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.sectionTitle}>
                <span style={styles.sectionNumber}>01</span>
                PATIENT DETAILS
              </div>

              <div style={styles.formGridThree}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Surname</label>
                  <input
                    style={styles.formInput}
                    value={addForm.surname}
                    onChange={(e) => setAddForm({ ...addForm, surname: e.target.value })}
                    placeholder="Dela Cruz"
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>First Name</label>
                  <input
                    style={styles.formInput}
                    value={addForm.firstName}
                    onChange={(e) => setAddForm({ ...addForm, firstName: e.target.value })}
                    placeholder="Juan"
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>M.I.</label>
                  <input
                    style={styles.formInput}
                    value={addForm.middleInitial}
                    maxLength={2}
                    onChange={(e) => setAddForm({ ...addForm, middleInitial: e.target.value })}
                    placeholder="S"
                  />
                </div>
              </div>

              <div style={styles.formGridTwo}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Date of Birth</label>
                  <input
                    type="date"
                    style={styles.formInput}
                    value={addForm.dob}
                    onChange={(e) => handleAddDobChange(e.target.value)}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Age</label>
                  <input
                    style={styles.formInputReadOnly}
                    value={addForm.age}
                    placeholder="Auto-generated"
                    readOnly
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Sex</label>
                  <select
                    style={styles.formInput}
                    value={addForm.sex}
                    onChange={(e) => setAddForm({ ...addForm, sex: e.target.value })}
                  >
                    <option value="">Select sex</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Contact Number</label>
                  <input
                    style={styles.formInput}
                    value={addForm.contactNumber}
                    onChange={(e) => setAddForm({ ...addForm, contactNumber: e.target.value })}
                    placeholder="09XXXXXXXXX"
                  />
                </div>
              </div>

              <div style={styles.formGroupFull}>
                <label style={styles.formLabel}>Address</label>
                <input
                  style={styles.formInput}
                  value={addForm.address}
                  onChange={(e) => setAddForm({ ...addForm, address: e.target.value })}
                  placeholder="Street address"
                />
              </div>
            </div>

            <div style={styles.modalFooter}>
              <div style={styles.footerHint}>
                {isAddFormIncomplete ? '⚠ Fill in all required fields' : ''}
              </div>
              <div style={styles.footerActions}>
                <button type="button" onClick={handleCloseAddModal} style={styles.btnCancel}>
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddPatient}
                  disabled={adding}
                  style={{ ...styles.btnPrimary, opacity: adding ? 0.7 : 1, cursor: adding ? 'not-allowed' : 'pointer' }}
                >
                  {adding ? 'Adding...' : '+ Add Patient'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Patient Modal ──────────────────────────────── */}
      {selectedPatient && (
        <div style={styles.overlay} onClick={handleCloseModal}>
          <div style={styles.editModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={styles.headerLeft}>
                <div style={styles.headerIcon}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                    stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                  </svg>
                </div>
                <div>
                  <div style={styles.modalTitle}>Edit Patient</div>
                  <div style={styles.modalSub}>{selectedPatient.patientId || 'Patient record'}</div>
                </div>
              </div>
              <div style={styles.windowControls}>
                <button type="button" onClick={handleCloseModal} style={styles.windowClose}>×</button>
              </div>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.sectionTitle}>
                <span style={styles.sectionNumber}>01</span>
                PATIENT DETAILS
              </div>

              <div style={styles.formGridThree}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Surname</label>
                  <input
                    style={styles.formInput}
                    value={editForm.surname || ''}
                    onChange={(e) => setEditForm({ ...editForm, surname: e.target.value })}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>First Name</label>
                  <input
                    style={styles.formInput}
                    value={editForm.firstName || ''}
                    onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>M.I.</label>
                  <input
                    style={styles.formInput}
                    value={editForm.middleInitial || ''}
                    maxLength={2}
                    onChange={(e) => setEditForm({ ...editForm, middleInitial: e.target.value })}
                  />
                </div>
              </div>

              <div style={styles.formGridTwo}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Date of Birth</label>
                  <input
                    type="date"
                    style={styles.formInput}
                    value={editForm.dob || ''}
                    onChange={(e) => handleEditDobChange(e.target.value)}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Age</label>
                  <input style={styles.formInputReadOnly} value={editForm.age || ''} readOnly />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Sex</label>
                  <select
                    style={styles.formInput}
                    value={editForm.sex || ''}
                    onChange={(e) => setEditForm({ ...editForm, sex: e.target.value })}
                  >
                    <option value="">Select sex</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Status</label>
                  <select
                    style={styles.formInput}
                    value={editForm.status || 'Active'}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Contact Number</label>
                  <input
                    style={styles.formInput}
                    value={editForm.contactNumber || ''}
                    onChange={(e) => setEditForm({ ...editForm, contactNumber: e.target.value })}
                    placeholder="09XXXXXXXXX"
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Patient ID</label>
                  <input
                    style={styles.formInputReadOnly}
                    value={selectedPatient.patientId || ''}
                    readOnly
                  />
                </div>
              </div>

              <div style={styles.formGroupFull}>
                <label style={styles.formLabel}>Address</label>
                <input
                  style={styles.formInput}
                  value={editForm.address || ''}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                />
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button onClick={handleDelete} style={styles.btnDel}>
                🗑 Delete Patient
              </button>
              <div style={styles.footerActions}>
                <button onClick={handleCloseModal} style={styles.btnCancel}>
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{ ...styles.btnPrimary, opacity: saving ? 0.7 : 1, cursor: saving ? 'not-allowed' : 'pointer' }}
                >
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