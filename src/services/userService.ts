import { User } from '../types';

const API_BASE_URL = '/api';

export const userService = {
  getAllUsers: async (): Promise<User[]> => {
    const token = localStorage.getItem('token');
    const response = await fetch(`$https://infrastructureservice-backend.onrender.com/users`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
  },

  addUser: async (userData: Omit<User, 'id'> & { password: string }): Promise<User> => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(userData)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to add user');
    }
    return response.json();
  },

  updateUser: async (id: string, userData: Partial<User>): Promise<User> => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(userData)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update user');
    }
    return response.json();
  },

  deleteUser: async (id: string): Promise<void> => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete user');
    }
  },

  validateToken: async (): Promise<boolean> => {
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/validate`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      return response.ok;
    } catch {
      return false;
    }
  }
};
