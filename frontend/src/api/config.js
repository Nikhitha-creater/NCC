// src/api/config.js
// ─────────────────────────────────────────────────────────────────────────────
// Centralised API caller.
// Every method returns a Promise. When the backend is offline every call will
// reject — callers are expected to catch and fall back to mock data.
// ─────────────────────────────────────────────────────────────────────────────

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// ── Token helper ──────────────────────────────────────────────────────────────
function getToken() {
  try {
    return localStorage.getItem("ncc_portal_token") || "";
  } catch {
    return "";
  }
}

// ── Core fetch wrapper ────────────────────────────────────────────────────────
async function request(method, path, body) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`API ${method} ${path} → ${res.status}: ${msg}`);
  }
  return res.json();
}

// ── Namespaced API surface ────────────────────────────────────────────────────
export const api = {
  auth: {
    login:  (creds)  => request("POST", "/auth/login",  creds),
    logout: ()       => request("POST", "/auth/logout"),
    me:     ()       => request("GET",  "/auth/me"),
  },

  cadets: {
    list:    ()      => request("GET",  "/cadets"),
    profile: (id)    => request("GET",  `/cadets/${id || "me"}`),
    update:  (id, d) => request("PUT",  `/cadets/${id}`, d),
  },

  attendance: {
    list:    (params) => request("GET",  `/attendance?${new URLSearchParams(params || {})}`),
    summary: ()       => request("GET",  "/attendance/summary"),
    mark:    (data)   => request("POST", "/attendance/mark", data),
  },

  parades: {
    list:   ()       => request("GET",  "/parades"),
    detail: (id)     => request("GET",  `/parades/${id}`),
  },

  reports: {
    unit:   (params) => request("GET",  `/reports/unit?${new URLSearchParams(params || {})}`),
    cadet:  (id)     => request("GET",  `/reports/cadet/${id}`),
  },

  announcements: {
    list:   ()       => request("GET",  "/announcements"),
  },
};
