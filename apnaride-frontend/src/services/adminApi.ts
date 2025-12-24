import axios, { 
  AxiosError, 
  AxiosInstance, 
  AxiosRequestConfig, 
  AxiosResponse, 
  InternalAxiosRequestConfig,
  AxiosRequestHeaders
} from 'axios';
import { DashboardStats, ActivityItem } from '../types/admin';

// Extend the default AxiosRequestConfig to include our custom properties
declare module 'axios' {
  interface AxiosRequestConfig {
    _retry?: boolean;
  }
}

const API_BASE = (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_API_BASE)
  ? (import.meta as any).env.VITE_API_BASE
  : (process.env.REACT_APP_API_URL || '/api');

// Interfaces for API responses
interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

interface LoginResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

interface RefreshTokenResponse {
  token: string;
}

export class ApiError extends Error {
  status?: number;
  code?: string;
  
  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export class AdminApi {
  private api: AxiosInstance;
  private refreshTokenRequest: Promise<AxiosResponse<ApiResponse<RefreshTokenResponse>>> | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
      timeout: 30000, // 30 seconds
    });

    this.initializeInterceptors();
  }

  private initializeInterceptors(): void {
    // Request interceptor
    this.api.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('token');
        if (token) {
          const headers = config.headers as AxiosRequestHeaders & { Authorization?: string };
          headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error: unknown) => Promise.reject(error)
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: AxiosError) => {
        if (!error.config) {
          return Promise.reject(error);
        }
        
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
        
        // If error is not a 401 or the request was already retried, reject
        if (error.response?.status !== 401 || originalRequest?._retry) {
          return Promise.reject(this.handleApiError(error));
        }

        // Mark request as retried to prevent infinite loops
        originalRequest._retry = true;

        try {
          // Try to refresh token
          const response = await this.refreshToken();
          const { token } = response.data.data;
          
          // Save new token
          localStorage.setItem('token', token);
          
          // Update Authorization header
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          
          // Retry the original request
          return this.api(originalRequest);
        } catch (refreshError) {
          // If refresh token fails, log out user
          this.logout();
          return Promise.reject(refreshError);
        }
      }
    );
  }

  private handleApiError(error: unknown): ApiError {
    if (error instanceof ApiError) {
      return error;
    }

    const axiosError = error as AxiosError;
    
    if (axiosError.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const { status, data } = axiosError.response as any;
      const message = data?.message || axiosError.message;
      const code = data?.code || 'API_ERROR';
      
      return new ApiError(message, status, code);
    } else if (axiosError.request) {
      // The request was made but no response was received
      return new ApiError('No response from server. Please check your connection.', 0, 'NETWORK_ERROR');
    } else {
      // Something happened in setting up the request that triggered an Error
      return new ApiError(axiosError.message || 'An unknown error occurred', 0, 'REQUEST_ERROR');
    }
  }

  private async refreshToken(): Promise<AxiosResponse<ApiResponse<RefreshTokenResponse>>> {
    if (!this.refreshTokenRequest) {
      this.refreshTokenRequest = this.api.post<ApiResponse<RefreshTokenResponse>>('/auth/refresh-token');
      try {
        return await this.refreshTokenRequest;
      } finally {
        this.refreshTokenRequest = null;
      }
    }
    return this.refreshTokenRequest;
  }

  public logout(): void {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = '/login';
  }

  // Auth methods
  public async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await this.api.post<ApiResponse<LoginResponse>>('/auth/login', { email, password });
      if (response.data.data?.token) {
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
      }
      return response.data.data;
    } catch (error) {
      throw this.handleApiError(error as AxiosError);
    }
  }

  // Dashboard methods
  public async getDashboardStats(): Promise<DashboardStats> {
    try {
      const response = await this.api.get<ApiResponse<DashboardStats>>('/admin/dashboard/stats');
      return response.data.data;
    } catch (error) {
      throw this.handleApiError(error as AxiosError);
    }
  }

  public async getRecentActivities(limit = 10): Promise<ActivityItem[]> {
    try {
      const response = await this.api.get<ApiResponse<ActivityItem[]>>(
        `/admin/activities?limit=${limit}`
      );
      return response.data.data || [];
    } catch (error) {
      throw this.handleApiError(error as AxiosError);
    }
  }
}

export const adminApi = new AdminApi();
