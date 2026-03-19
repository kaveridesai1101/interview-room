const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

/**
 * Unified API Client for AI Interview Room
 */
export const api = {
  // --- Auth ---
  login: async (email, password) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return res.json();
  },

  signup: async (data) => {
    const res = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  verifySignup: async (email, otp) => {
    const res = await fetch(`${API_URL}/auth/verify-signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    });
    return res.json();
  },

  resendOTP: async (email) => {
    const res = await fetch(`${API_URL}/auth/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return res.json();
  },

  // --- Interview Sessions ---
  getSessions: async () => {
    const res = await fetch(`${API_URL}/api/interview/sessions`, {
      headers: getHeaders(),
    });
    return res.json();
  },

  createSession: async (interviewType, recruiterId = null) => {
    const res = await fetch(`${API_URL}/api/interview/sessions`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ interview_type: interviewType, recruiter_id: recruiterId }),
    });
    return res.json();
  },

  getSessionMode: async (sessionId) => {
    const res = await fetch(`${API_URL}/api/interview/sessions/${sessionId}/mode`, {
      headers: getHeaders(),
    });
    return res.json();
  },

  submitAnswer: async (sessionId, data) => {
    const res = await fetch(`${API_URL}/api/interview/sessions/${sessionId}/answer`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  completeSession: async (sessionId) => {
    const res = await fetch(`${API_URL}/api/interview/sessions/${sessionId}/complete`, {
      method: 'PUT',
      headers: getHeaders(),
    });
    return res.json();
  },

  getSessionReport: async (sessionId) => {
    const res = await fetch(`${API_URL}/api/interview/sessions/${sessionId}/report`, {
      headers: getHeaders(),
    });
    return res.json();
  },

  // --- Logs (Emotion/Eye Contact/Copy) ---
  logEmotion: async (sessionId, data) => {
    await fetch(`${API_URL}/api/interview/sessions/${sessionId}/emotion-log`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
  },

  logEyeContact: async (sessionId, data) => {
    await fetch(`${API_URL}/api/interview/sessions/${sessionId}/eye-contact-log`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
  },

  logCopyEvent: async (sessionId, data) => {
    await fetch(`${API_URL}/api/interview/sessions/${sessionId}/copy-event`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
  },

  // --- Questions ---
  getQuestions: async (category = '') => {
    const url = category ? `${API_URL}/api/interview/questions?category=${category}` : `${API_URL}/api/interview/questions`;
    const res = await fetch(url, { headers: getHeaders() });
    return res.json();
  },

  upsertQuestion: async (id, data) => {
    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_URL}/api/interview/questions/${id}` : `${API_URL}/api/interview/questions`;
    const res = await fetch(url, {
      method,
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  deleteQuestion: async (id) => {
    const res = await fetch(`${API_URL}/api/interview/questions/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return res.json();
  },

  // --- Meetings ---
  scheduleMeeting: async (data) => {
    const res = await fetch(`${API_URL}/api/interview/sessions/schedule`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  getMeetingConfig: async (sessionId) => {
    const res = await fetch(`${API_URL}/api/interview/sessions/${sessionId}/meeting`, {
      headers: getHeaders(),
    });
    return res.json();
  },

  getPublicMeetingConfig: async (sessionId) => {
    const res = await fetch(`${API_URL}/api/interview/public/meeting/${sessionId}`);
    return res.json();
  },

  // --- Admin Stats ---
  getStats: async () => {
    const res = await fetch(`${API_URL}/api/interview/stats`, {
      headers: getHeaders(),
    });
    return res.json();
  },

  // --- Users ---
  getProfile: async () => {
    const res = await fetch(`${API_URL}/users/me`, {
      headers: getHeaders(),
    });
    return res.json();
  },

  updateProfile: async (data) => {
    const res = await fetch(`${API_URL}/users/update-profile`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },
};
