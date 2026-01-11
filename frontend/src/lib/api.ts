/**
 * API Client for WebStar V1
 */
import axios from 'axios';
import { API_URL, buildApiUrl } from './api-config';

// Create axios instance with validated API URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Handle connection errors
    if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED' || error.message?.includes('ERR_CONNECTION_REFUSED')) {
      console.error('❌ Backend server is not running. Please start the backend server on port 8000.');
      // Return a more helpful error message
      return Promise.reject(new Error('Backend server is not running. Please make sure the backend is started on http://localhost:8000'));
    }
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_URL}/api/auth/refresh`, {
            refresh_token: refreshToken,
          });
          
          const { access_token, refresh_token: newRefreshToken } = response.data;
          localStorage.setItem('access_token', access_token);
          localStorage.setItem('refresh_token', newRefreshToken);
          
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        } catch (refreshError) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          window.location.href = '/auth/login';
          return Promise.reject(refreshError);
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authAPI = {
  register: (data: { email: string; username: string; password: string; full_name: string }) =>
    api.post('/api/auth/register', data),
  
  login: (data: { email: string; password: string }) =>
    api.post('/api/auth/login', data),
  
  verify2FALogin: (tempToken: string, totpCode: string) =>
    api.post('/api/auth/verify-2fa', { temp_token: tempToken, totp_code: totpCode }),
  
  googleAuth: (token: string) =>
    api.post('/api/auth/google', { token }),
  
  refresh: (refreshToken: string) =>
    api.post('/api/auth/refresh', { refresh_token: refreshToken }),
  
  checkUsername: (username: string) =>
    api.get(`/api/auth/check-username/${username}`),
  
  updateProfile: (data: { username?: string; full_name?: string }) =>
    api.post('/api/auth/setup-profile', data),
};

// Onboarding API
export const onboardingAPI = {
  getStatus: () => api.get('/api/onboarding/status'),
  
  setArchetype: (archetype: string) =>
    api.post('/api/onboarding/archetype', { archetype }),
  
  setRole: (role: string) =>
    api.post('/api/onboarding/role', { role }),
  
  setExpertise: (expertise_level: string) =>
    api.post('/api/onboarding/expertise', { expertise_level }),
  
  complete: (data: { archetype: string; role: string; expertise_level: string; username?: string; full_name?: string; location?: string; bio?: string }) =>
    api.post('/api/onboarding/complete', data),
  
  checkUsernameAvailability: async (username: string) => {
    const response = await api.get(`/api/auth/check-username/${username}`);
    return response.data;
  },
};

// Profile API
export const profileAPI = {
  getMe: () => api.get('/api/profiles/me'),
  
  updateMe: (data: any) => api.put('/api/profiles/me', data),
  
  getByUsername: (username: string) => api.get(`/api/profiles/${username}`),
  
  likeProfile: (username: string) => api.post(`/api/profiles/${username}/like`),
  
  unlikeProfile: (username: string) => api.delete(`/api/profiles/${username}/like`),
};

// Portfolio API
export const portfolioAPI = {
  getItems: () => api.get('/api/portfolio'),
  
  getUserItems: (username: string) => api.get(`/api/portfolio/user/${username}`),
  
  getDrafts: () => api.get('/api/portfolio/drafts'),
  
  createItem: (data: any) => api.post('/api/portfolio', data),
  
  updateItem: (id: number, data: any) => api.put(`/api/portfolio/${id}`, data),
  
  deleteItem: (id: number) => api.delete(`/api/portfolio/${id}`),
  
  publishDraft: (id: number) => api.post(`/api/portfolio/${id}/publish`),
  
  trackView: (id: number) => api.post(`/api/portfolio/${id}/view`),
  
  trackClick: (id: number) => api.post(`/api/portfolio/${id}/click`),
};

// Projects API
export const projectsAPI = {
  getProjects: () => api.get('/api/projects'),
  
  getUserProjects: (username: string) => api.get(`/api/projects/user/${username}`),
  
  getDraftProjects: () => api.get('/api/projects/drafts'),
  
  getProject: (id: number) => api.get(`/api/projects/${id}`),
  
  createProject: (data: any) => api.post('/api/projects', data),
  
  updateProject: (id: number, data: any) => api.put(`/api/projects/${id}`, data),
  
  deleteProject: (id: number) => api.delete(`/api/projects/${id}`),
  
  publishProject: (id: number) => api.post(`/api/projects/${id}/publish`),
  
  getProjectMedia: (id: number) => api.get(`/api/projects/${id}/media`),
  
  addProjectMedia: (id: number, data: any) => api.post(`/api/projects/${id}/media`, data),
  
  deleteProjectMedia: (projectId: number, mediaId: number) =>
    api.delete(`/api/projects/${projectId}/media/${mediaId}`),
  
  trackView: (id: number) => api.post(`/api/projects/${id}/view`),
  
  trackClick: (id: number) => api.post(`/api/projects/${id}/click`),
};

// Economy API
export const economyAPI = {
  getPoints: () => api.get('/api/economy/points'),
  
  getHistory: () => api.get('/api/economy/history'),
  
  getRewards: () => api.get('/api/economy/rewards'),
};

// Analytics API
export const analyticsAPI = {
  getProfileAnalytics: () => api.get('/api/analytics/profile'),
  getDailyAnalytics: () => api.get('/api/analytics/daily'),
};

// Uploads API
export const uploadsAPI = {
  uploadProfilePicture: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/uploads/profile-picture', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  
  uploadMedia: (file: File, mediaType: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('media_type', mediaType);
    return api.post('/api/uploads/media', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  
  uploadProjectCover: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/uploads/project-cover', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// Settings API
export const settingsAPI = {
  // 2FA endpoints
  get2FAStatus: () => api.get('/api/settings/account/2fa/status'),
  
  enable2FA: () => api.post('/api/settings/account/2fa/enable'),
  
  verify2FASetup: (token: string) => 
    api.post('/api/settings/account/2fa/verify', { token }),
  
  disable2FA: (token: string) => 
    api.post('/api/settings/account/2fa/disable', { token }),
  
  // Account settings
  changeEmail: (newEmail: string, password: string) =>
    api.post('/api/settings/account/change-email', { new_email: newEmail, password }),
  
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/api/settings/account/change-password', { 
      current_password: currentPassword, 
      new_password: newPassword 
    }),
};

// Admin API
export const adminAPI = {
  // Dashboard
  getStats: () => api.get('/api/admin/stats'),
  getActivity: (limit: number = 50) => api.get(`/api/admin/activity?limit=${limit}`),
  
  // Users
  listUsers: (params: { page?: number; limit?: number; search?: string; role?: string; banned?: string }) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.limit) searchParams.set('limit', params.limit.toString());
    if (params.search) searchParams.set('search', params.search);
    if (params.role) searchParams.set('role', params.role);
    if (params.banned) searchParams.set('banned', params.banned);
    return api.get(`/api/admin/users?${searchParams.toString()}`);
  },
  getUser: (userId: number) => api.get(`/api/admin/users/${userId}`),
  banUser: (userId: number, reason: string) => api.post(`/api/admin/users/${userId}/ban`, { reason }),
  unbanUser: (userId: number) => api.post(`/api/admin/users/${userId}/unban`),
  deleteUser: (userId: number) => api.delete(`/api/admin/users/${userId}`),
  
  // Reports
  listReports: (params: { page?: number; limit?: number; status?: string; target_type?: string }) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.limit) searchParams.set('limit', params.limit.toString());
    if (params.status) searchParams.set('status', params.status);
    if (params.target_type) searchParams.set('target_type', params.target_type);
    return api.get(`/api/admin/reports?${searchParams.toString()}`);
  },
  getReport: (reportId: number) => api.get(`/api/admin/reports/${reportId}`),
  resolveReport: (reportId: number, action: 'resolve' | 'dismiss', note?: string) => 
    api.put(`/api/admin/reports/${reportId}/resolve`, { action, resolution_note: note }),
  
  // Admin Team
  listAdmins: () => api.get('/api/admin/admins'),
  promoteUser: (userId: number, newRole: string) => api.post(`/api/admin/admins/${userId}/promote`, { new_role: newRole }),
  demoteUser: (userId: number) => api.post(`/api/admin/admins/${userId}/demote`),
  
  // Setup
  setupFirstAdmin: (secretKey: string, userId: number) => 
    api.post('/api/admin/setup-first-admin', { secret_key: secretKey, user_id: userId }),
};
