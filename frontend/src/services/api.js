import axios from 'axios';

// In Kubernetes, nginx proxies /api to backend service
// In local dev, use localhost:5000
const API_BASE_URL = process.env.REACT_APP_API_URL || (
  process.env.NODE_ENV === 'production' 
    ? '/api'  // Relative URL - proxied by nginx to backend
    : 'http://localhost:5000/api'
);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  changePassword: (passwords) => api.post('/auth/change-password', passwords),
  verify: () => api.get('/auth/verify'),
};

// OS Configuration APIs
export const osConfigAPI = {
  getAll: () => api.get('/os-config'),
  getByPlatform: (platform) => api.get(`/os-config/${platform}`),
  update: (platform, data) => api.put(`/os-config/${platform}`, data),
};

// Ansible Roles APIs
export const ansibleRolesAPI = {
  getAll: (params) => api.get('/ansible-roles', { params }),
  getById: (id) => api.get(`/ansible-roles/${id}`),
  create: (data) => api.post('/ansible-roles', data),
  update: (id, data) => api.put(`/ansible-roles/${id}`, data),
  delete: (id) => api.delete(`/ansible-roles/${id}`),
};

// Role Variables APIs
export const roleVariablesAPI = {
  getAll: (params) => api.get('/role-variables', { params }),
  getById: (id) => api.get(`/role-variables/${id}`),
  create: (data) => api.post('/role-variables', data),
  update: (id, data) => api.put(`/role-variables/${id}`, data),
  delete: (id) => api.delete(`/role-variables/${id}`),
};

// TMPL Files APIs
export const tmplFilesAPI = {
  getAll: () => api.get('/tmpl-files'),
  getByEnvironment: (environment) => api.get(`/tmpl-files/${environment}`),
  update: (environment, data) => api.put(`/tmpl-files/${environment}`, data),
};

// GitLab CI APIs
export const gitlabCIAPI = {
  getAll: (params) => api.get('/gitlab-ci', { params }),
  getById: (id) => api.get(`/gitlab-ci/${id}`),
  create: (data) => api.post('/gitlab-ci', data),
  update: (id, data) => api.put(`/gitlab-ci/${id}`, data),
  delete: (id) => api.delete(`/gitlab-ci/${id}`),
};

// Template Generation API
export const templateAPI = {
  generate: (data) => api.post('/template/generate', data, {
    responseType: 'blob',
  }),
};

export default api;
