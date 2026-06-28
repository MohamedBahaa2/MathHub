// Central API client – talks to the backend at http://localhost:4010

const BASE = (
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === "production" ? "/api" : "http://localhost:4010/api")
).replace(/\/$/, "");

let refreshPromise = null;

// ── Token / User storage ─────────────────────────────────────────────────────
export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
}
export function setToken(token) { localStorage.setItem("accessToken", token); }
export function clearToken() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("user");
}
export function getUser() {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
}
export function setUser(user) { localStorage.setItem("user", JSON.stringify(user)); }

// ── Core fetch helper ─────────────────────────────────────────────────────────
async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = fetch(`${BASE}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Session expired");
        const data = await res.json();
        setToken(data.accessToken);
        return data.accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

async function request(path, options = {}, retry = true) {
  const token = getToken();
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    ...options,
    headers,
  });
  if (res.status === 401 && retry && path !== "/auth/login" && path !== "/auth/refresh") {
    try {
      await refreshAccessToken();
      return request(path, options, false);
    } catch {
      clearToken();
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
    }
  }
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const b = await res.json();
      msg = b.message || b.error?.message || (typeof b.error === "string" ? b.error : msg);
    } catch {}
    throw new Error(msg);
  }
  if (res.status === 204) return null;
  return res.json();
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const auth = {
  login: (email, password) =>
    request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  logout: () => request("/auth/logout", { method: "POST" }, false),
  me: () => request("/auth/me"),
  updateMe: (data) => request("/auth/me", { method: "PATCH", body: JSON.stringify(data) }),
};

// ── Sessions ──────────────────────────────────────────────────────────────────
export const sessions = {
  list: () => request("/sessions"),
  get: (id) => request(`/sessions/${id}`),
  create: (data) => request("/sessions", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) => request(`/sessions/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  advanceStatus: (id, status) =>
    request(`/sessions/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  delete: (id) => request(`/sessions/${id}`, { method: "DELETE" }),
  getZoomLink: (id) => request(`/sessions/${id}/zoom-link`),
  getRecordingUrl: (id) => request(`/sessions/${id}/recording-url`),
};

// ── Assignments ───────────────────────────────────────────────────────────────
export const assignments = {
  list: () => request("/assignments"),
  get: (id) => request(`/assignments/${id}`),
  create: (data) => request("/assignments", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) => request(`/assignments/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id) => request(`/assignments/${id}`, { method: "DELETE" }),
  submit: (id, file) => {
    const form = new FormData();
    form.append("file", file);
    return request(`/assignments/${id}/submit`, { method: "POST", body: form });
  },
  getSubmissions: (id) => request(`/assignments/${id}/submissions`),
  grade: (assignmentId, subId, grade, feedback) =>
    request(`/assignments/${assignmentId}/submissions/${subId}/grade`, {
      method: "PATCH",
      body: JSON.stringify({ grade, feedback }),
    }),
};

// ── Quizzes ───────────────────────────────────────────────────────────────────
export const quizzes = {
  list: () => request("/quizzes"),
  get: (id) => request(`/quizzes/${id}`),
  create: (data) => request("/quizzes", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) => request(`/quizzes/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id) => request(`/quizzes/${id}`, { method: "DELETE" }),
  addQuestion: (id, data) => {
    const form = new FormData();
    form.append("text", data.text);
    form.append("type", data.type);
    form.append("order", String(data.order));
    form.append("points", String(data.points));
    if (data.correctText) form.append("correctText", data.correctText);
    if (data.file) form.append("media", data.file);
    return request(`/quizzes/${id}/questions`, { method: "POST", body: form });
  },
  updateQuestion: (id, questionId, data) =>
    request(`/quizzes/${id}/questions/${questionId}`, {
      method: "PATCH", body: JSON.stringify(data),
    }),
  deleteQuestion: (id, questionId) =>
    request(`/quizzes/${id}/questions/${questionId}`, { method: "DELETE" }),
  addChoice: (id, questionId, data) =>
    request(`/quizzes/${id}/questions/${questionId}/choices`, {
      method: "POST", body: JSON.stringify(data),
    }),
  startAttempt: (id) => request(`/quizzes/${id}/attempt`, { method: "POST" }),
  saveAnswer: (id, data) => {
    if (data.file) {
      const form = new FormData();
      form.append("questionId", data.questionId);
      if (data.choiceId) form.append("choiceId", data.choiceId);
      if (data.textAnswer) form.append("textAnswer", data.textAnswer);
      form.append("media", data.file);
      return request(`/quizzes/${id}/attempt/answer`, { method: "POST", body: form });
    }
    return request(`/quizzes/${id}/attempt/answer`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  submitAttempt: (id) => request(`/quizzes/${id}/attempt/submit`, { method: "POST" }),
  getAttempts: (id) => request(`/quizzes/${id}/attempts`),
  gradeAttempt: (id, attemptId, grades) =>
    request(`/quizzes/${id}/attempts/${attemptId}/grade`, {
      method: "PATCH", body: JSON.stringify({ grades }),
    }),
};

// ── Users (admin) ─────────────────────────────────────────────────────────────
export const users = {
  list: (params = "") => request(`/users${params}`),
  get: (id) => request(`/users/${id}`),
  create: (data) => request("/users", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) => request(`/users/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id) => request(`/users/${id}`, { method: "DELETE" }),
};

// ── Reports ───────────────────────────────────────────────────────────────────
export const reports = {
  list: () => request("/reports"),
  get: (id) => request(`/reports/${id}`),
  generate: (data) => request("/reports/generate", { method: "POST", body: JSON.stringify(data) }),
  downloadPdf: (id) => {
    const token = getToken();
    return fetch(`${BASE}/reports/${id}/pdf`, {
      credentials: "include",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
};

// ── Payments ──────────────────────────────────────────────────────────────────
export const payments = {
  list: () => request("/payments"),
  initiate: (data) => request("/payments/initiate", { method: "POST", body: JSON.stringify(data) }),
  downloadReceipt: (id) => {
    const token = getToken();
    return fetch(`${BASE}/payments/${id}/receipt`, {
      credentials: "include",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
};

// ── Notifications ─────────────────────────────────────────────────────────────
export const notifications = {
  list: () => request("/notifications"),
  markRead: (id) => request(`/notifications/${id}/read`, { method: "PATCH" }),
  markAllRead: () => request("/notifications/read-all", { method: "PATCH" }),
};

// ── Help Requests ─────────────────────────────────────────────────────────────
export const help = {
  list: () => request("/help"),
  create: (topic, description, priority) =>
    request("/help", { method: "POST", body: JSON.stringify({ topic, description, priority }) }),
  reply: (id, adminReply, status) =>
    request(`/help/${id}/reply`, { method: "PATCH", body: JSON.stringify({ adminReply, status }) }),
};
