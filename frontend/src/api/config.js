// -----------------------------------------------------------------
// src/api/config.js
// Central API layer - points to your live backend
// -----------------------------------------------------------------

export const API_BASE_URL =
  process.env.REACT_APP_API_URL || "https://ncc-backend.vercel.app/api/v1";

// Token helpers
export const getToken = () => localStorage.getItem("ncc_token");
export const setToken = (t) => localStorage.setItem("ncc_token", t);
export const clearToken = () => localStorage.removeItem("ncc_token");

export const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem("ncc_user") || "null");
  } catch {
    return null;
  }
};
export const setUser = (u) =>
  localStorage.setItem("ncc_user", JSON.stringify(u));
export const clearUser = () => localStorage.removeItem("ncc_user");

// Core fetch wrapper
async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    clearToken();
    clearUser();
    window.location.href = "/login";
    return;
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data;
}

// Auth endpoints
export const api = {
  auth: {
    login: (credentials) =>
      request("/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      }),
    logout: () => request("/auth/logout", { method: "POST" }),
    me: () => request("/auth/me"),
  },

  cadets: {
    list: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/cadets${qs ? "?" + qs : ""}`);
    },
    get: (id) => request(`/cadets/${id}`),
    create: (data) =>
      request("/cadets", { method: "POST", body: JSON.stringify(data) }),
    update: (id, data) =>
      request(`/cadets/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id) => request(`/cadets/${id}`, { method: "DELETE" }),
    attendance: (id) => request(`/cadets/${id}/attendance`),
  },

  attendance: {
    mark: (data) =>
      request("/attendance", { method: "POST", body: JSON.stringify(data) }),
    byDate: (date) => request(`/attendance?date=${date}`),
    report: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/attendance/report${qs ? "?" + qs : ""}`);
    },
    export: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/attendance/export${qs ? "?" + qs : ""}`);
    },
  },

  parades: {
    list: () => request("/parades"),
    upcoming: () => request("/parades/upcoming"),
    create: (data) =>
      request("/parades", { method: "POST", body: JSON.stringify(data) }),
    update: (id, data) =>
      request(`/parades/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id) => request(`/parades/${id}`, { method: "DELETE" }),
  },

  stats: {
    unit: () => request("/stats/unit"),
    cadet: (id) => request(`/stats/cadet/${id}`),
  },
};

// CSV export helper (client-side fallback)
export function downloadCSV(rows, filename = "attendance_report.csv") {
  if (!rows?.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((r) =>
      headers.map((h) => JSON.stringify(r[h] ?? "")).join(",")
    ),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
