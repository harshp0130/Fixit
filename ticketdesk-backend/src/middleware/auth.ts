import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User, { IUser } from '../models/User';
import { AuthRequest, JWTPayload } from '../types/auth';

const auth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return res.status(401).json({ 
        message: 'Access denied. No authentication token provided.' 
      });
    }

    // Check if it's a Bearer token
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        message: 'Invalid token format. Must be a Bearer token.' 
      });
    }

    const token = authHeader.replace('Bearer ', '');

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
      
      // Check token expiration
      if (decoded.exp && decoded.exp < Date.now() / 1000) {
        return res.status(401).json({ 
          message: 'Token has expired. Please login again.' 
        });
      }

      // Get user from database
      const user = await User.findById(decoded.user.id)
        .select('-password')
        .exec() as (IUser & { _id: mongoose.Types.ObjectId }) | null;

      if (!user) {
        return res.status(401).json({ 
          message: 'User not found or has been deleted.' 
        });
      }

      // Add user to request object
      req.user = user;
      next();
    } catch (err) {
      if (err instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({ 
          message: 'Invalid token. Please login again.' 
        });
      } else if (err instanceof jwt.TokenExpiredError) {
        return res.status(401).json({ 
          message: 'Token has expired. Please login again.' 
        });
      } else {
        return res.status(401).json({ 
          message: 'Token verification failed.' 
        });
      }
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ 
      message: 'Internal server error during authentication.' 
    });
  }
};

export default auth;
