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
      if (!token) return;

      const response = await fetch('/api/departments', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch departments');
      }

      const data = await response.json();
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
