import React, { createContext, useContext, useState, useEffect } from 'react';
// Removed incorrect axios type imports
// Type guard for error objects with message and response
function isErrorWithResponse(error: unknown): error is { message?: string; response?: { status?: number; data?: { error?: { code?: string } } }; code?: string; stack?: string } {
  return typeof error === 'object' && error !== null && ('message' in error || 'response' in error);
}
import { User, AuthContextType } from '../types';
import { apiClient } from '@/lib/api';
import { LoginRequest, RegisterRequest } from '../types/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthInitializing, setIsAuthInitializing] = useState(true);

  // Check token validity and refresh user data
  const refreshUserData = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      logout();
      return;
    }

    apiClient.setToken(token);

    // Retry-once for transient network errors. Only logout for explicit auth failures.
    let attempts = 0;
    const maxAttempts = 2;
    const backoff = (n: number) => 1000 * n;

    while (attempts < maxAttempts) {
      try {
        const response = await apiClient.request<{ user: User }>('GET', '/auth/verify');

        if (response.success && response.data) {
          localStorage.setItem('user', JSON.stringify(response.data.user));
          setUser(response.data.user);
          setIsAuthenticated(true);
          return;
        }

        // If server returned an auth-specific error, force logout
        const code = response.error?.code;
        if (code === 'TOKEN_EXPIRED' || code === 'INVALID_TOKEN' || response.error?.message?.toLowerCase()?.includes('token')) {
          logout();
          return;
        }

        // For any other error shape, throw to be handled below (may retry)
        throw new Error(response.error?.message || 'Failed to refresh user data');
      } catch (error: unknown) {
        attempts += 1;
        let status: number | undefined, errCode: string | undefined, message: string | undefined;
        if (isErrorWithResponse(error)) {
          status = error.response?.status;
          errCode = error.response?.data?.error?.code || error.code;
          message = error.message;
        } else if (error && typeof error === 'object' && 'message' in error) {
          message = (error as { message?: string }).message;
        } else {
          message = error instanceof Error ? error.message : String(error);
        }
        if (status === 401 || errCode === 'TOKEN_EXPIRED' || errCode === 'INVALID_TOKEN') {
          logout();
          return;
        }
        if ((!status && message && message.toLowerCase().includes('network')) && attempts < maxAttempts) {
          await new Promise((r) => setTimeout(r, backoff(attempts)));
          continue;
        }
        console.warn('refreshUserData failed, keeping existing session without forcing logout', { attempts, error });
        return;
      }
    }
  };

  // Test API connection
  useEffect(() => {
    const testApiConnection = async () => {
      try {
        console.log('Testing API connection...');
        const response = await fetch('http://localhost:5000/api/health');
        if (response.ok) {
          console.log('API Connection test successful');
        } else {
          console.warn('API returned non-200 status:', response.status);
        }
      } catch (error) {
        console.error('API Connection test failed:', error);
      }
    };
    testApiConnection();
  }, []);

  // Initial auth check and setup
  useEffect(() => {
    const initAuth = async () => {
      setIsAuthInitializing(true);
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (token && storedUser) {
        try {
          // First set the stored user to prevent flicker
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setIsAuthenticated(true);
          apiClient.setToken(token);

          // Then verify with the server. Only logout for explicit token errors; for other errors keep local state.
          const response = await apiClient.request<{ user: User }>('GET', '/auth/verify');
          if (response.success && response.data) {
            if (
              response.data.user.email !== parsedUser.email || 
              response.data.user.role !== parsedUser.role
            ) {
              // User data mismatch - force logout
              console.warn('User data mismatch detected');
              logout();
              return;
            }

            setUser(response.data.user);
            setIsAuthenticated(true);
            localStorage.setItem('user', JSON.stringify(response.data.user));
          } else if (response.error?.code === 'TOKEN_EXPIRED' || response.error?.code === 'INVALID_TOKEN') {
            console.log('Token invalid or expired, logging out');
            logout();
            return;
          } else {
            // Non-auth related failure during init: keep local user to avoid forcing logout on transient failures
            console.warn('Token verification failed during init but is not an auth error; keeping local session', response.error);
          }
        } catch (error: unknown) {
          console.error('Auth verification error during init:', error);
          let status: number | undefined, errCode: string | undefined;
          if (isErrorWithResponse(error)) {
            status = error.response?.status;
            errCode = error.response?.data?.error?.code;
          }
          if (status === 401 || errCode === 'TOKEN_EXPIRED') {
            logout();
          }
        }
      }
      setIsAuthInitializing(false);
    };
    
    initAuth();
  }, []);

  // Refresh token every 30 minutes to keep session alive
  useEffect(() => {
    if (isAuthenticated) {
      const interval = setInterval(refreshUserData, 30 * 60 * 1000); // 30 minutes
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, refreshUserData]);

  const login = async (email: string, password: string, role: User['role']): Promise<boolean> => {
    try {
      // Clear any existing auth data before attempting login
      logout();

      console.log('Attempting login with:', { email, role });
      const loginData: LoginRequest = { email, password, role };
      const response = await apiClient.login(loginData);

      console.log('Login response:', {
        success: response.success,
        hasData: !!response.data,
        error: response.error
      });

      if (response.success && response.data) {
        // Validate the response data
        const { token, user } = response.data;
        
        if (!token || !user || !user.email || user.role !== role) {
          console.error('Invalid login response data:', response.data);
          throw new Error('Invalid login response from server');
        }

        // Store auth data
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        apiClient.setToken(token);
        
        // Update state
        setUser(user);
        setIsAuthenticated(true);
  try { window.dispatchEvent(new CustomEvent('app:auth-changed')); } catch { /* ignore */ }
        
        console.log('Login successful for role:', role);
        return true;
      }

      // Enhanced error handling with specific messages
      if (response.error?.code === 'INVALID_CREDENTIALS') {
        throw new Error('Invalid email or password');
      } else if (response.error?.code === 'INVALID_ROLE') {
        throw new Error('Invalid role selected for this user');
      }

      throw new Error(response.error?.message || 'Login failed. Please try again.');
    } catch (error: unknown) {
      let message: string | undefined, response: unknown, status: number | undefined, stack: string | undefined;
      if (isErrorWithResponse(error)) {
        message = error.message;
        response = error.response?.data;
        status = error.response?.status;
        stack = error.stack;
      } else if (error && typeof error === 'object' && 'message' in error) {
        message = (error as { message?: string }).message;
        stack = (error as { stack?: string }).stack;
      } else {
        message = error instanceof Error ? error.message : String(error);
      }
      console.error('Login error:', { message, response, status, stack });
      throw error;
    }
  };

  const register = async (userData: RegisterRequest): Promise<boolean> => {
    try {
      const response = await apiClient.register(userData);

      if (response.success) {
        // Successful registration but don't automatically log in
        // Clear any existing auth data to ensure a clean login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        apiClient.clearToken();
        setUser(null);
        setIsAuthenticated(false);
        return true;
      }

      throw new Error(response.error?.message || 'Registration failed');
    } catch (error: unknown) {
      console.error('Registration error:', error);
      return false;
    }
  };

  const logout = () => {
    // Clear all auth-related storage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('selectedRole');
    sessionStorage.clear();
    
    // Reset state
    apiClient.clearToken();
    setUser(null);
    setIsAuthenticated(false);
    try { window.dispatchEvent(new CustomEvent('app:auth-changed')); } catch { /* ignore */ }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated, isAuthInitializing }}>
      {children}
    </AuthContext.Provider>
  );
};