import React, { useState, useRef, useEffect } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { addPatient, uploadImage, analyzeImage, searchPatients } from './api';
import './index.css';

const styles = {
  app: { display: 'flex', flexDirection: 'column', width: '100%', height: '100vh', background: '#EEF0E8', overflow: 'hidden' },
  body: { flex: 1, display: 'grid', gridTemplateColumns: '210px 1fr', minHeight: 0, overflow: 'hidden' },
  main: { display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden', background: '#EEF0E8' },
  pane: { flex: 1, display: 'flex', flexDirection: 'column', padding: '20px 28px', gap: '14px', minHeight: 0, overflowY: 'auto' },
  patientCard: { background: '#fff', border: '1px solid #D8DAD0', borderRadius: '14px', padding: '16px 20px', flexShrink: 0 },
  cardTitle: { fontSize: '15px', fontWeight: 700, color: '#141514', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: "'Poppins', sans-serif" },
  patientGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px 20px', marginTop: '12px' },
  pfield: { display: 'flex', flexDirection: 'column', gap: '4px' },
  pLabel: { fontSize: '10px', fontWeight: 700, color: '#A4AAA4', textTransform: 'uppercase', fontFamily: "'Poppins', sans-serif" },
  pInput: { padding: '7px 10px', border: '1px solid #D8DAD0', borderRadius: '8px', fontSize: '12px', color: '#141514', background: '#F5F6F0', fontFamily: "'Poppins', sans-serif" },
  pidBanner: { display: 'flex', alignItems: 'center', gap: '10px', background: '#F2FBF0', border: '1.5px solid #B8E0AF', borderRadius: '9px', padding: '9px 14px', marginTop: '8px' },
  pidCheck: { fontSize: '14px', color: '#1FB505' },
  pidVal: { fontSize: '11px', fontWeight: 800, color: '#1F5330', fontFamily: "'Poppins', sans-serif" },
  pidEdit: { marginLeft: 'auto', background: 'none', border: 'none', color: '#A4AAA4', cursor: 'pointer', fontSize: '10px', fontFamily: "'Poppins', sans-serif" },
  dzRing: { fontSize: '32px' },
  dzTitle: { fontSize: '16px', fontWeight: 700, color: '#141514', fontFamily: "'Poppins', sans-serif" },
  dzHint: { fontSize: '13px', color: '#A4AAA4', fontFamily: "'Poppins', sans-serif" },
  dzTags: { display: 'flex', gap: '6px' },
  dzTag: { fontSize: '11px', fontWeight: 500, padding: '3px 10px', borderRadius: '100px', background: '#EEF3E8', color: '#306A33', border: '1px solid #B8C9A8', fontFamily: "'Poppins', sans-serif" },
  uploadedBox: { flex: 1, minHeight: '80px', background: '#F2FBF0', border: '1.5px solid #B8E0AF', borderRadius: '16px', display: 'flex', alignItems: 'center', padding: '16px 20px', gap: '14px' },
  uploadedIcon: { fontSize: '28px' },
  uploadedInfo: { flex: 1 },
  uploadedName: { fontSize: '13px', fontWeight: 700, color: '#141514', fontFamily: "'Poppins', sans-serif" },
  uploadedSize: { fontSize: '11px', color: '#1FB505', marginTop: '3px', fontWeight: 500, fontFamily: "'Poppins', sans-serif" },
  recentLabel: { fontSize: '10px', fontWeight: 700, color: '#C9CAC0', textTransform: 'uppercase', fontFamily: "'Poppins', sans-serif" },
  recentList: { flexShrink: 0, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' },
  rcard: { background: '#fff', border: '1px solid #D8DAD0', borderRadius: '12px', padding: '11px 14px', display: 'flex', alignItems: 'center', gap: '10px' },
  rdot: { width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0 },
  rinfo: { flex: 1, minWidth: 0 },
  rname: { fontSize: '12px', fontWeight: 600, color: '#141514', fontFamily: "'Poppins', sans-serif" },
  rdate: { fontSize: '10px', color: '#A4AAA4', marginTop: '2px', fontFamily: "'Poppins', sans-serif" },
  riskTag: { fontSize: '10px', fontWeight: 600, padding: '3px 8px', borderRadius: '10px', background: '#FFF0ED', color: '#A32D2D', fontFamily: "'Poppins', sans-serif" },
  bbar: { flexShrink: 0, position: 'sticky', bottom: 0, width: '100%', marginLeft: '-30px', marginRight: '-30px', marginBottom: '1px', padding: '16px 30px', background: '#fff', borderTop: '1px solid #D8DAD0', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' },
  uploadHint: { fontSize: '11px', color: '#C07320', fontWeight: 500, fontFamily: "'Poppins', sans-serif" },
  // Search styles
  searchWrapper: { position: 'relative' },
  searchInput: { width: '100%', padding: '8px 12px 8px 32px', border: '1px solid #D8DAD0', borderRadius: '8px', fontSize: '12px', color: '#141514', background: '#F5F6F0', fontFamily: "'Poppins', sans-serif", boxSizing: 'border-box' },
  searchIcon: { position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: '#A4AAA4', pointerEvents: 'none' },
  searchDropdown: { position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #D8DAD0', borderRadius: '10px', boxShadow: '0 4px 16px rgba(0,0,0,0.10)', zIndex: 100, marginTop: '4px', overflow: 'hidden' },
  searchItem: { padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #F0F1E8', display: 'flex', flexDirection: 'column', gap: '2px' },
  searchItemName: { fontSize: '12px', fontWeight: 700, color: '#141514', fontFamily: "'Poppins', sans-serif" },
  searchItemSub: { fontSize: '10px', color: '#A4AAA4', fontFamily: "'Poppins', sans-serif" },
  searchNoResult: { padding: '12px 14px', fontSize: '12px', color: '#A4AAA4', fontFamily: "'Poppins', sans-serif", textAlign: 'center' },
  tabRow: { display: 'flex', gap: '8px', marginBottom: '10px' },
  tab: { fontSize: '11px', fontWeight: 600, padding: '5px 14px', borderRadius: '20px', border: '1.5px solid #D8DAD0', background: 'transparent', cursor: 'pointer', fontFamily: "'Poppins', sans-serif", color: '#4A5240' },
  tabActive: { fontSize: '11px', fontWeight: 600, padding: '5px 14px', borderRadius: '20px', border: '1.5px solid #1FB505', background: '#F2FBF0', cursor: 'pointer', fontFamily: "'Poppins', sans-serif", color: '#1F5330' },
};

export default function Upload({
  goToResults, goToAnalysis, goToExport, goToPatients, goToLibrary, goToLogin,
  currentPatient, setCurrentPatient, clearCurrentPatient,
  badges = {},
}) {
  // Tab: 'new' = add new patient, 'search' = search existing
  const [tab, setTab] = useState(currentPatient ? 'confirmed' : 'new');

  // New patient form fields
  const [patientName, setPatientName]       = useState(currentPatient?.name    || '');
  const [patientDOB, setPatientDOB]         = useState(currentPatient?.dob     || '');
  const [patientAddress, setPatientAddress] = useState(currentPatient?.address || '');
  const [patientAge, setPatientAge]         = useState(currentPatient?.age     || '');
  const [patientSex, setPatientSex]         = useState(currentPatient?.sex     || '');
  const [patientId, setPatientId]           = useState(currentPatient?.patientId || null);

  // Search state
  const [searchQuery, setSearchQuery]       = useState('');
  const [searchResults, setSearchResults]   = useState([]);
  const [searchLoading, setSearchLoading]   = useState(false);
  const [showDropdown, setShowDropdown]     = useState(false);
  const searchRef = useRef(null);

  const [uploadedImage, setUploadedImage]   = useState(null);
  const [loading, setLoading]               = useState(false);
  const [analyzing, setAnalyzing]           = useState(false);
  const fileInputRef = useRef(null);

  // If currentPatient changes from outside (e.g. navigating back), sync fields
  useEffect(() => {
    if (currentPatient) {
      setPatientName(currentPatient.name    || '');
      setPatientDOB(currentPatient.dob      || '');
      setPatientAddress(currentPatient.address || '');
      setPatientAge(currentPatient.age      || '');
      setPatientSex(currentPatient.sex      || '');
      setPatientId(currentPatient.patientId || null);
      setTab('confirmed');
    }
  }, [currentPatient]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (searchRef.current && !searchRef.current.contains(e.target)) setShowDropdown(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); setShowDropdown(false); return; }
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const results = await searchPatients(searchQuery);
        setSearchResults(results);
        setShowDropdown(true);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectSearchResult = (patient) => {
    setPatientName(patient.name    || '');
    setPatientDOB(patient.dob      || '');
    setPatientAddress(patient.address || '');
    setPatientAge(patient.age      || '');
    setPatientSex(patient.sex      || '');
    setPatientId(patient.patientId);
    setCurrentPatient(patient);   // lift to App.js so it persists
    setSearchQuery('');
    setShowDropdown(false);
    setTab('confirmed');
  };

  const handleAddPatient = async () => {
    if (!patientName.trim()) { alert('Please enter patient name'); return; }
    const yr  = new Date().getFullYear();
    const seq = String(Math.floor(Math.random() * 900) + 100);
    const newPatientId = `PT-${yr}-${seq}`;
    setLoading(true);
    try {
      await addPatient({
        patientId: newPatientId,
        name:      patientName,
        age:       patientAge,
        sex:       patientSex,
        dob:       patientDOB,
        address:   patientAddress,
        status:    'Active',
      });
      setPatientId(newPatientId);
      // Lift patient up to App.js so it survives page changes
      setCurrentPatient({
        patientId: newPatientId,
        name:      patientName,
        age:       patientAge,
        sex:       patientSex,
        dob:       patientDOB,
        address:   patientAddress,
      });
      setTab('confirmed');
    } catch {
      alert('Error saving patient. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  // Full reset — clear everything including App-level patient
  const handleReset = () => {
    setPatientName('');
    setPatientId(null);
    setPatientDOB('');
    setPatientAddress('');
    setPatientAge('');
    setPatientSex('');
    setUploadedImage(null);
    setSearchQuery('');
    setTab('new');
    if (clearCurrentPatient) clearCurrentPatient();
  };

  const handleFileChange    = (e) => { const f = e.target.files[0]; if (f) setUploadedImage(f); };
  const handleDropzoneClick = () => { if (!patientId) return; fileInputRef.current.click(); };
  const handleDrop          = (e) => { e.preventDefault(); if (!patientId) return; const f = e.dataTransfer.files[0]; if (f) setUploadedImage(f); };
  const handleDragOver      = (e) => e.preventDefault();
  const handleRemoveImage   = () => { setUploadedImage(null); fileInputRef.current.value = ''; };

  const handleAnalyze = async () => {
    if (!uploadedImage) return;
    if (!patientId) { alert('Please add a patient first before analyzing.'); return; }
    setAnalyzing(true);
    try {
      const sampleId = `SMPL-${Date.now()}`;
      const formData = new FormData();
      formData.append('image', uploadedImage);
      formData.append('patientId', patientId);
      formData.append('sampleId', sampleId);
      await uploadImage(formData);

      const analysisResult = await analyzeImage(uploadedImage);
      if (!analysisResult.success) { alert('Error analyzing image: ' + analysisResult.error); return; }

      goToResults({
        patientId,
        patientName,
        sampleId,
        results:        analysisResult.summary,
        annotatedImage: analysisResult.annotatedImage,
      });

    } catch (err) {
      alert('Error. Make sure the model server is running on port 5001.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div style={styles.app}>
      <Topbar goToLogin={goToLogin} />
      <div style={styles.body}>
        <Sidebar
          currentPage="upload"
          goToUpload={() => {}}
          goToResults={goToResults}
          goToAnalysis={goToAnalysis}
          goToExport={goToExport}
          goToPatients={goToPatients}
          goToLibrary={goToLibrary}
          badges={badges}
        />
        <div style={styles.main}>
          <div style={styles.pane}>

            {/* Patient Card */}
            <div style={styles.patientCard}>
              <div style={styles.cardTitle}>
                <span>Patient Details</span>
                {/* Only show Add Patient button on new-patient tab */}
                {tab === 'new' && (
                  <button onClick={handleAddPatient} className="btn-small" disabled={loading}>
                    {loading ? 'Saving...' : '+ Add patient'}
                  </button>
                )}
                {/* When confirmed, show "New Analysis" to fully reset */}
                {tab === 'confirmed' && (
                  <button onClick={handleReset} className="btn-small" style={{ background: 'none', color: '#A4AAA4', border: '1px solid #D8DAD0' }}>
                    ✕ New Analysis
                  </button>
                )}
              </div>

              {/* Confirmed state — patient is locked in */}
              {tab === 'confirmed' ? (
                <div style={styles.pidBanner}>
                  <span style={styles.pidCheck}>✓</span>
                  <span style={{ fontSize: '12px', color: '#141514', fontFamily: "'Poppins', sans-serif" }}>{patientName}</span>
                  <span style={styles.pidVal}>{patientId}</span>
                  <button onClick={handleReset} style={styles.pidEdit}>Edit ×</button>
                </div>
              ) : (
                <>
                  {/* Tabs: New / Search */}
                  <div style={styles.tabRow}>
                    <button style={tab === 'new' ? styles.tabActive : styles.tab} onClick={() => setTab('new')}>+ New patient</button>
                    <button style={tab === 'search' ? styles.tabActive : styles.tab} onClick={() => setTab('search')}>🔍 Search existing</button>
                  </div>

                  {/* New patient form */}
                  {tab === 'new' && (
                    <div style={styles.patientGrid}>
                      <div style={styles.pfield}>
                        <label style={styles.pLabel}>Full name</label>
                        <input type="text" value={patientName} onChange={(e) => setPatientName(e.target.value)} placeholder="Juan dela Cruz" style={styles.pInput} />
                      </div>
                      <div style={styles.pfield}>
                        <label style={styles.pLabel}>Age</label>
                        <input type="number" value={patientAge} onChange={(e) => setPatientAge(e.target.value)} placeholder="e.g. 67" style={styles.pInput} />
                      </div>
                      <div style={styles.pfield}>
                        <label style={styles.pLabel}>Sex</label>
                        <select value={patientSex} onChange={(e) => setPatientSex(e.target.value)} style={styles.pInput}>
                          <option value="">Select sex</option>
                          <option>Male</option>
                          <option>Female</option>
                          <option>Other</option>
                        </select>
                      </div>
                      <div style={styles.pfield}>
                        <label style={styles.pLabel}>Date of Birth</label>
                        <input type="date" value={patientDOB} onChange={(e) => setPatientDOB(e.target.value)} style={styles.pInput} />
                      </div>
                      <div style={styles.pfield}>
                        <label style={styles.pLabel}>Address</label>
                        <input type="text" value={patientAddress} onChange={(e) => setPatientAddress(e.target.value)} placeholder="Street address" style={styles.pInput} />
                      </div>
                    </div>
                  )}

                  {/* Search existing patient */}
                  {tab === 'search' && (
                    <div ref={searchRef} style={styles.searchWrapper}>
                      <span style={styles.searchIcon}>🔍</span>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by name or Patient ID…"
                        style={styles.searchInput}
                        autoFocus
                      />
                      {showDropdown && (
                        <div style={styles.searchDropdown}>
                          {searchLoading && (
                            <div style={styles.searchNoResult}>Searching…</div>
                          )}
                          {!searchLoading && searchResults.length === 0 && (
                            <div style={styles.searchNoResult}>No patients found</div>
                          )}
                          {!searchLoading && searchResults.map((p) => (
                            <div
                              key={p.patientId}
                              style={styles.searchItem}
                              onClick={() => handleSelectSearchResult(p)}
                              onMouseEnter={(e) => e.currentTarget.style.background = '#F5F6F0'}
                              onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
                            >
                              <span style={styles.searchItemName}>{p.name}</span>
                              <span style={styles.searchItemSub}>{p.patientId} · {p.age ? `${p.age} yrs` : ''} · {p.sex || ''}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Hidden file input */}
            <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.tiff,.tif,.bmp" style={{ display: 'none' }} onChange={handleFileChange} />

            {/* Dropzone */}
            {!uploadedImage ? (
              <div
                className="dropzone"
                onClick={handleDropzoneClick}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                style={{ opacity: patientId ? 1 : 0.5, cursor: patientId ? 'pointer' : 'not-allowed' }}
              >
                <div style={styles.dzRing}>📤</div>
                <div style={styles.dzTitle}>
                  {patientId ? 'Drop image here or click to upload' : 'Add patient details first'}
                </div>
                <div style={styles.dzHint}>JPEG, PNG · Max 100 MB</div>
                <div style={styles.dzTags}>
                  <span style={styles.dzTag}>JPEG</span>
                  <span style={styles.dzTag}>PNG</span>
                </div>
              </div>
            ) : (
              <div style={styles.uploadedBox}>
                <div style={styles.uploadedIcon}>🖼️</div>
                <div style={styles.uploadedInfo}>
                  <div style={styles.uploadedName}>{uploadedImage.name}</div>
                  <div style={styles.uploadedSize}>{(uploadedImage.size / 1024).toFixed(1)} KB · Ready to analyze</div>
                </div>
                <button onClick={handleRemoveImage} className="btn-remove">✕ Remove</button>
              </div>
            )}

            {/* Recent Samples */}
            <div style={styles.recentLabel}>Recent samples</div>
            <div style={styles.recentList}>
              <div style={styles.rcard}>
                <div style={{ ...styles.rdot, background: '#E24B4A' }}></div>
                <div style={styles.rinfo}><div style={styles.rname}>Sample #2025-047</div><div style={styles.rdate}>Today · 09:14</div></div>
                <span style={styles.riskTag}>Moderate</span>
              </div>
              <div style={styles.rcard}>
                <div style={{ ...styles.rdot, background: '#1FB505' }}></div>
                <div style={styles.rinfo}><div style={styles.rname}>Sample #2025-046</div><div style={styles.rdate}>Yesterday · 14:52</div></div>
                <span style={styles.riskTag}>Low</span>
              </div>
            </div>

            {/* Button Bar */}
            <div style={styles.bbar}>
              {!patientId && <span style={styles.uploadHint}>Please add a patient first</span>}
              {patientId && !uploadedImage && <span style={styles.uploadHint}>Please upload an image first</span>}
              <button
                onClick={handleAnalyze}
                className="btn-solid"
                disabled={!uploadedImage || !patientId || analyzing}
              >
                {analyzing ? '⏳ Analyzing...' : '🔍 Analyze Image'}
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}