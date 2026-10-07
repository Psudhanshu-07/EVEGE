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

export default http;
