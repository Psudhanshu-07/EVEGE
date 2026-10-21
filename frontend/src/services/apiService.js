import axios from 'axios';

// Resolve API Base URL:
// In local dev: defaults to '/api' (proxied by Vite to localhost:8082).
// In Vercel production: set VITE_API_BASE_URL environment variable to your Render backend (e.g. https://evege-backend.onrender.com)
const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
const cleanUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;
const BASE_URL = cleanUrl === '/api' || cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;

const http = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' }
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('evege_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth endpoints
export const login = (credentials) => http.post('/auth/login', credentials);
export const registerUser = (userData) => http.post('/auth/register', userData);
export const checkEmailExists = (email) => http.get(`/auth/check-email?email=${encodeURIComponent(email)}`);
export const fetchCurrentUser = () => http.get('/auth/me');
export const fetchAllUsers = () => http.get('/auth/students');
export const fetchAllStudentAccounts = () => http.get('/auth/student-accounts');
export const debugEmailCheck = (email) => http.get(`/auth/debug-email?email=${encodeURIComponent(email)}`);
export const deleteUserByEmail = (email) => http.delete(`/auth/delete-user?email=${encodeURIComponent(email)}`);
export const resetAllStudentData = () => http.post('/auth/reset-students');

// Event endpoints
export const fetchEvents = () => http.get('/events');
export const fetchEventById = (id) => http.get(`/events/${id}`);
export const createEvent = (eventData) => http.post('/events', eventData);
export const deleteEvent = (id) => http.delete(`/events/${id}`);
export const fetchStats = () => http.get('/events/stats');

// Registration endpoints
export const fetchRegistrations = (email) => {
  const url = email ? `/registrations?email=${encodeURIComponent(email)}` : '/registrations';
  return http.get(url);
};
export const registerForEvent = (registrationData) => http.post('/registrations', registrationData);
// Unified registration (COLLEGE / EXTERNAL)
export const unifiedRegister = (payload) => http.post('/registrations/unified', payload);

// ---------- Scheduling assistant ----------
export const scheduleDay = (date) => http.get(`/schedule/day?date=${encodeURIComponent(date)}`);
export const scheduleAssess = (date, selectedEventIds) =>
  http.post('/schedule/assess', { date, selectedEventIds });

// ---------- NSS ----------
export const nssSummary = () => http.get('/nss/summary');
export const nssStatus = (email) => http.get(`/nss/status${email ? `?email=${encodeURIComponent(email)}` : ''}`);
export const nssApply = (payload) => http.post('/nss/apply', payload);
export const nssWithdraw = () => http.post('/nss/withdraw');
export const nssApplications = () => http.get('/nss/applications');
export const nssReviewApplication = (id, decision, adminNote) =>
  http.post(`/nss/applications/${id}/review`, { decision, adminNote });
export const nssTasks = (all = false) => http.get(`/nss/tasks${all ? '?all=true' : ''}`);
export const nssTask = (id) => http.get(`/nss/tasks/${id}`);
export const nssCreateTask = (payload) => http.post('/nss/tasks', payload);
export const nssUpdateTask = (id, payload) => http.put(`/nss/tasks/${id}`, payload);
export const nssDeleteTask = (id) => http.delete(`/nss/tasks/${id}`);
export const nssRegisterForTask = (id) => http.post(`/nss/tasks/${id}/register`);
export const nssTaskRegistrations = (id) => http.get(`/nss/tasks/${id}/registrations`);
export const nssMarkAttendance = (id, volunteerEmail, attendance) =>
  http.post(`/nss/tasks/${id}/attendance`, { volunteerEmail, attendance });
export const nssVerifyHours = (id, volunteerEmail, actualHours) =>
  http.post(`/nss/tasks/${id}/hours`, { volunteerEmail, actualHours });
export const nssMyRegistrations = (email) =>
  http.get(`/nss/my/registrations${email ? `?email=${encodeURIComponent(email)}` : ''}`);
export const nssMyHours = (email) =>
  http.get(`/nss/my/hours${email ? `?email=${encodeURIComponent(email)}` : ''}`);
export const nssSeedDemo = () => http.post('/nss/seed-demo');

// ---------- Leaderboards & scoring ----------
export const leaderboard = (category, includeDetails = false) =>
  http.get(`/leaderboard/${encodeURIComponent(category)}${includeDetails ? '?includeDetails=true' : ''}`);
export const myLeaderboardResults = (category) =>
  http.get(`/leaderboard/me?category=${encodeURIComponent(category)}`);
export const saveScore = (payload) => http.post('/leaderboard/scores', payload);
export const scoresForEvent = (eventId) => http.get(`/leaderboard/scores/${eventId}`);

export default http;
