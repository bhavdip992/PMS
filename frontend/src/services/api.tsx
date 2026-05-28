import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore.tsx';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true, // Send cookies (for refresh token)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach access token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Auto refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401 Unauthorized and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const localToken = localStorage.getItem('refreshToken');
        // Attempt to get a new access token using the refresh cookie or local storage fallback
        const response = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          { refreshToken: localToken },
          { withCredentials: true }
        );

        const { accessToken, refreshToken, user } = response.data.data;
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
        }

        // Update credentials in global store
        useAuthStore.getState().setCredentials(accessToken, user);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh token expired or invalid -> log out user
        localStorage.removeItem('refreshToken');
        useAuthStore.getState().clearCredentials();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
