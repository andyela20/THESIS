const BASE_URL = 'http://localhost:5000/api';

const getToken = () => localStorage.getItem('token');

const headers = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getToken()}`
});

// ── Patients ──
export const getPatients = async () => {
  const res = await fetch(`${BASE_URL}/patients`, { headers: headers() });
  return res.json();
};

export const addPatient = async (patient) => {
  const res = await fetch(`${BASE_URL}/patients`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(patient)
  });
  return res.json();
};

export const updatePatient = async (id, data) => {
  const res = await fetch(`${BASE_URL}/patients/${id}`, {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify(data)
  });
  return res.json();
};

export const deletePatient = async (id) => {
  const res = await fetch(`${BASE_URL}/patients/${id}`, {
    method: 'DELETE',
    headers: headers()
  });
  return res.json();
};

// ── Analyses ──
export const getAnalyses = async () => {
  const res = await fetch(`${BASE_URL}/analyses`, { headers: headers() });
  return res.json();
};

export const getAnalysesByPatient = async (patientId) => {
  const res = await fetch(`${BASE_URL}/analyses/patient/${patientId}`, { headers: headers() });
  return res.json();
};

export const saveAnalyses = async (records) => {
  const res = await fetch(`${BASE_URL}/analyses`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(records)
  });
  return res.json();
};

// ── Images ──
export const uploadImage = async (formData) => {
  const res = await fetch(`${BASE_URL}/images/upload`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${getToken()}` },
    body: formData
  });
  return res.json();
};