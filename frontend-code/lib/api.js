/**
 * API Client — centralized fetch wrapper for all backend calls
 * Automatically attaches JWT token from localStorage.
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

async function apiFetch(path, options = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("edu_token") : null;

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const api = {
  auth: {
    register: (body)         => apiFetch("/auth/register",    { method: "POST", body: JSON.stringify(body) }),
    login:    (body)         => apiFetch("/auth/login",        { method: "POST", body: JSON.stringify(body) }),
    me:       ()             => apiFetch("/auth/me"),
    forgotPassword: (email)  => apiFetch("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) }),
    resetPassword: (token, password) =>
      apiFetch(`/auth/reset-password/${token}`, { method: "POST", body: JSON.stringify({ password }) })
  },

  students: {
    list:   (params = {}) => apiFetch("/students?" + new URLSearchParams(params)),
    create: (body)        => apiFetch("/students",  { method: "POST", body: JSON.stringify(body) }),
    get:    (id)          => apiFetch(`/students/${id}`),
    update: (id, body)    => apiFetch(`/students/${id}`, { method: "PUT",    body: JSON.stringify(body) }),
    delete: (id)          => apiFetch(`/students/${id}`, { method: "DELETE" })
  },

  predictions: {
    create: (body)          => apiFetch("/predictions",       { method: "POST", body: JSON.stringify(body) }),
    list:   (params = {})   => apiFetch("/predictions?" + new URLSearchParams(params)),
    get:    (id)            => apiFetch(`/predictions/${id}`),
    stats:  ()              => apiFetch("/predictions/stats"),
    delete: (id)            => apiFetch(`/predictions/${id}`, { method: "DELETE" })
  }
};
