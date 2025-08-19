import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Add auth token to all requests
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'faculty' | 'sub_admin' | 'super_admin';
  department?: string;
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: string;
  department?: string;
}

export const userApi = {
  getUsers: async (): Promise<User[]> => {
    try {
      const response = await axios.get(`${API_URL}/users`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch users');
    }
  },

  createUser: async (userData: CreateUserData): Promise<{ message: string }> => {
    try {
      const response = await axios.post(`${API_URL}/users`, userData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create user');
    }
  },

  updateUser: async (id: string, userData: Partial<CreateUserData>): Promise<{ message: string }> => {
    try {
      const response = await axios.put(`${API_URL}/users/${id}`, userData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update user');
    }
  },

  deleteUser: async (id: string): Promise<{ message: string }> => {
    try {
      const response = await axios.delete(`${API_URL}/users/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete user');
    }
  },

  getDepartments: async (): Promise<string[]> => {
    try {
      const response = await axios.get(`${API_URL}/departments`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch departments');
    }
  }
};
