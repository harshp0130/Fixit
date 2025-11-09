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
        success: false,
        error: { message: 'Access denied. No authentication token provided.' }
      });
    }

    // Check if it's a Bearer token
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false,
        error: { message: 'Invalid token format. Must be a Bearer token.' }
      });
    }

    const token = authHeader.replace('Bearer ', '');

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;

      // Get user from database - check existence first
      const user = await User.findById(decoded.user.id)
        .select('-password')
        .exec() as (IUser & { _id: mongoose.Types.ObjectId }) | null;

      if (!user) {
        return res.status(401).json({ 
          success: false,
          error: { message: 'User not found or has been deleted.' }
        });
      }

      // Validate user role matches the one in token
      if (decoded.user.role !== user.role) {
        return res.status(403).json({ 
          success: false,
          error: { message: 'Invalid user role. Please login again.' }
        });
      }

      // Add user to request object
      req.user = user;
      next();
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        return res.status(401).json({ 
          success: false,
          error: { 
            message: 'Token has expired. Please login again.',
            code: 'TOKEN_EXPIRED'
          }
        });
      } else if (err instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({ 
          success: false,
          error: {
            message: 'Invalid token. Please login again.',
            code: 'INVALID_TOKEN'
          }
        });
      } else {
        console.error('Token verification error:', err);
        return res.status(401).json({ 
          success: false,
          error: {
            message: 'Token verification failed.',
            code: 'TOKEN_VERIFY_FAILED'
          }
        });
      }
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ 
      success: false,
      error: { message: 'Internal server error during authentication.' }
    });
  }
};

export default auth;
