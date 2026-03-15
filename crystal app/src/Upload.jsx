import React, { useState, useRef } from 'react';
import Sidebar from './Sidebar';

export default function Upload({ goToResults, goToAnalysis, goToExport, goToLogin }) {
  const [patientName, setPatientName] = useState('');
  const [patientId, setPatientId]     = useState(null);
  const [showForm, setShowForm]       = useState(true);
  const [uploadedImage, setUploadedImage] = useState(null);
  const fileInputRef = useRef(null);

  const handleAddPatient = () => {
    if (!patientName.trim()) { alert('Please enter patient name'); return; }
    const yr  = new Date().getFullYear();
    const seq = String(Math.floor(Math.random() * 900) + 100);
    setPatientId(`PT-${yr}-${seq}`);
    setShowForm(false);
  };

  const handleReset = () => { setPatientName(''); setPatientId(null); setShowForm(true); };

  const handleFileChange = (e) => { const f = e.target.files[0]; if (f) setUploadedImage(f); };
  const handleDropzoneClick = () => fileInputRef.current.click();
  const handleDrop = (e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) setUploadedImage(f); };
  const handleDragOver = (e) => e.preventDefault();
  const handleRemoveImage = () => { setUploadedImage(null); fileInputRef.current.value = ''; };

  return (
    <div style={styles.app}>
      <div style={styles.topbar}>
        <div style={styles.logoMark}>🔬</div>
        <div style={styles.appTitle}>Crystal Analysis Pro</div>
        <div style={styles.appSub}>Automated Urinary Crystal Identification</div>
        <div style={styles.topbarRight}>
          <div style={styles.statusChip}>
            <div style={styles.statusDot}></div>
            System Ready
          </div>
          <button onClick={goToLogin} className="btn-logout">Logout</button>
        </div>
      </div>

      <div style={styles.body}>
        <Sidebar currentPage="upload" goToUpload={() => {}} goToResults={goToResults} goToAnalysis={goToAnalysis} goToExport={goToExport} />

        <div style={styles.main}>
          <div style={styles.pane}>
            {/* Patient Card */}
            <div style={styles.patientCard}>
              <div style={styles.cardTitle}>
                <span>Patient details</span>
                <button onClick={handleAddPatient} className="btn-small">+ Add patient</button>
              </div>
              {showForm ? (
                <div style={styles.patientGrid}>
                  <div style={styles.pfield}>
                    <label style={styles.pLabel}>Full name</label>
                    <input type="text" value={patientName} onChange={(e) => setPatientName(e.target.value)} placeholder="Juan dela Cruz" style={styles.pInput} />
                  </div>
                  <div style={styles.pfield}>
                    <label style={styles.pLabel}>Age</label>
                    <input type="number" placeholder="e.g. 42" style={styles.pInput} />
                  </div>
                  <div style={styles.pfield}>
                    <label style={styles.pLabel}>Sex</label>
                    <select style={styles.pInput}>
                      <option>Select sex</option>
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div style={styles.pidBanner}>
                  <span style={styles.pidCheck}>✓</span>
                  <span>Patient registered —</span>
                  <span style={styles.pidVal}>{patientId}</span>
                  <button onClick={handleReset} style={styles.pidEdit}>Edit ×</button>
                </div>
              )}
            </div>

            {/* Hidden file input */}
            <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.tiff,.tif,.bmp" style={{ display: 'none' }} onChange={handleFileChange} />

            {/* Dropzone */}
            {!uploadedImage ? (
              <div className="dropzone" onClick={handleDropzoneClick} onDrop={handleDrop} onDragOver={handleDragOver}>
                <div style={styles.dzRing}>📤</div>
                <div style={styles.dzTitle}>Drop image here or click to upload</div>
                <div style={styles.dzHint}>JPEG, PNG, TIFF, BMP · Max 100 MB</div>
                <div style={styles.dzTags}>
                  <span style={styles.dzTag}>JPEG</span>
                  <span style={styles.dzTag}>PNG</span>
                  <span style={styles.dzTag}>TIFF</span>
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
              {!uploadedImage && <span style={styles.uploadHint}>Please upload an image first</span>}
              <button
                onClick={uploadedImage ? goToResults : undefined}
                className="btn-solid"
                disabled={!uploadedImage}
              >
                🔍 Analyze image
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  app: { display: 'flex', flexDirection: 'column', width: '100%', height: '100vh', background: '#EEF0E8', overflow: 'hidden' },
  topbar: { flexShrink: 0, height: '56px', background: '#fff', borderBottom: '1.5px solid #D8DAD0', display: 'flex', alignItems: 'center', padding: '0 20px', gap: '10px' },
  logoMark: { fontSize: '24px' },
  appTitle: { fontSize: '15px', fontWeight: 700, color: '#141514' },
  appSub: { fontSize: '11px', color: '#A4AAA4', marginLeft: '8px' },
  topbarRight: { marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' },
  statusChip: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 500, color: '#306A33' },
  statusDot: { width: '8px', height: '8px', borderRadius: '50%', background: '#1FB505' },
  body: { flex: 1, display: 'grid', gridTemplateColumns: '210px 1fr', minHeight: 0, overflow: 'hidden' },
  main: { display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden', background: '#EEF0E8' },
  pane: { flex: 1, display: 'flex', flexDirection: 'column', padding: '20px 28px', gap: '14px', minHeight: 0, overflowY: 'auto' },
  patientCard: { background: '#fff', border: '1px solid #D8DAD0', borderRadius: '14px', padding: '16px 20px', flexShrink: 0 },
  cardTitle: { fontSize: '13px', fontWeight: 700, color: '#141514', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  patientGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px 20px', marginTop: '12px' },
  pfield: { display: 'flex', flexDirection: 'column', gap: '4px' },
  pLabel: { fontSize: '10px', fontWeight: 700, color: '#A4AAA4', textTransform: 'uppercase' },
  pInput: { padding: '7px 10px', border: '1px solid #D8DAD0', borderRadius: '8px', fontSize: '12px', color: '#141514', background: '#F5F6F0' },
  pidBanner: { display: 'flex', alignItems: 'center', gap: '10px', background: '#F2FBF0', border: '1.5px solid #B8E0AF', borderRadius: '9px', padding: '9px 14px', marginTop: '8px' },
  pidCheck: { fontSize: '14px', color: '#1FB505' },
  pidVal: { fontSize: '11px', fontWeight: 800, color: '#1F5330' },
  pidEdit: { marginLeft: 'auto', background: 'none', border: 'none', color: '#A4AAA4', cursor: 'pointer', fontSize: '10px' },
  dzRing: { fontSize: '32px' },
  dzTitle: { fontSize: '16px', fontWeight: 700, color: '#141514' },
  dzHint: { fontSize: '13px', color: '#A4AAA4' },
  dzTags: { display: 'flex', gap: '6px' },
  dzTag: { fontSize: '11px', fontWeight: 500, padding: '3px 10px', borderRadius: '100px', background: '#EEF3E8', color: '#306A33', border: '1px solid #B8C9A8' },
  uploadedBox: { flex: 1, minHeight: '80px', background: '#F2FBF0', border: '1.5px solid #B8E0AF', borderRadius: '16px', display: 'flex', alignItems: 'center', padding: '16px 20px', gap: '14px' },
  uploadedIcon: { fontSize: '28px' },
  uploadedInfo: { flex: 1 },
  uploadedName: { fontSize: '13px', fontWeight: 700, color: '#141514' },
  uploadedSize: { fontSize: '11px', color: '#1FB505', marginTop: '3px', fontWeight: 500 },
  recentLabel: { fontSize: '10px', fontWeight: 700, color: '#C9CAC0', textTransform: 'uppercase' },
  recentList: { flexShrink: 0, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' },
  rcard: { background: '#fff', border: '1px solid #D8DAD0', borderRadius: '12px', padding: '11px 14px', display: 'flex', alignItems: 'center', gap: '10px' },
  rdot: { width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0 },
  rinfo: { flex: 1, minWidth: 0 },
  rname: { fontSize: '12px', fontWeight: 600, color: '#141514' },
  rdate: { fontSize: '10px', color: '#A4AAA4', marginTop: '2px' },
  riskTag: { fontSize: '10px', fontWeight: 600, padding: '3px 8px', borderRadius: '100px', background: '#FFF0ED', color: '#A32D2D' },
  bbar: { flexShrink: 0, padding: '12px 28px', background: '#fff', borderTop: '1px solid #D8DAD0', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px' },
  uploadHint: { fontSize: '11px', color: '#C07320', fontWeight: 500 },
};