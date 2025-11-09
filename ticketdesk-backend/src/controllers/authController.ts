import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User, { IUser } from '../models/User';
import { TokenData, JWTPayload } from '../types/auth';

// Helper function to generate JWT token
const generateToken = (user: IUser & { _id: mongoose.Types.ObjectId }): TokenData => {
  const payload: JWTPayload = {
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department
    }
  };

  const token = jwt.sign(
    payload,
    process.env.JWT_SECRET!,
    { 
      expiresIn: '24h',  // Increase token lifetime
      algorithm: 'HS256'
    }
  );

  return {
    token,
    expiresIn: 86400 // 24 hours in seconds
  };
};

const validateEmail = (email: string, role: string): boolean => {
  if (role === 'student' || role === 'faculty') {
    return email.endsWith('@paruluniversity.ac.in');
  }
  return true; // For admin roles, any valid email is acceptable
};

export const registerUser = async (req: Request, res: Response) => {
  const { name, email, password, role, department } = req.body;
  
  console.log('Registration attempt:', { name, email, role, department }); // Debug log

  // Validate required fields
  if (!email || !password || !role) {
    console.log('Missing required fields');
    return res.status(400).json({ 
      success: false,
      error: {
        message: 'Please provide all required fields: email, password, and role',
        code: 'MISSING_FIELDS'
      }
    });
  }

  if (!validateEmail(email, role)) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Students and faculty must use an @paruluniversity.ac.in email address',
        code: 'INVALID_EMAIL_DOMAIN'
      }
    });
  }

  try {
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'User already exists with this email',
          code: 'USER_ALREADY_EXISTS'
        }
      });
    }

    // Create new user
    user = new User({
      name,
      email,
      password,
      role,
      department: department || 'Not Specified'
    });

    // Save user to database
    const savedUser = await user.save() as (IUser & { _id: mongoose.Types.ObjectId });

    // Return success in a consistent ApiResponse shape
    res.status(201).json({
      success: true,
      data: {
        message: 'User registered successfully. Please login to continue.',
        email: savedUser.email
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, error: { message: 'Server error during registration' } });
  }
};

export const verifyToken = async (req: Request, res: Response) => {
  // The auth middleware already verified the token and attached the user
  const user = req.user!;
  
  // Respond with ApiResponse shape
  res.json({
    success: true,
    data: {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department
      }
    }
  });
};

export const loginUser = async (req: Request, res: Response) => {
  const { email, password, role } = req.body;
  console.log('Login attempt:', { email, role }); // Debug log

  // Validate required fields
  if (!email || !password) {
    console.log('Missing email or password');
    return res.status(400).json({ 
      success: false,
      error: { message: 'Please provide both email and password' }
    });
  }

  try {
    console.log('Attempting to find user:', { email, role });
    // Find user by email
    const user = await User.findOne({ email }) as (IUser & { _id: mongoose.Types.ObjectId });
    console.log('Database query result:', { 
      found: !!user,
      userRole: user?.role,
      requestedRole: role
    });

    if (!user) {
      console.log('No user found with email:', { email });
      return res.status(400).json({ 
        success: false,
        error: { 
          message: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS'
        }
      });
    }

    // Check if role matches if one was provided
    if (role && user.role !== role) {
      console.log('Role mismatch:', { expected: role, actual: user.role }); // Debug log
      return res.status(400).json({ success: false, error: { message: 'Invalid role for this user', code: 'INVALID_ROLE' } });
    }

    // Verify password
    try {
      const isMatch = await bcrypt.compare(password, user.password!);
      console.log('Password comparison result:', isMatch);

      if (!isMatch) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Invalid credentials',
            code: 'INVALID_CREDENTIALS'
          }
        });
      }
    } catch (error) {
      console.error('Password comparison error:', error);
      return res.status(400).json({
        success: false,
        error: {
          message: 'Error verifying credentials',
          code: 'PASSWORD_VERIFICATION_ERROR'
        }
      });
    }

    // Generate token
    const { token, expiresIn } = generateToken(user);

    // Return success with user details and token in ApiResponse shape
    res.json({
      success: true,
      data: {
        token,
        expiresIn,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: { message: 'Server error during login' } });
  }
};