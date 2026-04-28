import React, { useState, useRef, useEffect, useCallback } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { addPatient, uploadImage, analyzeImage, searchPatients, getPatients, getAnalyses } from './api';
import './index.css';

// Inject keyframes once into <head>
const ANIM_STYLE = `
  @keyframes spin        { to { transform: rotate(360deg); } }
  @keyframes pulseRing   { 0%,100% { transform: scale(0.85); opacity: 0.5; } 50% { transform: scale(1.18); opacity: 0.12; } }
  @keyframes scanLine    { 0% { top: 6%; } 100% { top: 86%; } }
  @keyframes fadeInScale { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
  @keyframes dotBounce   { 0%,80%,100% { transform: translateY(0); opacity: 0.35; } 40% { transform: translateY(-7px); opacity: 1; } }
`;
function injectStyles() {
  if (document.getElementById('upload-anim')) return;
  const el = document.createElement('style');
  el.id = 'upload-anim';
  el.textContent = ANIM_STYLE;
  document.head.appendChild(el);
}

/**
 * Resizes any image File to exactly 704×704 (cover crop, centered)
 * and returns a new File object with the same name but as image/jpeg.
 */
function resizeTo704(file) {
  return new Promise((resolve, reject) => {
    const TARGET = 704;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);

      const canvas = document.createElement('canvas');
      canvas.width  = TARGET;
      canvas.height = TARGET;
      const ctx = canvas.getContext('2d');

      // Cover-crop: scale so the shorter side fills 704, center the longer side
      const scale = Math.max(TARGET / img.width, TARGET / img.height);
      const drawW = img.width  * scale;
      const drawH = img.height * scale;
      const offsetX = (TARGET - drawW) / 2;
      const offsetY = (TARGET - drawH) / 2;

      ctx.drawImage(img, offsetX, offsetY, drawW, drawH);

      canvas.toBlob(
        (blob) => {
          if (!blob) { reject(new Error('Canvas toBlob failed')); return; }
          const newName = file.name.replace(/\.[^.]+$/, '') + '_704x704.jpg';
          const resized = new File([blob], newName, { type: 'image/jpeg', lastModified: Date.now() });
          resolve(resized);
        },
        'image/jpeg',
        0.92
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')); };
    img.src = url;
  });
}

/**
 * Resizes a canvas snapshot (blob) to 704×704 and returns a File.
 */
function resizeBlobTo704(blob, filename) {
  return new Promise((resolve, reject) => {
    const TARGET = 704;
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      canvas.width = TARGET;
      canvas.height = TARGET;
      const ctx = canvas.getContext('2d');
      const scale = Math.max(TARGET / img.width, TARGET / img.height);
      const drawW = img.width * scale;
      const drawH = img.height * scale;
      const offsetX = (TARGET - drawW) / 2;
      const offsetY = (TARGET - drawH) / 2;
      ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
      canvas.toBlob(
        (resizedBlob) => {
          if (!resizedBlob) { reject(new Error('Canvas toBlob failed')); return; }
          const file = new File([resizedBlob], filename, { type: 'image/jpeg', lastModified: Date.now() });
          resolve(file);
        },
        'image/jpeg',
        0.92
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')); };
    img.src = url;
  });
}

export default function Upload({
  goToResults, goToAnalysis, goToExport, goToPatients, goToLibrary, goToLogin,
  currentPatient, setCurrentPatient, clearCurrentPatient,
  badges = {},
}) {
  injectStyles();

  const username = localStorage.getItem('username') || 'User';
  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const [totalPatients, setTotalPatients]   = useState(0);
  const [totalAnalyses, setTotalAnalyses]   = useState(0);
  const [topCrystal, setTopCrystal]         = useState(null);
  const [lastAnalysis, setLastAnalysis]     = useState(null);
  const [recentRecords, setRecentRecords]   = useState([]);
  const [recentPatients, setRecentPatients] = useState([]);
  const [statsLoading, setStatsLoading]     = useState(true);

  const [tab, setTab]                       = useState(currentPatient ? 'confirmed' : 'new');
  const [patientName, setPatientName]       = useState(currentPatient?.name      || '');
  const [patientDOB, setPatientDOB]         = useState(currentPatient?.dob       || '');
  const [patientAddress, setPatientAddress] = useState(currentPatient?.address   || '');
  const [patientAge, setPatientAge]         = useState(currentPatient?.age       || '');
  const [patientSex, setPatientSex]         = useState(currentPatient?.sex       || '');
  const [patientContact, setPatientContact] = useState(currentPatient?.contact   || '');
  const [patientId, setPatientId]           = useState(currentPatient?.patientId || null);
  const [searchQuery, setSearchQuery]       = useState('');
  const [searchResults, setSearchResults]   = useState([]);
  const [searchLoading, setSearchLoading]   = useState(false);
  const [showDropdown, setShowDropdown]     = useState(false);
  const [uploadedImage, setUploadedImage]   = useState(null);
  const [resizing, setResizing]             = useState(false);
  const [loading, setLoading]               = useState(false);
  const [analyzing, setAnalyzing]           = useState(false);
  const [analyzeStep, setAnalyzeStep]       = useState(0);
  const [showAnalysisForm, setShowAnalysisForm] = useState(false);
  const [minimized, setMinimized]           = useState(false);
  const [expanded, setExpanded]             = useState(false);

  // ── Camera state ─────────────────────────────────────────────────────────
  const [showCamera, setShowCamera]         = useState(false);
  const [cameraStream, setCameraStream]     = useState(null);
  const [cameraError, setCameraError]       = useState('');
  const [capturing, setCapturing]           = useState(false);
  const [facingMode, setFacingMode]         = useState('environment'); // 'environment' = back cam
  // ─────────────────────────────────────────────────────────────────────────

  const searchRef    = useRef(null);
  const fileInputRef = useRef(null);
  const videoRef     = useRef(null);   // ← camera video element
  const canvasRef    = useRef(null);   // ← hidden canvas for snapshot

  // ── Camera helpers ───────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    setCameraStream((stream) => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      return null;
    });
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [patients, analyses] = await Promise.all([getPatients(), getAnalyses()]);
        const pList = Array.isArray(patients) ? patients : [];
        const aList = Array.isArray(analyses) ? analyses : [];
        setTotalPatients(pList.length);
        setTotalAnalyses(aList.length);
        setRecentPatients(pList.slice(0, 3));
        setRecentRecords(aList.slice(0, 5));
        const typeCounts = aList.reduce((acc, a) => { acc[a.crystalType] = (acc[a.crystalType] || 0) + a.count; return acc; }, {});
        const top = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0];
        setTopCrystal(top ? top[0] : null);
        if (aList.length > 0) {
          const sorted = [...aList].sort((a, b) => new Date(b.date) - new Date(a.date));
          setLastAnalysis(sorted[0]);
        }
      } catch (err) { console.error(err); }
      finally { setStatsLoading(false); }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    if (currentPatient) {
      setPatientName(currentPatient.name      || '');
      setPatientDOB(currentPatient.dob        || '');
      setPatientAddress(currentPatient.address || '');
      setPatientAge(currentPatient.age        || '');
      setPatientSex(currentPatient.sex        || '');
      setPatientContact(currentPatient.contact || '');
      setPatientId(currentPatient.patientId   || null);
      setTab('confirmed');
      setShowAnalysisForm(true);
      setMinimized(false);
    }
  }, [currentPatient]);

  useEffect(() => {
    const handler = (e) => { if (searchRef.current && !searchRef.current.contains(e.target)) setShowDropdown(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); setShowDropdown(false); return; }
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try { const r = await searchPatients(searchQuery); setSearchResults(r); setShowDropdown(true); }
      catch { setSearchResults([]); }
      finally { setSearchLoading(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ── Attach camera stream to video element when stream is set ─────────────
  useEffect(() => {
    if (cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream, showCamera]);

  // ── Clean up camera stream on unmount ────────────────────────────────────
  useEffect(() => {
    return () => { stopCamera(); };
  }, [stopCamera]);
  // ─────────────────────────────────────────────────────────────────────────

  const handleSelectSearchResult = (patient) => {
    setPatientName(patient.name || ''); setPatientDOB(patient.dob || '');
    setPatientAddress(patient.address || ''); setPatientAge(patient.age || '');
    setPatientSex(patient.sex || ''); setPatientContact(patient.contact || '');
    setPatientId(patient.patientId); setCurrentPatient(patient);
    setSearchQuery(''); setShowDropdown(false); setTab('confirmed');
  };

  const handleAddPatient = async () => {
    if (!patientName.trim())    { alert('Please enter patient name'); return; }
    if (!patientDOB.trim())     { alert('Please enter date of birth'); return; }
    if (!patientAge)            { alert('Please enter age'); return; }
    if (!patientSex)            { alert('Please select sex'); return; }
    if (!patientAddress.trim()) { alert('Please enter address'); return; }
    if (!patientContact.trim()) { alert('Please enter contact number'); return; }
    const yr = new Date().getFullYear();
    const newPatientId = `PT-${yr}-${String(Math.floor(Math.random() * 900) + 100)}`;
    setLoading(true);
    try {
      await addPatient({ patientId: newPatientId, name: patientName, age: patientAge, sex: patientSex, dob: patientDOB, address: patientAddress, contact: patientContact, status: 'Active' });
      setPatientId(newPatientId);
      setCurrentPatient({ patientId: newPatientId, name: patientName, age: patientAge, sex: patientSex, dob: patientDOB, address: patientAddress, contact: patientContact });
      setTab('confirmed');
      setTotalPatients(p => p + 1);
    } catch { alert('Error saving patient. Make sure backend is running.'); }
    finally { setLoading(false); }
  };

  const handleReset = () => {
    stopCamera();
    setPatientName(''); setPatientId(null); setPatientDOB(''); setPatientAddress('');
    setPatientAge(''); setPatientSex(''); setPatientContact('');
    setUploadedImage(null); setSearchQuery(''); setTab('new');
    setShowAnalysisForm(false); setMinimized(false); setExpanded(false);
    setAnalyzing(false); setAnalyzeStep(0); setResizing(false);
    setShowCamera(false); setCameraError('');
    if (clearCurrentPatient) clearCurrentPatient();
  };

  const openModal = () => { setShowAnalysisForm(true); setMinimized(false); setExpanded(false); };

  // ── Core image handler: auto-resize to 704×704 ──────────────────────────
  const applyImageFile = async (file) => {
    if (!file) return;
    setResizing(true);
    try {
      const resized = await resizeTo704(file);
      setUploadedImage(resized);
    } catch (err) {
      console.error('Resize failed, using original:', err);
      setUploadedImage(file);
    } finally {
      setResizing(false);
    }
  };

  const handleFileChange    = (e) => { const f = e.target.files[0]; if (f) applyImageFile(f); };
  const handleDropzoneClick = () => { if (!patientId) return; fileInputRef.current.click(); };
  const handleDrop          = (e) => { e.preventDefault(); if (!patientId) return; const f = e.dataTransfer.files[0]; if (f) applyImageFile(f); };
  const handleDragOver      = (e) => e.preventDefault();
  const handleRemoveImage   = () => { setUploadedImage(null); if (fileInputRef.current) fileInputRef.current.value = ''; };

  // ── Camera helpers ───────────────────────────────────────────────────────
  const openCamera = async () => {
    if (!patientId) return;
    setCameraError('');
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 1280 } },
        audio: false,
      });
      setCameraStream(stream);
    } catch (err) {
      console.error('Camera error:', err);
      if (err.name === 'NotAllowedError') {
        setCameraError('Camera permission denied. Please allow camera access in your browser settings.');
      } else if (err.name === 'NotFoundError') {
        setCameraError('No camera found on this device.');
      } else {
        setCameraError('Could not access camera: ' + err.message);
      }
    }
  };

  const closeCamera = () => {
    stopCamera();
    setShowCamera(false);
    setCameraError('');
  };

  const switchCamera = async () => {
    stopCamera();
    const next = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(next);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: next, width: { ideal: 1280 }, height: { ideal: 1280 } },
        audio: false,
      });
      setCameraStream(stream);
    } catch (err) {
      setCameraError('Could not switch camera: ' + err.message);
    }
  };

  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setCapturing(true);
    try {
      const video  = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width  = video.videoWidth  || 1280;
      canvas.height = video.videoHeight || 1280;
      canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.92));
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename  = `capture_${timestamp}_704x704.jpg`;

      setResizing(true);
      const resizedFile = await resizeBlobTo704(blob, filename);
      setUploadedImage(resizedFile);
      closeCamera();
    } catch (err) {
      console.error('Capture error:', err);
      setCameraError('Failed to capture image. Please try again.');
    } finally {
      setCapturing(false);
      setResizing(false);
    }
  };
  // ─────────────────────────────────────────────────────────────────────────

  const handleAnalyze = async () => {
    if (!uploadedImage || !patientId) return;
    setAnalyzing(true);
    setAnalyzeStep(1);
    try {
      const sampleId = `SMPL-${Date.now()}`;
      const formData = new FormData();
      formData.append('image', uploadedImage);
      formData.append('patientId', patientId);
      formData.append('sampleId', sampleId);
      await uploadImage(formData);
      setAnalyzeStep(2);
      const analysisResult = await analyzeImage(uploadedImage);
      setAnalyzeStep(3);
      if (!analysisResult.success) { alert('Error analyzing image: ' + analysisResult.error); return; }
      await new Promise(r => setTimeout(r, 700));
      goToResults({
        patientId,
        patientName,
        sampleId,
        results:        analysisResult.summary,
        detections:     analysisResult.detections || [],
        annotatedImage: analysisResult.annotatedImage,
        rawImage:       URL.createObjectURL(uploadedImage),
      });
    } catch { alert('Error. Make sure the model server is running on port 5001.'); }
    finally { setAnalyzing(false); setAnalyzeStep(0); }
  };

  const CRYSTAL_COLORS = { 'CaOx Dihydrate': '#E24B4A', 'CaOx Monohydrate Ovoid': '#F5A623', 'Phosphate': '#6D9922', 'Calcium Oxalate': '#E24B4A', 'Uric Acid': '#1FB505', 'Struvite': '#6D9922', 'Ca Phosphate': '#6D7758' };
  const RISK_STYLE = { High: { bg: '#FFF0ED', color: '#A32D2D' }, Moderate: { bg: '#FFF8ED', color: '#C07320' }, Low: { bg: '#E8F5E8', color: '#1F5330' } };
  const getInitials = (name) => (name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const AVATAR_COLORS = ['#1F5330', '#306A33', '#4A7A50', '#2D6A4F'];
  const getAvatarColor = (name) => AVATAR_COLORS[(name || '').charCodeAt(0) % AVATAR_COLORS.length];

  const modalW = expanded ? 'min(92vw, 1100px)' : '660px';
  const modalH = expanded ? '90vh' : '640px';

  const STEP_LABELS = ['', 'Uploading image…', 'AI detecting particles…', 'Analysis complete!'];
  const STEP_PILLS  = [
    { label: 'Upload',   done: analyzeStep >= 2 },
    { label: 'Analyze',  done: analyzeStep >= 3 },
    { label: 'Complete', done: analyzeStep === 3 },
  ];

  return (
    <div style={s.app}>
      <Topbar goToLogin={goToLogin} />
      <div style={s.body}>
        <Sidebar currentPage="upload" goToUpload={() => {}} goToResults={goToResults} goToAnalysis={goToAnalysis} goToExport={goToExport} goToPatients={goToPatients} goToLibrary={goToLibrary} badges={badges} />

        <div style={s.main}>
          <div style={s.pane}>

            {/* Banner */}
            <div style={s.banner}>
              <div>
                <div style={s.bannerGreeting}>{greeting}, {username.charAt(0).toUpperCase() + username.slice(1)}!</div>
                <div style={s.bannerSub}>Here's a summary of your MagniTect workspace.</div>
              </div>
              <button onClick={openModal} style={s.bannerBtn}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                New Analysis
              </button>
            </div>

            {/* Stat cards */}
            <div style={s.statRow}>
              {[
                { label: 'TOTAL PATIENTS', value: statsLoading ? '—' : totalPatients, sub: `${statsLoading ? '—' : totalPatients} active`, accent: '#1F5330' },
                { label: 'TOTAL ANALYSES', value: statsLoading ? '—' : totalAnalyses, sub: 'crystal records saved', accent: '#4A7A9B' },
                { label: 'TOP CRYSTAL', value: statsLoading ? '—' : (topCrystal || '—'), sub: topCrystal ? 'most detected type' : 'No data yet', accent: '#888', isText: true },
                { label: 'LAST ANALYSIS', value: statsLoading ? '—' : (lastAnalysis ? new Date(lastAnalysis.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'), sub: lastAnalysis ? lastAnalysis.patientName : 'No analyses yet', accent: '#C07320', isText: true },
              ].map((card, i) => (
                <div key={i} style={s.statCard}>
                  <div style={{ ...s.statAccent, background: card.accent }} />
                  <div style={{ ...s.statValue, fontSize: card.isText ? '15px' : '32px', color: card.accent }}>{card.value}</div>
                  <div style={s.statLabel}>{card.label}</div>
                  <div style={s.statSub}>{card.sub}</div>
                </div>
              ))}
            </div>

            {/* Two col */}
            <div style={s.twoCol}>
              <div style={s.card}>
                <div style={s.cardHead}>
                  <span style={s.cardTitle}>Recent Crystal Records</span>
                  <button onClick={goToLibrary} style={s.viewAll}>View all →</button>
                </div>
                {recentRecords.length === 0 ? (
                  <div style={s.emptyBlock}>
                    <div style={{ fontSize: '36px', marginBottom: '8px' }}>🔬</div>
                    <div style={s.emptyText}>No analyses yet</div>
                    <button onClick={openModal} style={s.emptyBtn}>Run first analysis</button>
                  </div>
                ) : (
                  <div style={s.recordList}>
                    {recentRecords.map((r, i) => (
                      <div key={i} style={s.recordRow}>
                        <div style={{ ...s.recordDot, background: CRYSTAL_COLORS[r.crystalType] || '#888' }} />
                        <div style={s.recordInfo}>
                          <div style={s.recordName}>{r.crystalType}</div>
                          <div style={s.recordMeta}>{r.patientName} · {r.sampleId}</div>
                        </div>
                        <div style={{ ...s.riskTag, background: RISK_STYLE[r.risk]?.bg || '#E8F5E8', color: RISK_STYLE[r.risk]?.color || '#1F5330' }}>{r.risk}</div>
                        <div style={s.recordCount}>{r.count}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={s.card}>
                  <div style={s.cardHead}>
                    <span style={s.cardTitle}>Recent Patients</span>
                    <button onClick={goToPatients} style={s.viewAll}>View all →</button>
                  </div>
                  {recentPatients.length === 0 ? (
                    <div style={s.emptyBlock}>
                      <div style={{ fontSize: '32px', marginBottom: '8px' }}>👤</div>
                      <div style={s.emptyText}>No patients yet</div>
                      <button onClick={openModal} style={s.emptyBtn}>Add first patient</button>
                    </div>
                  ) : (
                    <div style={s.recordList}>
                      {recentPatients.map((p, i) => (
                        <div key={i} style={s.recordRow}>
                          <div style={{ ...s.avatar, background: getAvatarColor(p.name) }}>{getInitials(p.name)}</div>
                          <div style={s.recordInfo}>
                            <div style={s.recordName}>{p.name}</div>
                            <div style={s.recordMeta}>{p.patientId} · {p.age ? `${p.age} yrs` : ''} · {p.sex || ''}</div>
                          </div>
                          <div style={{ ...s.riskTag, background: p.status === 'Active' ? '#E8F5E8' : '#F5F5F5', color: p.status === 'Active' ? '#1F5330' : '#A4AAA4' }}>{p.status}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div style={s.card}>
                  <div style={s.cardHead}><span style={s.cardTitle}>Quick Actions</span></div>
                  <div style={s.quickGrid}>
                    {[
                      {
                        label: 'New Analysis',
                        icon: (
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="17 8 12 3 7 8"/>
                            <line x1="12" y1="3" x2="12" y2="15"/>
                          </svg>
                        ),
                        onClick: openModal
                      },
                      {
                        label: 'Patients',
                        icon: (
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                            <circle cx="9" cy="7" r="4"/>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                          </svg>
                        ),
                        onClick: goToPatients
                      },
                      {
                        label: 'Library',
                        icon: (
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="3"/>
                            <path d="M11 2a9 9 0 1 0 0 18A9 9 0 0 0 11 2z"/>
                            <path d="M2 2l4 4"/>
                            <path d="M22 22l-4-4"/>
                            <line x1="8" y1="11" x2="2" y2="11"/>
                            <line x1="22" y1="11" x2="14" y2="11"/>
                          </svg>
                        ),
                        onClick: goToLibrary
                      },
                      {
                        label: 'Reports',
                        icon: (
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                            <line x1="16" y1="13" x2="8" y2="13"/>
                            <line x1="16" y1="17" x2="8" y2="17"/>
                            <polyline points="10 9 9 9 8 9"/>
                          </svg>
                        ),
                        onClick: goToExport
                      },
                    ].map((a, i) => (
                      <button key={i} onClick={a.onClick} style={s.quickBtn}>
                        <span style={{ fontSize: '18px' }}>{a.icon}</span>
                        <span style={s.quickLabel}>{a.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Minimized pill */}
      {showAnalysisForm && minimized && (
        <div style={s.minimizedPill} onClick={() => setMinimized(false)}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>New Analysis</span>
          {patientId && <span style={s.pillBadge}>{patientName.split(' ')[0]}</span>}
          {uploadedImage && <span style={s.pillBadge2}>📎 Image ready</span>}
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)', marginLeft: '2px' }}>· Tap to restore</span>
          <button style={s.pillClose} onClick={(e) => { e.stopPropagation(); handleReset(); }}>✕</button>
        </div>
      )}

      {/* ── Centered Modal ── */}
      {showAnalysisForm && !minimized && (
        <div style={s.overlay} onClick={(e) => { if (e.target === e.currentTarget && !analyzing) setMinimized(true); }}>
          <div style={{ ...s.modal, width: modalW, maxHeight: modalH, transition: 'width 0.25s cubic-bezier(.4,0,.2,1), max-height 0.25s cubic-bezier(.4,0,.2,1)' }}>

            {/* ANALYZING OVERLAY */}
            {analyzing && (
              <div style={s.analyzingOverlay}>
                {uploadedImage && (
                  <img src={URL.createObjectURL(uploadedImage)} alt="" style={s.analyzingBgImg} />
                )}
                <div style={s.analyzingContent}>
                  <div style={s.pulseWrapper}>
                    <div style={s.pulseRingOuter} />
                    <div style={s.pulseRingInner} />
                    <div style={s.pulseIconCircle}>
                      {analyzeStep === 3
                        ? <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#1F5330" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        : <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1F5330" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="3.5"/>
                            <path d="M11 2a9 9 0 1 0 0 18A9 9 0 0 0 11 2z" opacity="0.4"/>
                            <line x1="7.5" y1="11" x2="2" y2="11"/><line x1="22" y1="11" x2="14.5" y2="11"/>
                            <line x1="11" y1="7.5" x2="11" y2="2"/><line x1="11" y1="22" x2="11" y2="14.5"/>
                          </svg>
                      }
                    </div>
                  </div>
                  <div style={s.analyzingLabel}>{STEP_LABELS[analyzeStep] || 'Processing…'}</div>
                  {analyzeStep < 3 && (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {[0, 1, 2].map(i => (
                        <div key={i} style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#1F5330', animation: `dotBounce 1.1s ease-in-out ${i * 0.18}s infinite` }} />
                      ))}
                    </div>
                  )}
                  <div style={s.scanBox}>
                    <div style={s.scanGrid}>
                      {Array.from({ length: 9 }).map((_, i) => (
                        <div key={i} style={{ background: `rgba(31,83,48,${0.04 + (i % 3) * 0.025})`, borderRadius: '3px' }} />
                      ))}
                    </div>
                    {analyzeStep < 3 && <div style={s.scanLine} />}
                    {analyzeStep === 3 && (
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(31,83,48,0.08)', borderRadius: '8px' }}>
                        <span style={{ fontSize: '22px' }}> </span>
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '7px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    {STEP_PILLS.map((st) => (
                      <div key={st.label} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 13px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: st.done ? '#1F5330' : 'rgba(31,83,48,0.07)', color: st.done ? '#fff' : '#8C9A8C', border: `1px solid ${st.done ? '#1F5330' : '#D8DAD0'}`, transition: 'all 0.35s ease' }}>
                        {st.done && <span style={{ fontSize: '9px' }}>✓</span>}
                        {st.label}
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: '11px', color: '#A4AAA4', marginTop: '2px' }}>
                    {analyzeStep === 3 ? 'Redirecting to results…' : 'Please wait while the AI processes the sample…'}
                  </div>
                </div>
              </div>
            )}

            {/* Modal titlebar */}
            <div style={s.modalHead}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={s.modalHeadIcon}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                </div>
                <span style={s.modalTitle}>New Analysis</span>
                {patientId && (
                  <span style={s.patientChip}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#1FB505', display: 'inline-block' }} />
                    {patientName}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button style={s.winBtn} title="Minimize" onClick={() => !analyzing && setMinimized(true)}>
                  <svg width="10" height="2" viewBox="0 0 10 2"><rect width="10" height="2" rx="1" fill="rgba(255,255,255,0.85)"/></svg>
                </button>
                <button style={s.winBtn} title={expanded ? 'Restore size' : 'Expand'} onClick={() => !analyzing && setExpanded(e => !e)}>
                  {expanded
                    ? <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><rect x="2.5" y="0.5" width="7" height="7" rx="1" stroke="rgba(255,255,255,0.85)" strokeWidth="1.3"/><rect x="0.5" y="2.5" width="7" height="7" rx="1" fill="#1F5330" stroke="rgba(255,255,255,0.85)" strokeWidth="1.3"/></svg>
                    : <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><rect x="0.65" y="0.65" width="8.7" height="8.7" rx="1" stroke="rgba(255,255,255,0.85)" strokeWidth="1.3"/></svg>
                  }
                </button>
                <button style={{ ...s.winBtn, background: 'rgba(226,75,74,0.35)', borderColor: 'rgba(226,75,74,0.5)' }} title="Close" onClick={handleReset}>
                  <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1 1l7 7M8 1l-7 7" stroke="rgba(255,255,255,0.9)" strokeWidth="1.6" strokeLinecap="round"/></svg>
                </button>
              </div>
            </div>

            {/* Step progress */}
            <div style={s.progressBar}>
              {[
                { num: '1', label: 'Patient', done: !!patientId,     active: !patientId },
                { num: '2', label: 'Image',   done: !!uploadedImage, active: !!patientId && !uploadedImage },
                { num: '3', label: 'Analyze', done: false,           active: !!patientId && !!uploadedImage },
              ].map((step, i) => (
                <React.Fragment key={step.label}>
                  {i > 0 && <div style={{ flex: 1, height: '2px', background: step.done || (i === 1 && patientId) ? '#1FB505' : '#E0E2D8', margin: '0 6px', marginBottom: '14px' }} />}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: step.done ? '#1FB505' : step.active ? '#1F5330' : '#E0E2D8', color: step.done || step.active ? '#fff' : '#A4AAA4', fontSize: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {step.done ? '✓' : step.num}
                    </div>
                    <span style={{ fontSize: '10px', fontWeight: 600, color: step.done ? '#1FB505' : step.active ? '#1F5330' : '#A4AAA4' }}>{step.label}</span>
                  </div>
                </React.Fragment>
              ))}
            </div>

            {/* Body */}
            <div style={{ ...s.modalBody, flexDirection: expanded ? 'row' : 'column', gap: expanded ? '0' : '20px' }}>

              {/* Patient column */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', padding: expanded ? '0 20px 0 0' : '0' }}>
                <div style={s.sectionLabel}><span style={s.sectionNum}>01</span> Patient Details</div>
                {tab === 'confirmed' ? (
                  <div style={s.confirmedBanner}>
                    <div style={{ ...s.avatar, background: getAvatarColor(patientName), width: '36px', height: '36px', fontSize: '13px' }}>{getInitials(patientName)}</div>
                    <div style={{ flex: 1 }}>
                      <div style={s.recordName}>{patientName}</div>
                      <div style={s.recordMeta}>{patientId} · {patientAge ? `${patientAge} yrs` : ''} · {patientSex}</div>
                    </div>
                    <span style={{ color: '#1FB505', fontSize: '15px' }}>✓</span>
                    <button onClick={() => { setTab('new'); setPatientId(null); }} style={s.editBtn}>Edit</button>
                  </div>
                ) : (
                  <>
                    <div style={s.tabRow}>
                      <button style={tab === 'new' ? s.tabActive : s.tab} onClick={() => setTab('new')}>New Patient</button>
                      <button style={tab === 'search' ? s.tabActive : s.tab} onClick={() => setTab('search')}>Search Existing</button>
                    </div>
                    {tab === 'new' && (
                      <>
                        <div style={{ ...s.formGrid, gridTemplateColumns: expanded ? '1fr 1fr 1fr' : '1fr 1fr' }}>
                          <div style={s.field}><label style={s.fieldLabel}>Full Name</label><input type="text" value={patientName} onChange={e => setPatientName(e.target.value)} placeholder="Juan dela Cruz" style={s.fieldInput} /></div>
                          <div style={s.field}><label style={s.fieldLabel}>Age</label><input type="number" value={patientAge} onChange={e => setPatientAge(e.target.value)} placeholder="e.g. 45" style={s.fieldInput} /></div>
                          <div style={s.field}><label style={s.fieldLabel}>Sex</label><select value={patientSex} onChange={e => setPatientSex(e.target.value)} style={s.fieldInput}><option value="">Select sex</option><option>Male</option><option>Female</option><option>Other</option></select></div>
                          <div style={s.field}><label style={s.fieldLabel}>Date of Birth</label><input type="date" value={patientDOB} onChange={e => { const dob = e.target.value; setPatientDOB(dob); if (dob) { const t = new Date(); const b = new Date(dob); let a = t.getFullYear() - b.getFullYear(); if (t.getMonth() - b.getMonth() < 0 || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) a--; setPatientAge(a); } }} style={s.fieldInput} /></div>
                          <div style={{ ...s.field, gridColumn: expanded ? 'auto' : '1 / -1' }}><label style={s.fieldLabel}>Address</label><input type="text" value={patientAddress} onChange={e => setPatientAddress(e.target.value)} placeholder="Street address" style={s.fieldInput} /></div>
                          <div style={{ ...s.field, gridColumn: expanded ? 'auto' : '1 / -1' }}><label style={s.fieldLabel}>Contact Number</label><input type="tel" value={patientContact} onChange={e => setPatientContact(e.target.value)} placeholder="09XXXXXXXXX" style={s.fieldInput} /></div>
                        </div>
                        <button onClick={handleAddPatient} style={s.addBtn} disabled={loading}>{loading ? 'Saving...' : '+ Add Patient'}</button>
                      </>
                    )}
                    {tab === 'search' && (
                      <div ref={searchRef} style={{ position: 'relative' }}>
                        <div style={s.searchBox}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#A4AAA4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search by name or Patient ID…" style={s.searchInput} autoFocus />
                        </div>
                        {showDropdown && (
                          <div style={s.dropdown}>
                            {searchLoading && <div style={s.dropItem}>Searching…</div>}
                            {!searchLoading && searchResults.length === 0 && <div style={s.dropItem}>No patients found</div>}
                            {!searchLoading && searchResults.map(p => (
                              <div key={p.patientId} style={s.dropResult} onClick={() => handleSelectSearchResult(p)} onMouseEnter={e => e.currentTarget.style.background = '#F5F6F0'} onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                                <div style={s.recordName}>{p.name}</div>
                                <div style={s.recordMeta}>{p.patientId} · {p.age ? `${p.age} yrs` : ''} · {p.sex || ''}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              {expanded && <div style={{ width: '1px', background: '#E8EAE0', flexShrink: 0, margin: '0 4px' }} />}

              {/* Image upload column */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', padding: expanded ? '0 0 0 20px' : '0' }}>
                <div style={s.sectionLabel}><span style={s.sectionNum}>02</span> Upload Image</div>
                {/* Hidden file input & canvas */}
                <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.tiff,.tif,.bmp" style={{ display: 'none' }} onChange={handleFileChange} />
                <canvas ref={canvasRef} style={{ display: 'none' }} />

                {/* ── Resizing spinner ── */}
                {resizing ? (
                  <div style={{ ...s.dropzone, flex: expanded ? 1 : 'unset', cursor: 'default', gap: '12px' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1F5330" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 0.8s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#1F5330' }}>Resizing to 704 × 704…</div>
                    <div style={{ fontSize: '10px', color: '#A4AAA4' }}>Optimizing image for the detection model</div>
                  </div>

                ) : !uploadedImage ? (
                  /* ── Dropzone with Upload + Camera buttons ── */
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    style={{ ...s.dropzone, opacity: patientId ? 1 : 0.5, flex: expanded ? 1 : 'unset', cursor: 'default' }}
                  >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={patientId ? '#1F5330' : '#C9CAC0'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: patientId ? '#141514' : '#C9CAC0' }}>
                      {patientId ? 'Drop image here or choose an option below' : 'Add patient first'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#A4AAA4' }}>Auto-resized to 704 × 704 · JPEG, PNG · Max 10 MB</div>

                    {/* Two action buttons */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                      {/* Upload from file */}
                      <button
                        onClick={handleDropzoneClick}
                        disabled={!patientId}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '6px',
                          padding: '8px 16px', borderRadius: '8px', border: '1.5px solid #D8DAD0',
                          background: '#fff', fontSize: '12px', fontWeight: 600, color: '#1F5330',
                          cursor: patientId ? 'pointer' : 'not-allowed', fontFamily: "'Poppins', sans-serif",
                          opacity: patientId ? 1 : 0.5,
                        }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                        </svg>
                        Browse File
                      </button>

                      {/* Open Camera */}
                      <button
                        onClick={openCamera}
                        disabled={!patientId}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '6px',
                          padding: '8px 16px', borderRadius: '8px', border: '1.5px solid #1F5330',
                          background: '#1F5330', fontSize: '12px', fontWeight: 600, color: '#fff',
                          cursor: patientId ? 'pointer' : 'not-allowed', fontFamily: "'Poppins', sans-serif",
                          opacity: patientId ? 1 : 0.5,
                        }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                          <circle cx="12" cy="13" r="4"/>
                        </svg>
                        Use Camera
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
                      {['JPEG','PNG','TIFF'].map(t => <span key={t} style={s.dzTag}>{t}</span>)}
                    </div>
                  </div>

                ) : (
                  /* ── Uploaded image banner ── */
                  <div style={s.uploadedBox}>
                    <div style={s.fileIconWrap}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1F5330" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#141514' }}>{uploadedImage.name}</div>
                      <div style={{ fontSize: '11px', color: '#1FB505', marginTop: '2px' }}>
                        {(uploadedImage.size / 1024).toFixed(1)} KB · 704 × 704 · Ready to analyze
                      </div>
                    </div>
                    <button onClick={handleRemoveImage} style={{ ...s.editBtn, color: '#E24B4A' }}>✕ Remove</button>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div style={s.modalFoot}>
              {!patientId && <span style={s.hint}>⚠ Add a patient first</span>}
              {patientId && !uploadedImage && !resizing && <span style={s.hint}>⚠ Upload an image to continue</span>}
              {resizing && <span style={{ ...s.hint, color: '#1F5330' }}> Resizing image…</span>}
              <div style={{ flex: 1 }} />
              <button onClick={handleReset} style={s.cancelBtn} disabled={analyzing || resizing}>Cancel</button>
              <button
                onClick={handleAnalyze}
                style={{ ...s.analyzeBtn, display: 'flex', alignItems: 'center', gap: '7px', opacity: (!uploadedImage || !patientId || analyzing || resizing) ? 0.55 : 1, cursor: (!uploadedImage || !patientId || analyzing || resizing) ? 'not-allowed' : 'pointer' }}
                disabled={!uploadedImage || !patientId || analyzing || resizing}
              >
                {analyzing
                  ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 0.8s linear infinite', flexShrink: 0 }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                  : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                }
                {analyzing ? 'Analyzing…' : 'Analyze Image'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          CAMERA MODAL
      ══════════════════════════════════════════════════════════════════ */}
      {showCamera && (
        <div style={s.cameraOverlay}>
          <div style={s.cameraModal}>

            {/* Camera header */}
            <div style={s.cameraHead}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>Capture Image</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {/* Switch camera button */}
                {cameraStream && (
                  <button onClick={switchCamera} title="Switch camera" style={s.camCtrlBtn}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 7h-9"/><path d="M14 17H5"/><polyline points="17 4 20 7 17 10"/><polyline points="8 14 5 17 8 20"/>
                    </svg>
                  </button>
                )}
                <button onClick={closeCamera} style={{ ...s.camCtrlBtn, background: 'rgba(226,75,74,0.35)', borderColor: 'rgba(226,75,74,0.5)' }}>
                  <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1 1l7 7M8 1l-7 7" stroke="rgba(255,255,255,0.9)" strokeWidth="1.6" strokeLinecap="round"/></svg>
                </button>
              </div>
            </div>

            {/* Camera body */}
            <div style={s.cameraBody}>
              {cameraError ? (
                /* Error state */
                <div style={s.cameraError}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#E24B4A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#A32D2D', textAlign: 'center', maxWidth: '280px' }}>{cameraError}</div>
                  <button onClick={closeCamera} style={s.addBtn}>Close</button>
                </div>
              ) : !cameraStream ? (
                /* Loading state */
                <div style={s.cameraError}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1F5330" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 0.8s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                  <div style={{ fontSize: '12px', color: '#A4AAA4' }}>Starting camera…</div>
                </div>
              ) : (
                /* Live video */
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={s.cameraVideo}
                />
              )}

              {/* Corner guides overlay */}
              {cameraStream && !cameraError && (
                <div style={s.cameraGuide}>
                  {/* top-left */}
                  <div style={{ position: 'absolute', top: 16, left: 16, width: 28, height: 28, borderTop: '2.5px solid rgba(255,255,255,0.8)', borderLeft: '2.5px solid rgba(255,255,255,0.8)', borderRadius: '3px 0 0 0' }} />
                  {/* top-right */}
                  <div style={{ position: 'absolute', top: 16, right: 16, width: 28, height: 28, borderTop: '2.5px solid rgba(255,255,255,0.8)', borderRight: '2.5px solid rgba(255,255,255,0.8)', borderRadius: '0 3px 0 0' }} />
                  {/* bottom-left */}
                  <div style={{ position: 'absolute', bottom: 16, left: 16, width: 28, height: 28, borderBottom: '2.5px solid rgba(255,255,255,0.8)', borderLeft: '2.5px solid rgba(255,255,255,0.8)', borderRadius: '0 0 0 3px' }} />
                  {/* bottom-right */}
                  <div style={{ position: 'absolute', bottom: 16, right: 16, width: 28, height: 28, borderBottom: '2.5px solid rgba(255,255,255,0.8)', borderRight: '2.5px solid rgba(255,255,255,0.8)', borderRadius: '0 0 3px 0' }} />
                </div>
              )}
            </div>

            {/* Camera footer */}
            <div style={s.cameraFoot}>
              <div style={{ fontSize: '11px', color: '#A4AAA4' }}>
                {cameraStream ? 'Position sample in frame, then capture' : ''}
              </div>
              <div style={{ flex: 1 }} />
              <button onClick={closeCamera} style={s.cancelBtn}>Cancel</button>
              <button
                onClick={handleCapture}
                disabled={!cameraStream || capturing || !!cameraError}
                style={{
                  ...s.analyzeBtn,
                  display: 'flex', alignItems: 'center', gap: '7px',
                  opacity: (!cameraStream || capturing || !!cameraError) ? 0.55 : 1,
                  cursor: (!cameraStream || capturing || !!cameraError) ? 'not-allowed' : 'pointer',
                }}
              >
                {capturing
                  ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 0.8s linear infinite', flexShrink: 0 }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                  : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <circle cx="12" cy="12" r="10"/>
                      <circle cx="12" cy="12" r="4"/>
                    </svg>
                }
                {capturing ? 'Capturing…' : 'Capture'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

const s = {
  app:   { display: 'flex', flexDirection: 'column', width: '100%', height: '100vh', background: '#EEF0E8', overflow: 'hidden', fontFamily: "'Poppins', sans-serif" },
  body:  { flex: 1, display: 'grid', gridTemplateColumns: '210px 1fr', minHeight: 0, overflow: 'hidden' },
  main:  { display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden', background: '#EEF0E8' },
  pane:  { flex: 1, display: 'flex', flexDirection: 'column', padding: '20px 24px', gap: '14px', minHeight: 0, overflowY: 'auto' },

  banner:         { background: '#1F5330', borderRadius: '14px', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 },
  bannerGreeting: { fontSize: '20px', fontWeight: 700, color: '#fff', marginBottom: '4px' },
  bannerSub:      { fontSize: '12px', color: 'rgba(255,255,255,0.65)' },
  bannerBtn:      { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.3)', borderRadius: '10px', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Poppins', sans-serif" },

  statRow:    { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', flexShrink: 0 },
  statCard:   { background: '#fff', border: '1px solid #D8DAD0', borderRadius: '12px', padding: '16px 18px', position: 'relative', overflow: 'hidden' },
  statAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: '3px' },
  statValue:  { fontWeight: 800, marginBottom: '4px', fontFamily: "'Poppins', sans-serif" },
  statLabel:  { fontSize: '10px', fontWeight: 700, color: '#A4AAA4', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' },
  statSub:    { fontSize: '11px', color: '#A4AAA4' },

  twoCol:    { display: 'grid', gridTemplateColumns: '1fr 380px', gap: '14px', flex: 1, minHeight: 0 },
  card:      { background: '#fff', border: '1px solid #D8DAD0', borderRadius: '14px', padding: '16px 18px', display: 'flex', flexDirection: 'column' },
  cardHead:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' },
  cardTitle: { fontSize: '14px', fontWeight: 700, color: '#141514' },
  viewAll:   { fontSize: '12px', color: '#1F5330', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Poppins', sans-serif" },

  recordList:  { display: 'flex', flexDirection: 'column', gap: '2px' },
  recordRow:   { display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '1px solid #F0F1E8' },
  recordDot:   { width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0 },
  recordInfo:  { flex: 1, minWidth: 0 },
  recordName:  { fontSize: '12px', fontWeight: 700, color: '#141514' },
  recordMeta:  { fontSize: '10px', color: '#A4AAA4', marginTop: '1px' },
  riskTag:     { fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '10px' },
  recordCount: { fontSize: '13px', fontWeight: 800, color: '#1F5330' },
  avatar:      { width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#fff', flexShrink: 0 },

  emptyBlock: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '32px', gap: '8px' },
  emptyText:  { fontSize: '13px', color: '#A4AAA4', fontWeight: 500 },
  emptyBtn:   { marginTop: '8px', padding: '8px 18px', background: '#1F5330', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Poppins', sans-serif" },

  quickGrid:  { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' },
  quickBtn:   { display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', background: '#F5F6F0', border: '1px solid #E8EAE0', borderRadius: '10px', cursor: 'pointer', fontFamily: "'Poppins', sans-serif" },
  quickLabel: { fontSize: '12px', fontWeight: 600, color: '#141514' },

  overlay: { position: 'fixed', inset: 0, background: 'rgba(8,18,10,0.58)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modal:   { background: '#fff', borderRadius: '16px', boxShadow: '0 28px 72px rgba(0,0,0,0.24), 0 4px 20px rgba(0,0,0,0.10)', display: 'flex', flexDirection: 'column', overflow: 'hidden', maxWidth: '95vw', position: 'relative' },

  analyzingOverlay: { position: 'absolute', inset: 0, zIndex: 20, background: 'rgba(243,245,238,0.97)', backdropFilter: 'blur(10px)', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', animation: 'fadeInScale 0.28s ease' },
  analyzingBgImg:   { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.07, borderRadius: '16px', filter: 'blur(14px) saturate(0.4)', pointerEvents: 'none' },
  analyzingContent: { position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '0 40px' },
  pulseWrapper:     { position: 'relative', width: '84px', height: '84px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  pulseRingOuter:   { position: 'absolute', inset: '-4px', borderRadius: '50%', border: '2.5px solid rgba(31,83,48,0.3)', animation: 'pulseRing 1.7s ease-in-out infinite' },
  pulseRingInner:   { position: 'absolute', inset: '10px', borderRadius: '50%', border: '2px solid rgba(31,83,48,0.2)', animation: 'pulseRing 1.7s ease-in-out 0.45s infinite' },
  pulseIconCircle:  { width: '60px', height: '60px', borderRadius: '50%', background: '#fff', border: '2px solid #D8DAD0', boxShadow: '0 4px 18px rgba(31,83,48,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  analyzingLabel:   { fontSize: '17px', fontWeight: 700, color: '#141514', letterSpacing: '-0.3px', textAlign: 'center' },
  scanBox:  { width: '188px', height: '96px', borderRadius: '10px', border: '1.5px solid #D8DAD0', background: '#fff', position: 'relative', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  scanGrid: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gridTemplateRows: 'repeat(3,1fr)', gap: '3px', padding: '6px', height: '100%', boxSizing: 'border-box' },
  scanLine: { position: 'absolute', left: '4px', right: '4px', height: '2px', background: 'linear-gradient(90deg, transparent 0%, #1F5330 40%, #6D9922 60%, transparent 100%)', boxShadow: '0 0 10px rgba(31,83,48,0.7)', animation: 'scanLine 1.5s ease-in-out infinite alternate', top: '6%' },

  modalHead:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 18px', background: '#1F5330', flexShrink: 0 },
  modalHeadIcon: { width: '26px', height: '26px', borderRadius: '6px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modalTitle:    { fontSize: '14px', fontWeight: 700, color: '#fff' },
  patientChip:   { display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '20px', padding: '3px 10px', fontSize: '11px', fontWeight: 600, color: '#fff' },
  winBtn:        { width: '26px', height: '26px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },

  progressBar: { display: 'flex', alignItems: 'center', padding: '12px 24px', borderBottom: '1px solid #ECEEE6', background: '#F8F9F5', flexShrink: 0 },
  modalBody:   { flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex' },
  modalFoot:   { padding: '12px 24px', borderTop: '1px solid #ECEEE6', display: 'flex', alignItems: 'center', gap: '10px', background: '#F8F9F5', flexShrink: 0 },

  sectionLabel: { display: 'flex', alignItems: 'center', gap: '7px', fontSize: '10px', fontWeight: 700, color: '#8C9A8C', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2px' },
  sectionNum:   { width: '17px', height: '17px', borderRadius: '50%', background: '#EEF0E8', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 800, color: '#1F5330' },

  confirmedBanner: { display: 'flex', alignItems: 'center', gap: '10px', background: '#F2FBF0', border: '1.5px solid #B8E0AF', borderRadius: '10px', padding: '10px 14px' },
  tabRow:    { display: 'flex', gap: '6px' },
  tab:       { padding: '5px 14px', borderRadius: '20px', border: '1.5px solid #D8DAD0', background: 'transparent', fontSize: '11px', fontWeight: 600, cursor: 'pointer', color: '#4A5240', fontFamily: "'Poppins', sans-serif" },
  tabActive: { padding: '5px 14px', borderRadius: '20px', border: '1.5px solid #1F5330', background: '#F2FBF0', fontSize: '11px', fontWeight: 600, cursor: 'pointer', color: '#1F5330', fontFamily: "'Poppins', sans-serif" },
  formGrid:  { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
  field:     { display: 'flex', flexDirection: 'column', gap: '4px' },
  fieldLabel: { fontSize: '10px', fontWeight: 700, color: '#797f79', textTransform: 'uppercase', letterSpacing: '0.06em' },
  fieldInput: { padding: '8px 10px', border: '1.5px solid #D8DAD0', borderRadius: '8px', fontSize: '12px', color: '#141514', background: '#F5F6F0', outline: 'none', fontFamily: "'Poppins', sans-serif" },
  addBtn:    { padding: '8px 16px', background: '#1F5330', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Poppins', sans-serif", alignSelf: 'flex-start' },
  editBtn:   { fontSize: '11px', color: '#A4AAA4', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontFamily: "'Poppins', sans-serif" },
  searchBox: { display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 12px', border: '1.5px solid #D8DAD0', borderRadius: '8px', background: '#F5F6F0' },
  searchInput: { border: 'none', background: 'transparent', outline: 'none', fontSize: '12px', color: '#141514', flex: 1, fontFamily: "'Poppins', sans-serif" },
  dropdown:  { position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #D8DAD0', borderRadius: '10px', boxShadow: '0 4px 16px rgba(0,0,0,0.10)', zIndex: 100, marginTop: '4px', overflow: 'hidden' },
  dropItem:  { padding: '12px 14px', fontSize: '12px', color: '#A4AAA4', textAlign: 'center' },
  dropResult: { padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #F0F1E8' },
  dropzone:  { border: '2px dashed #D8DAD0', borderRadius: '12px', padding: '32px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', transition: 'all 0.2s', background: '#FAFBF7' },
  dzTag:     { fontSize: '10px', fontWeight: 500, padding: '2px 8px', borderRadius: '100px', background: '#EEF3E8', color: '#306A33', border: '1px solid #B8C9A8' },
  uploadedBox: { background: '#F2FBF0', border: '1.5px solid #B8E0AF', borderRadius: '10px', padding: '14px', display: 'flex', alignItems: 'center', gap: '12px' },
  fileIconWrap: { width: '40px', height: '40px', borderRadius: '8px', background: '#E8F5E8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },

  hint:       { fontSize: '11px', color: '#C07320', fontWeight: 500 },
  cancelBtn:  { padding: '9px 16px', background: '#fff', border: '1px solid #D8DAD0', borderRadius: '8px', fontSize: '12px', fontWeight: 600, color: '#4A5240', cursor: 'pointer', fontFamily: "'Poppins', sans-serif" },
  analyzeBtn: { padding: '9px 18px', background: '#1F5330', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Poppins', sans-serif" },

  minimizedPill: { position: 'fixed', bottom: '24px', right: '24px', background: '#1F5330', borderRadius: '30px', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 20px rgba(31,83,48,0.4)', cursor: 'pointer', zIndex: 1001 },
  pillBadge:  { background: 'rgba(255,255,255,0.2)', borderRadius: '20px', padding: '2px 8px', fontSize: '11px', fontWeight: 600, color: '#fff' },
  pillBadge2: { background: 'rgba(31,181,5,0.25)', borderRadius: '20px', padding: '2px 8px', fontSize: '11px', fontWeight: 600, color: '#9fff85' },
  pillClose:  { background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', width: '20px', height: '20px', borderRadius: '50%', fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: '2px' },

  // ── Camera modal styles ────────────────────────────────────────────────────
  cameraOverlay: { position: 'fixed', inset: 0, background: 'rgba(8,18,10,0.72)', backdropFilter: 'blur(6px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  cameraModal:   { background: '#fff', borderRadius: '16px', boxShadow: '0 28px 72px rgba(0,0,0,0.32)', display: 'flex', flexDirection: 'column', overflow: 'hidden', width: '560px', maxWidth: '95vw', maxHeight: '90vh' },
  cameraHead:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 18px', background: '#141514', flexShrink: 0 },
  camCtrlBtn:    { width: '28px', height: '28px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  cameraBody:    { flex: 1, background: '#0A0A0A', position: 'relative', minHeight: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  cameraVideo:   { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  cameraGuide:   { position: 'absolute', inset: 0, pointerEvents: 'none' },
  cameraError:   { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', padding: '40px 24px' },
  cameraFoot:    { padding: '12px 18px', borderTop: '1px solid #ECEEE6', display: 'flex', alignItems: 'center', gap: '10px', background: '#F8F9F5', flexShrink: 0 },
};