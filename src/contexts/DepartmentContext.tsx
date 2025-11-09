import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

interface Department {
  name: string;
  total: number;
  students: number;
  faculty: number;
  subAdmins: number;
}

interface DepartmentContextType {
  departments: Department[];
  refreshDepartments: () => Promise<void>;
}

const DepartmentContext = createContext<DepartmentContextType | undefined>(undefined);

export const useDepartments = () => {
  const context = useContext(DepartmentContext);
  if (context === undefined) {
    throw new Error('useDepartments must be used within a DepartmentProvider');
  }
  return context;
};

export const DepartmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const { user } = useAuth();

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No auth token found');
        return;
      }

      // Use explicit API base URL (same as other contexts)
      const apiBase = (import.meta.env.VITE_API_URL as string) || 'http://localhost:5000/api';
      console.log('Fetching departments from:', `${apiBase}/departments`);

      const response = await fetch(`${apiBase}/departments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to fetch departments');
      }

      const data = await response.json();
      if (!data.departments) {
        console.warn('No departments array in response:', data);
        return;
      }

      setDepartments(data.departments);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  // Initial fetch and refresh when user changes
  useEffect(() => {
    if (user) {
      fetchDepartments();
    }
  }, [user]);

  return (
    <DepartmentContext.Provider value={{
      departments,
      refreshDepartments: fetchDepartments
    }}>
      {children}
    </DepartmentContext.Provider>
  );
};
