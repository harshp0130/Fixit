import { useContext } from 'react';
import { DepartmentContext } from './DepartmentContext';

const useDepartments = () => {
  const context = useContext(DepartmentContext);
  if (context === undefined) {
    throw new Error('useDepartments must be used within a DepartmentProvider');
  }
  return context;
};

export default useDepartments;
