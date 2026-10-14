import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('librax_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to catch 401 / expired token
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register') {
        localStorage.removeItem('librax_token');
        localStorage.removeItem('librax_user');
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authApi = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// Books endpoints
export const booksApi = {
  getAll: (params) => api.get('/books', { params }),
  getById: (id) => api.get(`/books/${id}`),
  getDiscovery: () => api.get('/books/discovery'),
  getCatalogStats: () => api.get('/books/catalog-stats'),
  create: (data) => api.post('/books', data),
  bulkCreate: (data) => api.post('/books/bulk', data),
  update: (id, data) => api.put(`/books/${id}`, data),
  delete: (id) => api.delete(`/books/${id}`),
  getQrCode: (id) => api.get(`/books/${id}/qrcode`),
};

// Categories endpoints
export const categoriesApi = {
  getAll: (params) => api.get('/categories', { params }),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
};

// Students endpoints
export const studentsApi = {
  getAll: (params) => api.get('/students', { params }),
  getById: (id) => api.get(`/students/${id}`),
  create: (data) => api.post('/students', data),
  update: (id, data) => api.put(`/students/${id}`, data),
  toggleStatus: (id) => api.put(`/students/${id}/toggle-status`),
};

// Transactions endpoints
export const transactionsApi = {
  issue: (data) => api.post('/transactions/issue', data),
  borrow: (data) => api.post('/transactions/borrow', data),
  returnBook: (data) => api.post('/transactions/return', data),
  getAll: (params) => api.get('/transactions', { params }),
  getById: (id) => api.get(`/transactions/${id}`),
};

// Reservations endpoints
export const reservationsApi = {
  create: (data) => api.post('/reservations', data),
  getAll: (params) => api.get('/reservations', { params }),
  updateStatus: (id, status) => api.put(`/reservations/${id}`, { status }),
  delete: (id) => api.delete(`/reservations/${id}`),
};

// Favorites endpoints
export const favoritesApi = {
  getAll: (params) => api.get('/favorites', { params }),
  toggle: (bookId) => api.post(`/favorites/${bookId}`),
  remove: (bookId) => api.delete(`/favorites/${bookId}`),
  check: (bookId) => api.get(`/favorites/check/${bookId}`),
};

// Reviews endpoints
export const reviewsApi = {
  getByBook: (bookId) => api.get(`/books/${bookId}/reviews`),
  add: (bookId, data) => api.post(`/books/${bookId}/reviews`, data),
  delete: (id) => api.delete(`/reviews/${id}`),
  getAllAdmin: () => api.get('/reviews/admin/all'),
};

// Fines endpoints
export const finesApi = {
  getAll: (params) => api.get('/fines', { params }),
  getStats: () => api.get('/fines/stats'),
  payFine: (id) => api.put(`/fines/${id}/pay`),
};

// Notifications endpoints
export const notificationsApi = {
  getAll: () => api.get('/notifications'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
};

// Dashboard endpoints
export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
};

// Reports endpoints
export const reportsApi = {
  getReports: (params) => api.get('/reports', { params }),
  export: () => api.get('/reports/export'),
};

// Settings endpoints
export const settingsApi = {
  getSettings: () => api.get('/settings'),
  updateSettings: (data) => api.put('/settings', data),
};

export default api;

