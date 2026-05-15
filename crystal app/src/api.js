const BASE_URL = 'http://16.59.206.79:5000/api';

const CLOUD_MODEL_URL = 'http://16.59.206.79:5001';
const LOCAL_MODEL_URL = 'http://127.0.0.1:5001';

async function checkModelHealth(url, timeoutMs = 1200) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${url}/health`, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeout);
    return res.ok;
  } catch {
    clearTimeout(timeout);
    return false;
  }
}

export async function getModelServerUrl() {
  const localAvailable = await checkModelHealth(LOCAL_MODEL_URL);

  if (localAvailable) {
    console.log('[MODEL SERVER] Using local model:', LOCAL_MODEL_URL);
    return LOCAL_MODEL_URL;
  }

  console.log('[MODEL SERVER] Local model unavailable. Using cloud model:', CLOUD_MODEL_URL);
  return CLOUD_MODEL_URL;
}

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

export const searchPatients = async (query) => {
  const res = await fetch(`${BASE_URL}/patients/search?q=${encodeURIComponent(query)}`, {
    headers: headers()   // ← fix: may auth token na
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

// ── Model API ──
export const analyzeImage = async (imageFile) => {
  const formData = new FormData();
  formData.append('image', imageFile);
  
  const modelUrl = await getModelServerUrl();
  const res = await fetch(`${modelUrl}/analyze`, { 
    method: 'POST',
    body: formData
  });
  return res.json();
};

export const deleteAnalysis = async (id) => {
  const res = await fetch(`${BASE_URL}/analyses/${id}`, {
    method: 'DELETE',
    headers: headers()
  });
  return res.json();
};
