import { Request, Response, NextFunction } from 'express';
import { IUser } from '../models/User';

export const subAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = req.user as IUser;
  if (!user || (user.role !== 'sub_admin' && user.role !== 'super_admin')) {
    return res.status(403).json({ message: 'Access denied. Admins only.' });
  }
  next();
};

export const superAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = req.user as IUser;
  if (!user || user.role !== 'super_admin') {
    return res.status(403).json({ message: 'Access denied. Super Admin only.' });
  }
  next();
};