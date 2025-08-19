import { Request, Response, NextFunction } from 'express';
import { IUser } from '../models/User';
import mongoose from 'mongoose';

interface AuthenticatedUser extends IUser {
  _id: mongoose.Types.ObjectId;
}

// Permission levels
const PERMISSION_LEVELS = {
  'super_admin': 4,
  'sub_admin': 3,
  'faculty': 2,
  'student': 1
};

interface PermissionRequest extends Request {
  targetDepartment?: string;
  targetRole?: string;
}

// Check if user has sufficient permission level
const hasPermissionLevel = (userRole: string, requiredRole: string): boolean => {
  return PERMISSION_LEVELS[userRole as keyof typeof PERMISSION_LEVELS] >= 
         PERMISSION_LEVELS[requiredRole as keyof typeof PERMISSION_LEVELS];
};

// Middleware to check minimum required role
export const requireRole = (minimumRole: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as AuthenticatedUser;
    
    if (!user || !hasPermissionLevel(user.role, minimumRole)) {
      return res.status(403).json({ 
        message: `Access denied. Minimum role required: ${minimumRole}` 
      });
    }
    
    next();
  };
};

// Middleware to check if user can manage specific roles
export const canManageRole = (req: PermissionRequest, res: Response, next: NextFunction) => {
  const user = req.user as AuthenticatedUser;
  const targetRole = req.body.role || req.targetRole;
  
  if (!user || !targetRole) {
    return res.status(403).json({ message: 'Access denied' });
  }

  // Super admin can manage all roles
  if (user.role === 'super_admin') {
    return next();
  }

  // Sub admin can only manage students and faculty
  if (user.role === 'sub_admin' && !['student', 'faculty'].includes(targetRole)) {
    return res.status(403).json({ 
      message: 'Sub-admins can only manage students and faculty' 
    });
  }

  // Faculty can't manage other users
  if (user.role === 'faculty') {
    return res.status(403).json({ 
      message: 'Faculty members cannot manage user roles' 
    });
  }

  // Prevent managing higher or equal role
  if (!hasPermissionLevel(user.role, targetRole)) {
    return res.status(403).json({ 
      message: 'Cannot manage users with equal or higher roles' 
    });
  }

  next();
};

// Middleware to check if user can manage specific departments
export const canManageDepartment = (req: PermissionRequest, res: Response, next: NextFunction) => {
  const user = req.user as IUser;
  const targetDepartment = req.body.department || req.targetDepartment;
  
  if (!user) {
    return res.status(403).json({ message: 'Access denied' });
  }

  // Super admin can manage all departments
  if (user.role === 'super_admin') {
    return next();
  }

  // Sub admin can only manage their own department
  if (user.role === 'sub_admin' && user.department !== targetDepartment) {
    return res.status(403).json({ 
      message: 'You can only manage users in your own department' 
    });
  }

  next();
};

// Middleware to check if user can modify super admin accounts
export const canModifySuperAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = req.user as AuthenticatedUser;
  const targetUserId = req.params.id;
  const targetRole = req.body.role;

  if (!user || user.role !== 'super_admin') {
    return res.status(403).json({ 
      message: 'Only super admins can modify super admin accounts' 
    });
  }

  // Prevent super admin from modifying their own account
  if (targetUserId === user._id.toString()) {
    return res.status(403).json({ 
      message: 'Cannot modify your own super admin account' 
    });
  }

  // Only allow creating new super admins if explicitly requested
  if (targetRole === 'super_admin' && !targetUserId) {
    return res.status(403).json({ 
      message: 'Creating new super admin accounts requires special authorization' 
    });
  }

  next();
};

// Middleware to validate department operations
export const validateDepartmentOperation = (req: Request, res: Response, next: NextFunction) => {
  const user = req.user as IUser;
  const operation = req.body.operation;
  
  if (!user || user.role !== 'super_admin') {
    return res.status(403).json({ 
      message: 'Only super admins can perform department operations' 
    });
  }

  if (!['create', 'update', 'delete', 'merge'].includes(operation)) {
    return res.status(400).json({ 
      message: 'Invalid department operation' 
    });
  }

  next();
};
