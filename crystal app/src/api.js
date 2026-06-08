const BASE_URL = "http://18.116.200.163:5000/api";
const CLOUD_MODEL_URL = "http://18.116.200.163:5001";
const LOCAL_MODEL_URL = 'http://127.0.0.1:5001';

const IS_ELECTRON_APP =
  typeof window !== 'undefined' &&
  window.navigator &&
  window.navigator.userAgent &&
  window.navigator.userAgent.toLowerCase().includes('electron');

async function fetchJsonSafe(url, options = {}) {
  const response = await fetch(url, options);
  const contentType = response.headers.get('content-type') || '';
  const rawText = await response.text();

  if (!contentType.includes('application/json')) {
    const preview = rawText.slice(0, 300);

    throw new Error(
      `Server did not return JSON.\n\nURL: ${url}\nStatus: ${response.status}\nResponse starts with:\n${preview}`
    );
  }

  let data;

  try {
    data = JSON.parse(rawText);
  } catch (err) {
    throw new Error(`Invalid JSON returned by server: ${err.message}`);
  }

  if (!response.ok) {
    throw new Error(data.message || data.error || `Server error: ${response.status}`);
  }

  return data;
}

async function checkModelHealth(url, timeoutMs = 10000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${url}/health`, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      return false;
    }

    const contentType = res.headers.get('content-type') || '';
    return contentType.includes('application/json');
  } catch {
    clearTimeout(timeout);
    return false;
  }
}

export async function getModelServerUrl() {
  const localAvailable = await checkModelHealth(LOCAL_MODEL_URL, 10000);

  if (localAvailable) {
    console.log('[MODEL SERVER] Using local model:', LOCAL_MODEL_URL);
    return LOCAL_MODEL_URL;
  }

  if (IS_ELECTRON_APP) {
    throw new Error(
      'Local model server is not ready. Close MagniTect, open it again, and wait until the app finishes loading. If this continues, the packaged model-api.exe is not starting correctly.'
    );
  }

  const cloudAvailable = await checkModelHealth(CLOUD_MODEL_URL, 10000);

  if (cloudAvailable) {
    console.log('[MODEL SERVER] Using cloud model:', CLOUD_MODEL_URL);
    return CLOUD_MODEL_URL;
  }

  throw new Error(
    'No model server is available. Local model and cloud model are both unreachable.'
  );
}

const getToken = () => localStorage.getItem('token');

const headers = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getToken()}`
});

// ── Patients ──
export const getPatients = async () => {
  return fetchJsonSafe(`${BASE_URL}/patients`, {
    headers: headers()
  });
};

export const addPatient = async (patient) => {
  return fetchJsonSafe(`${BASE_URL}/patients`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(patient)
  });
};

export const updatePatient = async (id, data) => {
  return fetchJsonSafe(`${BASE_URL}/patients/${id}`, {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify(data)
  });
};

export const deletePatient = async (id) => {
  return fetchJsonSafe(`${BASE_URL}/patients/${id}`, {
    method: 'DELETE',
    headers: headers()
  });
};

export const searchPatients = async (query) => {
  return fetchJsonSafe(`${BASE_URL}/patients/search?q=${encodeURIComponent(query)}`, {
    headers: headers()
  });
};

// ── Analyses ──
export const getAnalyses = async () => {
  return fetchJsonSafe(`${BASE_URL}/analyses`, {
    headers: headers()
  });
};

export const getAnalysesByPatient = async (patientId) => {
  return fetchJsonSafe(`${BASE_URL}/analyses/patient/${patientId}`, {
    headers: headers()
  });
};

export const saveAnalyses = async (records) => {
  return fetchJsonSafe(`${BASE_URL}/analyses`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(records)
  });
};

export const deleteAnalysis = async (id) => {
  return fetchJsonSafe(`${BASE_URL}/analyses/${id}`, {
    method: 'DELETE',
    headers: headers()
  });
};

// ── Images ──
export const uploadImage = async (formData) => {
  return fetchJsonSafe(`${BASE_URL}/images/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getToken()}`
    },
    body: formData
  });
};

// ── Model API ──
export const analyzeImage = async (imageFile) => {
  const formData = new FormData();
  formData.append('image', imageFile);

  const modelUrl = await getModelServerUrl();

  return fetchJsonSafe(`${modelUrl}/analyze`, {
    method: 'POST',
    body: formData
  });
};

export const createPatient = async (patientData) => {
  return fetchJsonSafe(`${BASE_URL}/patients`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(patientData)
  });
};