import axios from 'axios';

// Vite dev proxy and Nginx both forward /api -> backend:8082.
// Override with VITE_API_BASE_URL to target the API directly, e.g.
// http://localhost:8082/api
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const http = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' }
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('evege_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const fetchEvents = () => http.get('/events');
export const fetchStats = () => http.get('/events/stats');
export const fetchRegistrations = () => http.get('/registrations');
export const registerForEvent = (registrationData) => http.post('/registrations', registrationData);
export const login = (credentials) => http.post('/auth/login', credentials);

export default http;
