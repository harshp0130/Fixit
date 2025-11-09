import axios from 'axios';
import {
  ApiResponse,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  CreateTicketRequest,
  UpdateTicketRequest,
  TicketListResponse,
  TicketResponse,
  UpdateTicketResponse,
  DepartmentListResponse,
} from '../types/api';

class ApiClient {
  private client;

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: false
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response: any) => response,
      (error: any) => {
        if (error?.response?.status === 401) {
            // Handle unauthorized access: clear stored auth and emit a global event so UI can redirect
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            this.clearToken();
            try {
              window.dispatchEvent(new CustomEvent('app:unauthorized'));
            } catch (e) {
              console.warn('Could not dispatch unauthorized event', e);
            }
        }
        return Promise.reject(error);
      }
    );
  }

  setToken(token: string) {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  clearToken() {
    delete this.client.defaults.headers.common['Authorization'];
  }

  async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    url: string,
    data?: unknown
  ): Promise<ApiResponse<T>> {
    try {
      console.log(`Making ${method} request to ${url}`, {
        baseURL: this.client.defaults.baseURL,
        headers: this.client.defaults.headers,
        data: method !== 'GET' ? data : undefined
      });

      const response = await this.client.request({
        method,
        url,
        data,
        validateStatus: (status) => {
          // Consider only 2xx status codes as successful
          return status >= 200 && status < 300;
        }
      });

      console.log(`Response from ${url}:`, {
        status: response.status,
        data: response.data
      });

      // Validate response format
      const responseData = response.data as { success?: boolean; data?: any; error?: any };
      
      if (typeof responseData?.success !== 'boolean') {
        console.error('Invalid response format:', responseData);
        throw new Error('Invalid response format from server');
      }
      
      if (responseData.success && !responseData.data && !url.includes('/health')) {
        console.error('Success response missing data:', responseData);
        throw new Error('Invalid success response format');
      }
      
      if (!responseData.success && !responseData.error) {
        console.error('Error response missing error details:', responseData);
        throw new Error('Invalid error response format');
      }

      return response.data as ApiResponse<T>;
    } catch (error: any) {
      console.error(`Error in ${method} ${url}:`, {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        stack: error.stack
      });

      if (error.response?.status === 401) {
        // Clear token on auth errors and surface the error to the caller so UI can redirect
        this.clearToken();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        console.warn(`Unauthorized response for ${method} ${url}`);
      }

      if (error.response?.data && typeof error.response.data.success === 'boolean') {
        return error.response.data as ApiResponse<T>;
      }

      return {
        success: false,
        error: {
          message: error.message || 'An unexpected error occurred',
          code: error.response?.status === 401 ? 'UNAUTHORIZED' : 'UNKNOWN_ERROR',
        },
      };
    }
  }

  // Auth endpoints
  async login(data: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    console.log('API Client - Login request:', { 
      url: this.client.defaults.baseURL + '/auth/login',
      data: { ...data, password: '***' } 
    });
    try {
      const response = await this.request<LoginResponse>('POST', '/auth/login', data);
      console.log('API Client - Login response:', {
        success: response.success,
        hasData: !!response.data,
        error: response.error
      });
      return response;
    } catch (error) {
      console.error('API Client - Login error:', error);
      throw error;
    }
  }

  async register(data: RegisterRequest): Promise<ApiResponse<RegisterResponse>> {
    return this.request<RegisterResponse>('POST', '/auth/register', data);
  }

  // Ticket endpoints
  async getTickets(
    page = 1,
    limit = 10,
    filters?: { status?: string; department?: string }
  ): Promise<ApiResponse<TicketListResponse>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(filters?.status && { status: filters.status }),
      ...(filters?.department && { department: filters.department }),
    });
    return this.request<TicketListResponse>('GET', `/tickets?${params}`);
  }

  async createTicket(data: CreateTicketRequest): Promise<ApiResponse<TicketResponse>> {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === 'imageFile' && value instanceof File) {
          formData.append('imageFile', value);
        } else {
          formData.append(key, value.toString());
        }
      }
    });

    return this.request<TicketResponse>('POST', '/tickets', formData);
  }

  async updateTicket(
    ticketId: string,
    data: UpdateTicketRequest
  ): Promise<ApiResponse<UpdateTicketResponse>> {
    return this.request<UpdateTicketResponse>('PUT', `/tickets/${ticketId}`, data);
  }

  async getTicketById(ticketId: string): Promise<ApiResponse<TicketResponse>> {
    return this.request<TicketResponse>('GET', `/tickets/${ticketId}`);
  }

  // Department endpoints
  async getDepartments(): Promise<ApiResponse<DepartmentListResponse>> {
    return this.request<DepartmentListResponse>('GET', '/departments');
  }
}

export const apiClient = new ApiClient();