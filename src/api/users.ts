import axios from 'axios';
import type { User } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Add auth token to all requests
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: User['role'];
  department?: string;
}

interface ApiResponse<T> {
  data: T;
  message: string;
}

export const userApi = {
  getUsers: async (): Promise<User[]> => {
    try {
      const response = await axios.get<ApiResponse<User[]>>(`${API_URL}/users`);
      return response.data.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      throw new Error(err?.response?.data?.message || 'Failed to fetch users');
    }
  },

  createUser: async (userData: CreateUserData): Promise<{ message: string }> => {
    try {
      const response = await axios.post<ApiResponse<void>>(`${API_URL}/users`, userData);
      return { message: response.data.message };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      throw new Error(err?.response?.data?.message || 'Failed to create user');
    }
  },

  updateUser: async (id: string, userData: Partial<CreateUserData>): Promise<{ message: string }> => {
    try {
      const response = await axios.put<ApiResponse<void>>(`${API_URL}/users/${id}`, userData);
      return { message: response.data.message };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      throw new Error(err?.response?.data?.message || 'Failed to update user');
    }
  },

  deleteUser: async (id: string): Promise<{ message: string }> => {
    try {
      const response = await axios.delete<ApiResponse<void>>(`${API_URL}/users/${id}`);
      return { message: response.data.message };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      throw new Error(err?.response?.data?.message || 'Failed to delete user');
    }
  },

  getDepartments: async (): Promise<string[]> => {
    try {
      const response = await axios.get<ApiResponse<string[]>>(`${API_URL}/departments`);
      return response.data.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      throw new Error(err?.response?.data?.message || 'Failed to fetch departments');
    }
  }
};
