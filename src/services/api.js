import axios from 'axios'

const API = axios.create({
  baseURL: 'http://127.0.0.1:8000',   // Vite proxy forwards to http://localhost:5173
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

// ── Attach JWT token to every request ──────────────────────
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('smarteats_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Existing endpoints ─────────────────────────────────────

export const getRecommendations = (preferences) =>
  API.post('/recommend', preferences).then((r) => r.data)

export const queryFoods = (text) =>
  API.post('/query', { text }).then((r) => r.data)

export const recognizeImage = (formData) =>
  API.post('/image/recognize', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data)

export const getFoods = (params) =>
  API.get('/foods', { params }).then((r) => r.data)

export const getHealth = () =>
  API.get('/health').then((r) => r.data)

// ── Auth endpoints (Name + Password) ───────────────────────

export const authRegister = (name, password) =>
  API.post('/auth/register', { name, password }).then((r) => r.data)

export const authLogin = (name, password) =>
  API.post('/auth/login', { name, password }).then((r) => r.data)

export const authMe = () =>
  API.get('/auth/me').then((r) => r.data)
