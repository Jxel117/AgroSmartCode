const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/api';

function getToken() {
  return localStorage.getItem('audit_token') || '';
}

async function request(endpoint, options = {}) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
      ...options.headers,
    },
  });

  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem('audit_token');
    window.location.reload();
    throw new Error('Sesión expirada');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Error ${res.status}`);
  }

  return res;
}

export async function fetchEventos(params = {}) {
  const query = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) query.set(k, v);
  }
  const res = await request(`/audit/eventos?${query}`);
  return res.json();
}

export async function fetchStats() {
  const res = await request('/audit/stats');
  return res.json();
}

export async function exportarEventos(params = {}) {
  const query = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) query.set(k, v);
  }
  const res = await request(`/audit/export?${query}`);

  if (params.formato === 'csv') {
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auditoria_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    return null;
  }

  return res.json();
}

export async function healthCheck() {
  const res = await fetch(`${API_URL}/health`);
  return res.json();
}
