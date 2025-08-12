import mongoose from 'mongoose';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';

declare global {
  namespace Express {
    interface Request {
      user?: IUser & { _id: mongoose.Types.ObjectId };
    }
  }
}

const auth = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    // Correctly cast the result to ensure TypeScript knows the _id's type
    req.user = (await User.findById(decoded.user.id).select('-password')) as (IUser & { _id: mongoose.Types.ObjectId });
    if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
    }
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};
export default auth;
