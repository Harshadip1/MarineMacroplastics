import axios from 'axios'

const API_BASE_URL = 'http://localhost:5000/api'

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// No authentication needed - removed token interceptor

// Handle auth errors (no authentication needed)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // No login redirect - authentication removed
    return Promise.reject(error)
  }
)

// Authentication APIs (removed - no authentication needed)
export const authAPI = {
  // Login functionality removed
  logout: () => {
    // No logout needed
  }
}

// Dashboard & Analytics APIs
export const dashboardAPI = {
  getStats: () => api.get('/analytics/dashboard'),
  getOverview: () => api.get('/analytics/overview'),
  getTrends: (period = '7days') => api.get(`/analytics/trends?period=${period}`),
  getReports: () => api.get('/analytics/reports')
}

// Zones/Areas APIs
export const zonesAPI = {
  getAll: () => api.get('/zones'),
  getById: (id) => api.get(`/zones/${id}`),
  create: (data) => api.post('/zones', data),
  update: (id, data) => api.put(`/zones/${id}`, data),
  delete: (id) => api.delete(`/zones/${id}`),
  getRiskAreas: () => api.get('/zones/risk-areas'),
  getByLocation: (lat, lng, radius) => api.get(`/zones/nearby?lat=${lat}&lng=${lng}&radius=${radius}`)
}

// Detections APIs
export const detectionsAPI = {
  getAll: (params = {}) => api.get('/detection', { params }),
  getById: (id) => api.get(`/detection/${id}`),
  create: (data) => api.post('/detection', data),
  update: (id, data) => api.put(`/detection/${id}`, data),
  delete: (id) => api.delete(`/detection/${id}`),
  processImage: (imageData) => api.post('/detection/process', imageData),
  getStats: () => api.get('/detection/stats')
}

// Workers APIs
export const workersAPI = {
  getAll: () => api.get('/workers'),
  getById: (id) => api.get(`/workers/${id}`),
  create: (data) => api.post('/workers', data),
  update: (id, data) => api.put(`/workers/${id}`, data),
  delete: (id) => api.delete(`/workers/${id}`),
  getStats: (id) => api.get(`/workers/${id}/stats`),
  assignTask: (id, taskId) => api.post(`/workers/${id}/assign`, { taskId })
}

// Tasks APIs
export const tasksAPI = {
  getAll: (params = {}) => api.get('/tasks', { params }),
  getById: (id) => api.get(`/tasks/${id}`),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
  assign: (id, workerId) => api.post(`/tasks/${id}/assign`, { workerId }),
  updateStatus: (id, status) => api.put(`/tasks/${id}/status`, { status })
}

// Drones APIs
export const dronesAPI = {
  getAll: () => api.get('/drones'),
  getById: (id) => api.get(`/drones/${id}`),
  create: (data) => api.post('/drones', data),
  update: (id, data) => api.put(`/drones/${id}`, data),
  delete: (id) => api.delete(`/drones/${id}`),
  deploy: (id, mission) => api.post(`/drones/${id}/deploy`, mission),
  getStatus: (id) => api.get(`/drones/${id}/status`)
}

// AI Model APIs
export const aiAPI = {
  predict: (imageData) => api.post('/ai/predict', imageData),
  batchPredict: (images) => api.post('/ai/batch-predict', { images }),
  getModelInfo: () => api.get('/ai/model-info'),
  train: (data) => api.post('/ai/train', data)
}

// Notifications APIs
export const notificationsAPI = {
  getAll: () => api.get('/notifications'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  getUnreadCount: () => api.get('/notifications/unread-count')
}

export default api
