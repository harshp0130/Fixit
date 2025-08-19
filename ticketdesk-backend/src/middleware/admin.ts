import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types/auth';

// Type for extended request with department parameter
interface DepartmentRequest extends AuthRequest {
  targetDepartment?: string;
}

export const subAdmin = (req: DepartmentRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  
  // No user or invalid role
  if (!user || (user.role !== 'sub_admin' && user.role !== 'super_admin')) {
    return res.status(403).json({ 
      message: 'Access denied. Admin privileges required.' 
    });
  }

  // Super admin has full access
  if (user.role === 'super_admin') {
    return next();
  }

  // For sub-admin, check department access if department is specified
  const targetDepartment = req.targetDepartment || req.body.department;
  if (user.role === 'sub_admin' && targetDepartment && targetDepartment !== user.department) {
    return res.status(403).json({ 
      message: 'Access denied. You can only manage your own department.' 
    });
  }

  next();
};

export const superAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  
  if (!user || user.role !== 'super_admin') {
    return res.status(403).json({ 
      message: 'Access denied. Super Admin privileges required.' 
    });
  }

  // Check if trying to modify another super admin
  const targetUserId = req.params.id;
  const targetRole = req.body.role;

  if (targetUserId === user._id.toString()) {
    return res.status(403).json({ 
      message: 'Cannot modify your own super admin account.' 
    });
  }

  next();
};

// Middleware to check department-level access
export const departmentAccess = (req: DepartmentRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  const targetDepartment = req.targetDepartment || req.body.department;

  if (!user) {
    return res.status(403).json({ 
      message: 'Access denied. Authentication required.' 
    });
  }

  // Super admin has access to all departments
  if (user.role === 'super_admin') {
    return next();
  }

  // Sub admin can only access their department
  if (user.role === 'sub_admin' && user.department !== targetDepartment) {
    return res.status(403).json({ 
      message: 'Access denied. You can only access your own department.' 
    });
  }

  // Students/Faculty can only access their own department
  if (['student', 'faculty'].includes(user.role) && user.department !== targetDepartment) {
    return res.status(403).json({ 
      message: 'Access denied. Department mismatch.' 
    });
  }

  next();
};